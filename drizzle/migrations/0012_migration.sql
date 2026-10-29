ALTER TABLE public.commission_rules
  ADD COLUMN IF NOT EXISTS min_commission_amount numeric,
  ADD COLUMN IF NOT EXISTS referral_fixed_amount numeric;

UPDATE public.commission_rules
   SET min_commission_amount = 500000, referral_fixed_amount = 200000,
       notes = 'Comisión mínima $500.000 por lote vendido; bono referido $200.000 fijo'
 WHERE scope = 'default' AND is_active;

CREATE OR REPLACE FUNCTION public.normalize_commission_ledger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_min numeric;
  v_ref numeric;
BEGIN
  IF NEW.status = 'pending' THEN NEW.status := 'earned'; END IF;
  NEW.originator_agent_id := COALESCE(NEW.originator_agent_id, NEW.referring_agent_id, NEW.agent_id);
  NEW.closing_agent_id := COALESCE(NEW.closing_agent_id, NEW.agent_id);

  -- Fixed CLP floors apply only to new CLP-denominated sales (UF amounts are small numbers).
  IF TG_OP = 'INSERT' AND COALESCE(NEW.sale_amount, 0) >= 1000000 THEN
    SELECT cr.min_commission_amount, cr.referral_fixed_amount INTO v_min, v_ref
      FROM public.commission_rules cr
     WHERE cr.is_active AND (cr.project_id = NEW.project_id OR cr.scope = 'default')
     ORDER BY (cr.project_id = NEW.project_id) DESC NULLS LAST
     LIMIT 1;
    IF v_min IS NOT NULL THEN
      NEW.commission_amount := GREATEST(COALESCE(NEW.commission_amount, 0), v_min);
    END IF;
    IF v_ref IS NOT NULL AND NEW.referring_agent_id IS NOT NULL THEN
      NEW.referral_amount := GREATEST(COALESCE(NEW.referral_amount, 0), v_ref);
      NEW.referral_status := COALESCE(NEW.referral_status, 'pending');
    END IF;
  END IF;
  RETURN NEW;
END; $function$;