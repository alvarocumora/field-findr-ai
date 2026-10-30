-- OfertaTerrenos: fixed CLP commissions for two verified rural projects.
-- Applies only to NEW commission rows. Existing payments/commissions remain unchanged.
-- Per-project exact amounts must not be conflated with percentage floors or network overrides.
ALTER TABLE public.commission_rules
  ADD COLUMN IF NOT EXISTS fixed_sale_amount numeric;

ALTER TABLE public.commission_rules
  DROP CONSTRAINT IF EXISTS commission_rules_fixed_sale_nonnegative;
ALTER TABLE public.commission_rules
  ADD CONSTRAINT commission_rules_fixed_sale_nonnegative
  CHECK (fixed_sale_amount IS NULL OR fixed_sale_amount >= 0);

DO $$
DECLARE
  r record;
  v_count int;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('761e73ed-cc0d-5605-a06a-4a4348523b4b'::uuid, 500000::numeric, 200000::numeric, 'Valle de Hualañé / Caone'::text),
      ('b4363fda-e99f-400d-ae95-2cbc8244b770'::uuid, 1000000::numeric, 350000::numeric, 'Valle Escondido Licantén'::text)
    ) AS v(project_id, sale_fixed, referral_fixed, project_name)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = r.project_id) THEN
      RAISE EXCEPTION 'Project % is missing; no commission rules were seeded', r.project_id;
    END IF;

    SELECT count(*) INTO v_count
    FROM public.commission_rules
    WHERE scope = 'project' AND project_id = r.project_id;
    IF v_count > 1 THEN
      RAISE EXCEPTION 'Ambiguous commission_rules for project % (% rows)', r.project_id, v_count;
    END IF;

    IF v_count = 1 THEN
      UPDATE public.commission_rules
      SET commission_rate = 0,
          referral_override_rate = 0,
          min_commission_amount = NULL,
          fixed_sale_amount = r.sale_fixed,
          referral_fixed_amount = r.referral_fixed,
          is_active = true,
          notes = 'OfertaTerrenos: comisión FIJA CLP por venta efectiva y captación; pagos requieren validación'
      WHERE scope = 'project' AND project_id = r.project_id;
    ELSE
      INSERT INTO public.commission_rules
        (scope, project_id, commission_rate, referral_override_rate,
         min_commission_amount, fixed_sale_amount, referral_fixed_amount, is_active, notes)
      VALUES
        ('project', r.project_id, 0, 0, NULL, r.sale_fixed, r.referral_fixed, true,
         'OfertaTerrenos: comisión FIJA CLP por venta efectiva y captación; pagos requieren validación');
    END IF;
  END LOOP;
END;
$$;

-- Preserve existing normalization and default-floor behaviour for OTHER projects.
-- Only new CLP-denominated sales with an active fixed project rule use fixed amounts.
CREATE OR REPLACE FUNCTION public.normalize_commission_ledger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_fixed numeric;
  v_min numeric;
  v_ref numeric;
  v_project_rule boolean := false;
BEGIN
  IF NEW.status = 'pending' THEN NEW.status := 'earned'; END IF;
  NEW.originator_agent_id := COALESCE(NEW.originator_agent_id, NEW.referring_agent_id, NEW.agent_id);
  NEW.closing_agent_id := COALESCE(NEW.closing_agent_id, NEW.agent_id);

  IF TG_OP = 'INSERT' AND COALESCE(NEW.sale_amount, 0) >= 1000000 THEN
    SELECT cr.fixed_sale_amount, cr.referral_fixed_amount, cr.min_commission_amount
      INTO v_fixed, v_ref, v_min
    FROM public.commission_rules cr
    WHERE cr.is_active AND cr.scope = 'project' AND cr.project_id = NEW.project_id
    ORDER BY cr.updated_at DESC
    LIMIT 1;
    v_project_rule := FOUND;

    IF v_project_rule AND v_fixed IS NOT NULL THEN
      NEW.commission_amount := v_fixed; -- EXACT amount, never GREATEST(percent, floor)
    ELSE
      IF NOT v_project_rule THEN
        SELECT cr.min_commission_amount, cr.referral_fixed_amount INTO v_min, v_ref
        FROM public.commission_rules cr
        WHERE cr.is_active AND cr.scope = 'default'
        ORDER BY cr.updated_at DESC LIMIT 1;
      END IF;
      IF v_min IS NOT NULL THEN
        NEW.commission_amount := GREATEST(COALESCE(NEW.commission_amount, 0), v_min);
      END IF;
    END IF;

    IF NEW.referring_agent_id IS NOT NULL AND v_ref IS NOT NULL THEN
      NEW.referral_amount := v_ref;
      IF v_ref > 0 AND COALESCE(NEW.referral_status, 'none') = 'none' THEN
        NEW.referral_status := 'pending';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$;

COMMENT ON COLUMN public.commission_rules.fixed_sale_amount IS
  'Exact CLP payable to the closing salesperson for new eligible sales. NULL = legacy percentage/floor.';

-- Legacy agent-facing payment RPCs are incompatible with the auditable admin ledger:
-- until proof-of-payment workflow is approved, prevent authenticated users
-- from self-marking sale or captation commissions as PAID.
REVOKE ALL ON FUNCTION public.mark_commission_paid(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_referral_paid(uuid) FROM PUBLIC, anon, authenticated;
