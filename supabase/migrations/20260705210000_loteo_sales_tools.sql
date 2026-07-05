-- ═══════════════════════════════════════════════════════════════════════════
-- Loteo sales & reservations tooling
--
-- 1. expire_stale_reservations(): flips pending_payment past expires_at to
--    'expired' (the existing on_reservation_status_change trigger releases the
--    lot). Until now NOTHING ever expired reservations — stale ones blocked
--    lots forever and expiry was only a client-side badge.
-- 2. extend_reservation(): project owner pushes out expires_at for a pending
--    reservation (renewal flow).
-- 3. register_sale(): atomic reservation→sale conversion — marks converted
--    (trigger sets lot sold + sale_date), records the final sale price on the
--    lot, and creates the agent commission (agent_commissions had no INSERT
--    policy, so this SECURITY DEFINER function is the write path).
-- 4. adjust_lot_prices(): bulk price adjustment for a project's lots
--    (percent / per-m² / fixed delta).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Expire stale reservations ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.expire_stale_reservations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  affected integer;
BEGIN
  UPDATE public.reservations
  SET status = 'expired'
  WHERE status = 'pending_payment'
    AND expires_at < now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$fn$;

REVOKE ALL ON FUNCTION public.expire_stale_reservations() FROM public;
GRANT EXECUTE ON FUNCTION public.expire_stale_reservations() TO authenticated, service_role;

-- Schedule every 15 minutes when pg_cron is available (no-op otherwise; the
-- frontend also calls the function on ReservationsManager load as a fallback).
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'expire-stale-reservations',
      '*/15 * * * *',
      'SELECT public.expire_stale_reservations()'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron scheduling skipped: %', SQLERRM;
END;
$do$;

-- 2) Extend a pending reservation ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.extend_reservation(
  p_reservation_id uuid,
  p_hours integer DEFAULT 48
)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_new_expiry timestamptz;
  v_hours integer := LEAST(GREATEST(COALESCE(p_hours, 48), 1), 720); -- 1h..30d
BEGIN
  UPDATE public.reservations r
  SET expires_at = GREATEST(r.expires_at, now()) + make_interval(hours => v_hours)
  FROM public.lots l
  WHERE r.id = p_reservation_id
    AND r.lot_id = l.id
    AND l.user_id = auth.uid()
    AND r.status = 'pending_payment'
  RETURNING r.expires_at INTO v_new_expiry;

  IF v_new_expiry IS NULL THEN
    RAISE EXCEPTION 'Reservation not found, not pending, or not owned by caller';
  END IF;
  RETURN v_new_expiry;
END;
$fn$;

REVOKE ALL ON FUNCTION public.extend_reservation(uuid, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.extend_reservation(uuid, integer) TO authenticated;

-- 3) Register a sale (reservation → converted + final price + commission) ────
CREATE OR REPLACE FUNCTION public.register_sale(
  p_reservation_id uuid,
  p_sale_amount numeric,
  p_commission_rate numeric DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_res record;
  v_lot record;
  v_commission_id uuid;
BEGIN
  IF p_sale_amount IS NULL OR p_sale_amount <= 0 THEN
    RAISE EXCEPTION 'Sale amount must be positive';
  END IF;
  IF p_commission_rate IS NOT NULL AND (p_commission_rate < 0 OR p_commission_rate > 50) THEN
    RAISE EXCEPTION 'Commission rate out of range (0-50)';
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

  -- Flip to converted: the status trigger marks the lot sold + sale_date.
  UPDATE public.reservations
  SET status = 'converted',
      converted_at = now(),
      notes = COALESCE(p_notes, notes)
  WHERE id = p_reservation_id;

  -- Record the final negotiated price on the lot.
  UPDATE public.lots
  SET price = p_sale_amount,
      price_per_sqm = CASE WHEN area > 0 THEN round(p_sale_amount / area) ELSE price_per_sqm END
  WHERE id = v_res.lot_id;

  -- Commission for the selling agent (optional).
  IF p_commission_rate IS NOT NULL AND p_commission_rate > 0 THEN
    INSERT INTO public.agent_commissions
      (agent_id, reservation_id, lot_id, project_id, sale_amount, commission_rate, commission_amount, status, notes)
    VALUES
      (auth.uid(), p_reservation_id, v_res.lot_id, v_res.lot_project_id,
       p_sale_amount, p_commission_rate, round(p_sale_amount * p_commission_rate / 100), 'pending', p_notes)
    RETURNING id INTO v_commission_id;
  END IF;

  RETURN v_commission_id;
END;
$fn$;

REVOKE ALL ON FUNCTION public.register_sale(uuid, numeric, numeric, text) FROM public;
GRANT EXECUTE ON FUNCTION public.register_sale(uuid, numeric, numeric, text) TO authenticated;

-- 4) Bulk lot price adjustment ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.adjust_lot_prices(
  p_project_id uuid,
  p_mode text,                    -- 'percent' | 'per_sqm' | 'delta'
  p_value numeric,
  p_only_status text DEFAULT 'available'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  affected integer;
BEGIN
  IF p_mode NOT IN ('percent', 'per_sqm', 'delta') THEN
    RAISE EXCEPTION 'Invalid mode: use percent, per_sqm or delta';
  END IF;
  IF p_value IS NULL THEN
    RAISE EXCEPTION 'Value is required';
  END IF;
  IF p_mode = 'percent' AND (p_value <= -100 OR p_value > 500) THEN
    RAISE EXCEPTION 'Percent out of range (-100..500)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = p_project_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Project not found or not owned by caller';
  END IF;

  UPDATE public.lots
  SET price = GREATEST(0, round(
        CASE p_mode
          WHEN 'percent' THEN COALESCE(price, 0) * (1 + p_value / 100)
          WHEN 'per_sqm' THEN COALESCE(area, 0) * p_value
          WHEN 'delta'   THEN COALESCE(price, 0) + p_value
        END)),
      price_per_sqm = CASE WHEN area > 0 THEN GREATEST(0, round(
        CASE p_mode
          WHEN 'percent' THEN COALESCE(price, 0) * (1 + p_value / 100)
          WHEN 'per_sqm' THEN COALESCE(area, 0) * p_value
          WHEN 'delta'   THEN COALESCE(price, 0) + p_value
        END) / area) ELSE price_per_sqm END
  WHERE project_id = p_project_id
    AND user_id = auth.uid()
    AND (p_only_status IS NULL OR status = p_only_status)
    AND (p_mode = 'per_sqm' OR price IS NOT NULL);
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$fn$;

REVOKE ALL ON FUNCTION public.adjust_lot_prices(uuid, text, numeric, text) FROM public;
GRANT EXECUTE ON FUNCTION public.adjust_lot_prices(uuid, text, numeric, text) TO authenticated;
