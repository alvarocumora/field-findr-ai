-- Stabilization: align project authorization with organization capabilities and
-- serialize active reservations per lot. This migration is additive and keeps
-- the existing RPC signatures used by the frontend.

-- Commercial roles need an explicit write capability for the sale conversion
-- RPC. Inventory price changes remain restricted to managers/operations.
CREATE OR REPLACE FUNCTION public.organization_has_capability(
  _organization_id uuid,
  _capability text,
  _user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE public.organization_role(_organization_id, _user_id)
    WHEN 'owner' THEN true
    WHEN 'admin' THEN true
    WHEN 'org_admin' THEN true
    WHEN 'commercial_manager' THEN _capability = ANY (ARRAY[
      'projects.read','projects.write','inventory.read','inventory.write',
      'crm.read','crm.write','reservations.read','reservations.write',
      'sales.read','sales.write','reports.read','team.read'
    ])
    WHEN 'sales_agent' THEN _capability = ANY (ARRAY[
      'projects.read','inventory.read','crm.read','crm.write',
      'reservations.read','reservations.write','sales.read','sales.write',
      'commissions.read'
    ])
    WHEN 'member' THEN _capability = ANY (ARRAY[
      'projects.read','inventory.read','crm.read','crm.write',
      'reservations.read','reservations.write','sales.read','sales.write',
      'commissions.read'
    ])
    WHEN 'operations' THEN _capability = ANY (ARRAY[
      'projects.read','projects.write','inventory.read','inventory.write',
      'reservations.read','reservations.write','documents.read','documents.write'
    ])
    WHEN 'finance' THEN _capability = ANY (ARRAY[
      'sales.read','payments.read','payments.write',
      'commissions.read','commissions.write','reports.read'
    ])
    WHEN 'viewer' THEN _capability = ANY (ARRAY[
      'projects.read','inventory.read','crm.read','reservations.read',
      'sales.read','payments.read','commissions.read','reports.read','team.read'
    ])
    ELSE false
  END;
$$;

GRANT EXECUTE ON FUNCTION public.organization_has_capability(uuid, text, uuid)
TO authenticated, service_role;

-- Project-level assignments must not become an accidental wildcard permission.
CREATE OR REPLACE FUNCTION public.project_member_has_capability(
  _project_id uuid,
  _capability text,
  _user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = _project_id
      AND pm.user_id = _user_id
      AND CASE pm.role
        WHEN 'external_broker' THEN _capability = ANY (ARRAY[
          'projects.read','inventory.read',
          'crm.read','crm.write',
          'reservations.read','reservations.write',
          'sales.read','sales.write','commissions.read'
        ])
        WHEN 'viewer' THEN _capability = ANY (ARRAY[
          'projects.read','inventory.read','crm.read',
          'reservations.read','sales.read','commissions.read'
        ])
        ELSE _capability = ANY (ARRAY['projects.read','inventory.read'])
      END
  );
$$;

GRANT EXECUTE ON FUNCTION public.project_member_has_capability(uuid, text, uuid)
TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_access_project(
  _project_id uuid,
  _capability text DEFAULT 'projects.read',
  _user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects project
    WHERE project.id = _project_id
      AND (
        project.user_id = _user_id
        OR (
          project.organization_id IS NOT NULL
          AND public.organization_has_capability(
            project.organization_id,
            _capability,
            _user_id
          )
        )
        OR public.project_member_has_capability(
          project.id,
          _capability,
          _user_id
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_access_project(uuid, text, uuid)
TO authenticated, service_role;

-- Bulk price adjustment now follows project capability rather than row owner.
CREATE OR REPLACE FUNCTION public.adjust_lot_prices(
  p_project_id uuid,
  p_mode text,
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

  IF NOT public.can_access_project(p_project_id, 'inventory.write') THEN
    RAISE EXCEPTION 'Project not found or inventory write access denied';
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
    AND (p_only_status IS NULL OR status = p_only_status)
    AND (p_mode = 'per_sqm' OR price IS NOT NULL);

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$fn$;

REVOKE ALL ON FUNCTION public.adjust_lot_prices(uuid, text, numeric, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_lot_prices(uuid, text, numeric, text)
TO authenticated;

-- Reservation extension now follows project reservation capability.
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
  v_hours integer := LEAST(GREATEST(COALESCE(p_hours, 48), 1), 720);
BEGIN
  UPDATE public.reservations r
  SET expires_at = GREATEST(r.expires_at, now()) + make_interval(hours => v_hours)
  FROM public.lots l
  WHERE r.id = p_reservation_id
    AND r.lot_id = l.id
    AND public.can_access_project(l.project_id, 'reservations.write')
    AND r.status = 'pending_payment'
  RETURNING r.expires_at INTO v_new_expiry;

  IF v_new_expiry IS NULL THEN
    RAISE EXCEPTION 'Reservation not found, not pending, or access denied';
  END IF;
  RETURN v_new_expiry;
END;
$fn$;

REVOKE ALL ON FUNCTION public.extend_reservation(uuid, integer)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.extend_reservation(uuid, integer)
TO authenticated;

-- Latest sale conversion signature, now authorized by project capability.
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

  IF p_lead_id IS NOT NULL THEN
    SELECT referring_agent_id, listing_id
      INTO v_referring, v_listing_id
    FROM public.leads
    WHERE id = p_lead_id
      AND (
        project_id = v_res.lot_project_id
        OR lot_id = v_res.lot_id
        OR (
          v_res.lot_listing_id IS NOT NULL
          AND listing_id = v_res.lot_listing_id
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

-- Keep the legacy 4-argument signature as a compatibility wrapper so older
-- clients cannot bypass the capability-aware implementation.
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
BEGIN
  RETURN public.register_sale(
    p_reservation_id,
    p_sale_amount,
    p_commission_rate,
    p_notes,
    NULL::uuid,
    NULL::numeric,
    NULL::uuid
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.register_sale(uuid, numeric, numeric, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_sale(uuid, numeric, numeric, text)
TO authenticated;

-- Serialize active reservations for the same lot at database level. The lot
-- row is used as the lock key, avoiding the SELECT-then-INSERT race in any
-- caller (web checkout, admin flow or future integrations).
CREATE OR REPLACE FUNCTION public.guard_single_active_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NEW.status IN ('pending_payment', 'paid') THEN
    PERFORM 1
    FROM public.lots
    WHERE id = NEW.lot_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Lot not found';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.reservations existing
      WHERE existing.lot_id = NEW.lot_id
        AND existing.status IN ('pending_payment', 'paid')
        AND existing.id IS DISTINCT FROM NEW.id
    ) THEN
      RAISE EXCEPTION 'Lot already has an active reservation'
        USING ERRCODE = '23505';
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.guard_single_active_reservation()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_single_active_reservation
ON public.reservations;

CREATE TRIGGER trg_guard_single_active_reservation
BEFORE INSERT OR UPDATE OF lot_id, status
ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.guard_single_active_reservation();
