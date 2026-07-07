
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referring_agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_notes text;

CREATE INDEX IF NOT EXISTS idx_leads_listing_id ON public.leads(listing_id);
CREATE INDEX IF NOT EXISTS idx_leads_referring_agent_id ON public.leads(referring_agent_id);

DROP POLICY IF EXISTS "Referring agents view their referred leads" ON public.leads;
CREATE POLICY "Referring agents view their referred leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = referring_agent_id);

ALTER TABLE public.agent_commissions
  ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referring_agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_status text DEFAULT 'none'
    CHECK (referral_status IN ('none','pending','paid','cancelled'));

CREATE INDEX IF NOT EXISTS idx_commissions_referring_agent
  ON public.agent_commissions(referring_agent_id)
  WHERE referring_agent_id IS NOT NULL;

DROP POLICY IF EXISTS "Referring agents view their referral commissions" ON public.agent_commissions;
CREATE POLICY "Referring agents view their referral commissions"
  ON public.agent_commissions FOR SELECT
  USING (auth.uid() = referring_agent_id);

CREATE OR REPLACE FUNCTION public.create_referral_lead(
  p_listing_id uuid,
  p_first_name text,
  p_last_name text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_budget_min numeric DEFAULT NULL,
  p_budget_max numeric DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_lead_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_first_name IS NULL OR length(trim(p_first_name)) = 0 THEN
    RAISE EXCEPTION 'first_name is required';
  END IF;

  SELECT user_id INTO v_owner FROM public.listings WHERE id = p_listing_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  IF v_owner = auth.uid() THEN
    RAISE EXCEPTION 'Cannot refer a lead to your own listing';
  END IF;

  INSERT INTO public.leads (
    user_id, referring_agent_id, listing_id, source,
    first_name, last_name, email, phone, notes,
    budget_min, budget_max, status
  ) VALUES (
    v_owner, auth.uid(), p_listing_id, 'referral',
    p_first_name, p_last_name, p_email, p_phone, p_notes,
    p_budget_min, p_budget_max, 'new'
  )
  RETURNING id INTO v_lead_id;

  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (
    v_owner, 'lead', 'Nuevo lead referido',
    'Un corredor te refirió a ' || p_first_name || ' ' || COALESCE(p_last_name, '') || ' interesado en tu propiedad.',
    '/asesor/leads',
    jsonb_build_object('lead_id', v_lead_id, 'listing_id', p_listing_id, 'referring_agent_id', auth.uid())
  );

  RETURN v_lead_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_referral_lead(uuid,text,text,text,text,text,numeric,numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.register_sale(
  p_reservation_id uuid,
  p_sale_amount numeric,
  p_commission_rate numeric DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_referring_agent_id uuid DEFAULT NULL,
  p_referral_rate numeric DEFAULT NULL,
  p_lead_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_res record;
  v_commission_id uuid;
  v_referring uuid := p_referring_agent_id;
  v_ref_rate numeric := COALESCE(p_referral_rate, 0);
  v_ref_amount numeric := 0;
  v_ref_status text := 'none';
  v_listing_id uuid;
BEGIN
  IF p_sale_amount IS NULL OR p_sale_amount <= 0 THEN
    RAISE EXCEPTION 'Sale amount must be positive';
  END IF;
  IF p_commission_rate IS NOT NULL AND (p_commission_rate < 0 OR p_commission_rate > 50) THEN
    RAISE EXCEPTION 'Commission rate out of range (0-50)';
  END IF;
  IF v_ref_rate < 0 OR v_ref_rate > 100 THEN
    RAISE EXCEPTION 'Referral rate out of range (0-100)';
  END IF;

  SELECT r.*, l.user_id AS lot_owner, l.area AS lot_area, l.project_id AS lot_project_id
  INTO v_res
  FROM public.reservations r
  JOIN public.lots l ON l.id = r.lot_id
  WHERE r.id = p_reservation_id
  FOR UPDATE OF r;

  IF v_res IS NULL OR v_res.lot_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Reservation not found or not owned by caller';
  END IF;
  IF v_res.status <> 'paid' THEN
    RAISE EXCEPTION 'Only paid reservations can be converted to a sale';
  END IF;

  IF p_lead_id IS NOT NULL THEN
    SELECT referring_agent_id, listing_id
    INTO v_referring, v_listing_id
    FROM public.leads WHERE id = p_lead_id;
  END IF;

  UPDATE public.reservations
  SET status = 'converted', converted_at = now(),
      notes = COALESCE(p_notes, notes),
      lead_id = COALESCE(p_lead_id, lead_id)
  WHERE id = p_reservation_id;

  UPDATE public.lots
  SET price = p_sale_amount,
      price_per_sqm = CASE WHEN area > 0 THEN round(p_sale_amount / area) ELSE price_per_sqm END
  WHERE id = v_res.lot_id;

  IF p_commission_rate IS NOT NULL AND p_commission_rate > 0 THEN
    IF v_referring IS NOT NULL AND v_ref_rate > 0 THEN
      v_ref_amount := round(p_sale_amount * p_commission_rate / 100 * v_ref_rate / 100);
      v_ref_status := 'pending';
    END IF;

    INSERT INTO public.agent_commissions
      (agent_id, reservation_id, lot_id, project_id, listing_id, lead_id,
       sale_amount, commission_rate, commission_amount, status, notes,
       referring_agent_id, referral_rate, referral_amount, referral_status)
    VALUES
      (auth.uid(), p_reservation_id, v_res.lot_id, v_res.lot_project_id, v_listing_id, p_lead_id,
       p_sale_amount, p_commission_rate, round(p_sale_amount * p_commission_rate / 100),
       'pending', p_notes,
       v_referring, v_ref_rate, v_ref_amount, v_ref_status)
    RETURNING id INTO v_commission_id;

    IF v_referring IS NOT NULL AND v_ref_amount > 0 THEN
      INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
      VALUES (
        v_referring, 'payment', 'Comisión por referido generada',
        'Se generó una comisión de referido por $' || v_ref_amount || ' pendiente de pago.',
        '/asesor/comisiones',
        jsonb_build_object('commission_id', v_commission_id, 'amount', v_ref_amount)
      );
    END IF;
  END IF;

  IF p_lead_id IS NOT NULL THEN
    UPDATE public.leads SET status = 'converted' WHERE id = p_lead_id;
  END IF;

  RETURN v_commission_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_referral_paid(p_commission_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paid_at timestamptz := now();
BEGIN
  UPDATE public.agent_commissions
  SET referral_status = 'paid', updated_at = now()
  WHERE id = p_commission_id
    AND agent_id = auth.uid()
    AND referral_status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referral not found, already paid, or not owned by caller';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  SELECT referring_agent_id, 'payment', 'Comisión de referido pagada',
         'Tu comisión por referido de $' || referral_amount || ' fue marcada como pagada.',
         '/asesor/comisiones',
         jsonb_build_object('commission_id', id)
  FROM public.agent_commissions
  WHERE id = p_commission_id AND referring_agent_id IS NOT NULL;

  RETURN v_paid_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_referral_paid(uuid) TO authenticated;
