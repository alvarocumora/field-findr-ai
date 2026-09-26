-- Referral Engine V2: direct reservation attribution
-- Persists validated broker attribution on reservations and lets sale conversion
-- inherit it when no explicit lead/referring agent is supplied.

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS referring_agent_id uuid,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referral_landing_path text;

CREATE INDEX IF NOT EXISTS idx_reservations_referring_agent_id
  ON public.reservations (referring_agent_id)
  WHERE referring_agent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_referral_code
  ON public.reservations (referral_code)
  WHERE referral_code IS NOT NULL;

COMMENT ON COLUMN public.reservations.referring_agent_id IS
  'Validated broker user id captured from first-touch referral attribution.';
COMMENT ON COLUMN public.reservations.referral_code IS
  'Broker referral code validated at reservation creation time.';
COMMENT ON COLUMN public.reservations.referral_landing_path IS
  'Original first-touch landing path associated with the broker referral.';

CREATE OR REPLACE FUNCTION public.register_sale(
  p_reservation_id uuid,
  p_sale_amount numeric,
  p_commission_rate numeric DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_referring_agent_id uuid DEFAULT NULL,
  p_referral_rate numeric DEFAULT NULL,
  p_lead_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
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

  SELECT
    r.*,
    l.user_id AS lot_owner,
    l.area AS lot_area,
    l.project_id AS lot_project_id,
    l.listing_id AS lot_listing_id
  INTO v_res
  FROM public.reservations r
  JOIN public.lots l ON l.id = r.lot_id
  WHERE r.id = p_reservation_id
  FOR UPDATE OF r;

  IF v_res IS NULL
     OR NOT public.can_access_project(v_res.lot_project_id, 'sales.write') THEN
    RAISE EXCEPTION 'Reservation not found or sales write access denied';
  END IF;
  IF v_res.status <> 'paid' THEN
    RAISE EXCEPTION 'Only paid reservations can be converted to a sale';
  END IF;

  -- A direct reservation keeps the broker attribution captured at checkout.
  -- Explicit API input still has priority for administrative corrections.
  v_referring := COALESCE(v_referring, v_res.referring_agent_id);

  IF p_lead_id IS NOT NULL THEN
    SELECT COALESCE(l.referring_agent_id, v_referring), l.listing_id
      INTO v_referring, v_listing_id
    FROM public.leads l
    WHERE l.id = p_lead_id
      AND (
        l.project_id = v_res.lot_project_id
        OR l.lot_id = v_res.lot_id
        OR (
          v_res.lot_listing_id IS NOT NULL
          AND l.listing_id = v_res.lot_listing_id
        )
      );

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Lead does not belong to the reservation project or lot';
    END IF;
  END IF;

  UPDATE public.reservations
  SET status = 'converted',
      converted_at = now(),
      notes = COALESCE(p_notes, notes),
      lead_id = COALESCE(p_lead_id, lead_id)
  WHERE id = p_reservation_id;

  UPDATE public.lots
  SET price = p_sale_amount,
      price_per_sqm = CASE
        WHEN area > 0 THEN round(p_sale_amount / area)
        ELSE price_per_sqm
      END
  WHERE id = v_res.lot_id;

  IF p_commission_rate IS NOT NULL AND p_commission_rate > 0 THEN
    IF v_referring IS NOT NULL AND v_ref_rate > 0 THEN
      v_ref_amount := round(
        p_sale_amount * p_commission_rate / 100 * v_ref_rate / 100
      );
      v_ref_status := 'pending';
    END IF;

    INSERT INTO public.agent_commissions (
      agent_id, reservation_id, lot_id, project_id, listing_id, lead_id,
      sale_amount, commission_rate, commission_amount, status, notes,
      referring_agent_id, referral_rate, referral_amount, referral_status,
      closing_agent_id
    )
    VALUES (
      auth.uid(), p_reservation_id, v_res.lot_id, v_res.lot_project_id,
      v_listing_id, p_lead_id,
      p_sale_amount, p_commission_rate,
      round(p_sale_amount * p_commission_rate / 100),
      'earned', p_notes,
      v_referring, v_ref_rate, v_ref_amount, v_ref_status,
      auth.uid()
    )
    RETURNING id INTO v_commission_id;

    IF v_referring IS NOT NULL AND v_ref_amount > 0 THEN
      INSERT INTO public.notifications (
        user_id, type, title, message, link, metadata
      )
      VALUES (
        v_referring,
        'payment',
        'Comisión por referido generada',
        'Se generó una comisión de referido por $' || v_ref_amount || ' pendiente de pago.',
        '/asesor/comisiones',
        jsonb_build_object(
          'commission_id', v_commission_id,
          'amount', v_ref_amount
        )
      );
    END IF;
  END IF;

  IF p_lead_id IS NOT NULL THEN
    UPDATE public.leads
    SET status = 'converted'
    WHERE id = p_lead_id;
  END IF;

  RETURN v_commission_id;
END;
$fn$;

REVOKE ALL ON FUNCTION public.register_sale(
  uuid, numeric, numeric, text, uuid, numeric, uuid
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_sale(
  uuid, numeric, numeric, text, uuid, numeric, uuid
) TO authenticated;
