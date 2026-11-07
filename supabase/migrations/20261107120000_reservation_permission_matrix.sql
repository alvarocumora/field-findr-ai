-- Server-side permission matrix for reservation actions (confirm/cancel/
-- extend/convert), unifying assigned-broker / owner / admin across all four.
--
-- Gaps closed:
-- 1) Confirm and cancel had NO dedicated RPC — the client ran raw
--    `.update()` calls on `reservations`, authorized only by the single
--    legacy "Project owners can update reservations" RLS policy (owner
--    only, no WITH CHECK, no admin path, no broker path). Cancel had no
--    status/expiry guard at all.
-- 2) `extend_reservation`/`register_sale` already used `can_access_project`,
--    but that resolves capability via organization membership or
--    `project_members` rows — never `project_broker_assignments`. A broker
--    whose project assignment was approved (and who has no separate
--    `project_members` row) could not actually extend or convert the
--    reservations they brought in, even though the product treats an
--    approved assignment as "this broker works this project".
--
-- This migration adds one shared helper (`can_manage_reservation`) that
-- resolves platform admin OR existing project capability OR an approved
-- broker assignment for the project, and routes all four actions through it.
-- Filters/buttons on the client remain UX only; this is the authorization
-- boundary. Does not touch the legacy owner-only RLS UPDATE policy, since
-- other reservation fields (parcel_design, contract_id, payment link
-- timestamps) are written directly by project owners outside this matrix
-- and are out of scope here.

-- An approved project-broker assignment grants the same reservation/sales
-- capabilities as the existing `external_broker` project_members role —
-- the two are meant to be equivalent; this just recognizes the assignment
-- table directly instead of requiring a separate project_members row.
CREATE OR REPLACE FUNCTION public.is_approved_project_broker(
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
    FROM public.project_broker_assignments pba
    WHERE pba.project_id = _project_id
      AND pba.broker_id = _user_id
      AND pba.status = 'approved'
      AND _capability = ANY (ARRAY[
        'projects.read','inventory.read',
        'crm.read','crm.write',
        'reservations.read','reservations.write',
        'sales.read','sales.write','commissions.read'
      ])
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_approved_project_broker(uuid, text, uuid)
TO authenticated, service_role;

-- Single authorization entry point for every reservation action: platform
-- admin, existing project capability (owner/org/project_members), or an
-- approved broker assignment for that project.
CREATE OR REPLACE FUNCTION public.can_manage_reservation(
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
  SELECT
    public.is_platform_admin()
    OR public.can_access_project(_project_id, _capability, _user_id)
    OR public.is_approved_project_broker(_project_id, _capability, _user_id);
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_reservation(uuid, text, uuid)
TO authenticated, service_role;

-- Confirm: pending_payment -> paid. Server clock decides expiry, never the
-- client. Replaces the raw client `.update()` that relied solely on the
-- owner-only RLS policy.
CREATE OR REPLACE FUNCTION public.confirm_reservation(
  p_reservation_id uuid
)
RETURNS public.reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_project_id uuid;
  v_row public.reservations;
BEGIN
  SELECT l.project_id INTO v_project_id
  FROM public.reservations r
  JOIN public.lots l ON l.id = r.lot_id
  WHERE r.id = p_reservation_id;

  IF v_project_id IS NULL
     OR NOT public.can_manage_reservation(v_project_id, 'reservations.write') THEN
    RAISE EXCEPTION 'Reservation not found or reservations write access denied';
  END IF;

  UPDATE public.reservations
  SET status = 'paid', paid_at = now()
  WHERE id = p_reservation_id
    AND status = 'pending_payment'
    AND expires_at > now()
  RETURNING * INTO v_row;

  IF v_row IS NULL THEN
    RAISE EXCEPTION 'Reservation is not pending payment or has already expired';
  END IF;

  RETURN v_row;
END;
$fn$;

REVOKE ALL ON FUNCTION public.confirm_reservation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_reservation(uuid) TO authenticated;

-- Cancel: only from an active state (pending_payment/paid), never from an
-- already-converted sale. The previous raw `.update()` had no status guard
-- at all and could cancel a converted reservation out from under a sale.
CREATE OR REPLACE FUNCTION public.cancel_reservation(
  p_reservation_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS public.reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_project_id uuid;
  v_row public.reservations;
BEGIN
  SELECT l.project_id INTO v_project_id
  FROM public.reservations r
  JOIN public.lots l ON l.id = r.lot_id
  WHERE r.id = p_reservation_id;

  IF v_project_id IS NULL
     OR NOT public.can_manage_reservation(v_project_id, 'reservations.write') THEN
    RAISE EXCEPTION 'Reservation not found or reservations write access denied';
  END IF;

  UPDATE public.reservations
  SET status = 'cancelled',
      notes = CASE
        WHEN p_reason IS NOT NULL AND length(trim(p_reason)) > 0
          THEN COALESCE(notes || E'\n', '') || 'Cancelación: ' || p_reason
        ELSE notes
      END
  WHERE id = p_reservation_id
    AND status IN ('pending_payment', 'paid')
  RETURNING * INTO v_row;

  IF v_row IS NULL THEN
    RAISE EXCEPTION 'Reservation cannot be cancelled from its current status';
  END IF;

  RETURN v_row;
END;
$fn$;

REVOKE ALL ON FUNCTION public.cancel_reservation(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_reservation(uuid, text) TO authenticated;

-- Extend: same capability check, now broker-aware via can_manage_reservation.
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
    AND public.can_manage_reservation(l.project_id, 'reservations.write')
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

-- Convert: same capability check, now broker-aware via can_manage_reservation.
-- Body otherwise unchanged from the current 8-argument version.
CREATE OR REPLACE FUNCTION public.register_sale(
  p_reservation_id uuid,
  p_sale_amount numeric,
  p_commission_rate numeric DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_referring_agent_id uuid DEFAULT NULL,
  p_referral_rate numeric DEFAULT NULL,
  p_lead_id uuid DEFAULT NULL,
  p_broker_closes boolean DEFAULT NULL
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
  v_ref_rate numeric := p_referral_rate;
  v_ref_amount numeric := 0;
  v_ref_status text := 'none';
  v_listing_id uuid;
  v_parent_broker uuid;
  v_parent_override_rate numeric := 0;
  v_parent_override_amount numeric := 0;
  v_rate numeric := p_commission_rate;
  v_rule_rate numeric;
  v_rule_fixed numeric;
  v_generate boolean := false;
  v_closer uuid := auth.uid();
  v_broker_closes boolean := false;
  v_network_source uuid;
  v_sale_amount_final numeric := 0;
BEGIN
  IF p_sale_amount IS NULL OR p_sale_amount <= 0 THEN
    RAISE EXCEPTION 'Sale amount must be positive';
  END IF;
  IF p_commission_rate IS NOT NULL AND (p_commission_rate < 0 OR p_commission_rate > 50) THEN
    RAISE EXCEPTION 'Commission rate out of range (0-50)';
  END IF;
  IF v_ref_rate IS NOT NULL AND (v_ref_rate < 0 OR v_ref_rate > 100) THEN
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
     OR NOT public.can_manage_reservation(v_res.lot_project_id, 'sales.write') THEN
    RAISE EXCEPTION 'Reservation not found or sales write access denied';
  END IF;
  IF v_res.status <> 'paid' THEN
    RAISE EXCEPTION 'Only paid reservations can be converted to a sale';
  END IF;

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

  -- Broker que trajo al cliente (link con su código): por defecto cierra la
  -- venta y recibe la comisión de venta. p_broker_closes = false la deja al
  -- equipo del proyecto y el broker recibe solo la captación.
  IF v_referring IS NOT NULL
     AND v_referring IS DISTINCT FROM auth.uid()
     AND COALESCE(p_broker_closes, true) THEN
    v_broker_closes := true;
    v_closer := v_referring;
    v_referring := NULL;
    v_ref_rate := NULL;
  END IF;

  -- Resolve the referral commission automatically when the caller does not
  -- override it. Project-specific commercial rules win over the default rule.
  IF v_referring IS NOT NULL AND v_ref_rate IS NULL THEN
    SELECT cr.referral_override_rate
      INTO v_ref_rate
    FROM public.commission_rules cr
    WHERE cr.is_active
      AND cr.scope = 'project'
      AND cr.project_id = v_res.lot_project_id
    ORDER BY cr.updated_at DESC
    LIMIT 1;

    IF v_ref_rate IS NULL THEN
      SELECT cr.referral_override_rate
        INTO v_ref_rate
      FROM public.commission_rules cr
      WHERE cr.is_active
        AND cr.scope = 'default'
      ORDER BY cr.updated_at DESC
      LIMIT 1;
    END IF;
  END IF;

  v_ref_rate := COALESCE(v_ref_rate, 0);

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

  -- Comisión de venta: la define la regla del proyecto (monto fijo o tasa),
  -- no quien registra la venta. p_commission_rate NULL = usar la regla;
  -- 0 = no generar comisión; > 0 = tasa explícita (compatibilidad).
  IF p_commission_rate IS NULL THEN
    SELECT cr.commission_rate, cr.fixed_sale_amount
      INTO v_rule_rate, v_rule_fixed
    FROM public.commission_rules cr
    WHERE cr.is_active
      AND cr.scope = 'project'
      AND cr.project_id = v_res.lot_project_id
    ORDER BY cr.updated_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
      SELECT cr.commission_rate
        INTO v_rule_rate
      FROM public.commission_rules cr
      WHERE cr.is_active
        AND cr.scope = 'default'
      ORDER BY cr.updated_at DESC
      LIMIT 1;
    END IF;

    v_rate := COALESCE(v_rule_rate, 0);
    v_generate := v_rule_fixed IS NOT NULL OR v_rate > 0;

    -- normalize_commission_ledger() aplica montos fijos solo desde CLP 1.000.000
    -- (bajo eso suele ser un precio en UF). No registrar una comisión en cero.
    IF v_rule_fixed IS NOT NULL AND p_sale_amount < 1000000 THEN
      RAISE EXCEPTION 'Con comisión fija el precio de venta debe estar en pesos (desde $1.000.000)';
    END IF;
  ELSE
    v_generate := p_commission_rate > 0;
  END IF;

  IF v_generate THEN
    IF v_referring IS NOT NULL AND v_ref_rate > 0 THEN
      -- referral_rate is a percentage of the sale amount (e.g. 0.5 = 0.5%).
      v_ref_amount := round(p_sale_amount * v_ref_rate / 100);
      v_ref_status := 'pending';
    END IF;

    INSERT INTO public.agent_commissions (
      agent_id, reservation_id, lot_id, project_id, listing_id, lead_id,
      sale_amount, commission_rate, commission_amount, status, notes,
      referring_agent_id, referral_rate, referral_amount, referral_status,
      closing_agent_id
    )
    VALUES (
      v_closer, p_reservation_id, v_res.lot_id, v_res.lot_project_id,
      v_listing_id, p_lead_id,
      p_sale_amount, v_rate,
      round(p_sale_amount * v_rate / 100),
      'earned', p_notes,
      v_referring, v_ref_rate, v_ref_amount, v_ref_status,
      v_closer
    )
    RETURNING id, referral_amount, commission_amount
      INTO v_commission_id, v_ref_amount, v_sale_amount_final;
    -- normalize_commission_ledger() aplica los montos fijos del proyecto al
    -- insertar; el aviso al referido usa ese monto real.
    v_ref_amount := COALESCE(v_ref_amount, 0);

    IF v_broker_closes AND COALESCE(v_sale_amount_final, 0) > 0 THEN
      INSERT INTO public.notifications (
        user_id, type, title, message, link, metadata
      )
      VALUES (
        v_closer,
        'payment',
        'Comisión de venta generada',
        'Se registró la venta de un cliente que llegó con tu link. Tu comisión de venta es $'
          || replace(to_char(v_sale_amount_final, 'FM999,999,999'), ',', '.') || '.',
        '/asesor/comisiones',
        jsonb_build_object('commission_id', v_commission_id, 'amount', v_sale_amount_final, 'role', 'closer')
      );
    END IF;

    IF v_referring IS NOT NULL AND v_ref_amount > 0 THEN
      INSERT INTO public.notifications (
        user_id, type, title, message, link, metadata
      )
      VALUES (
        v_referring,
        'payment',
        'Comisión por referido generada',
        'Se generó una comisión de referido por $' || replace(to_char(v_ref_amount, 'FM999,999,999'), ',', '.') || ' pendiente de pago.',
        '/asesor/comisiones',
        jsonb_build_object(
          'commission_id', v_commission_id,
          'amount', v_ref_amount,
          'rate', v_ref_rate
        )
      );

    END IF;

    -- Override de red (un nivel) para quien invitó al broker que originó la
    -- venta: aplica tanto si ese broker solo captó como si captó y cerró.
    v_network_source := CASE
      WHEN v_broker_closes THEN v_closer
      WHEN v_referring IS NOT NULL AND v_ref_amount > 0 THEN v_referring
    END;

    IF v_network_source IS NOT NULL THEN
      -- One-level upline override. The parent relationship is stored as a UUID
      -- in broker_profiles.referred_by. Only active parents with a positive
      -- configured network_override_rate accrue an override.
      SELECT bp.referred_by
        INTO v_parent_broker
      FROM public.broker_profiles bp
      WHERE bp.user_id = v_network_source
        AND bp.is_active
      LIMIT 1;

      IF v_parent_broker IS NOT NULL
         AND v_parent_broker <> v_network_source
         AND v_parent_broker <> auth.uid() THEN
        SELECT bp.network_override_rate
          INTO v_parent_override_rate
        FROM public.broker_profiles bp
        WHERE bp.user_id = v_parent_broker
          AND bp.is_active
        LIMIT 1;

        v_parent_override_rate := COALESCE(v_parent_override_rate, 0);

        IF v_parent_override_rate > 0 THEN
          v_parent_override_amount := round(
            p_sale_amount * v_parent_override_rate / 100
          );

          IF v_parent_override_amount > 0 THEN
            INSERT INTO public.broker_network_overrides (
              commission_id,
              project_id,
              reservation_id,
              source_broker_id,
              beneficiary_broker_id,
              depth,
              override_rate,
              override_amount,
              status
            )
            VALUES (
              v_commission_id,
              v_res.lot_project_id,
              p_reservation_id,
              v_network_source,
              v_parent_broker,
              1,
              v_parent_override_rate,
              v_parent_override_amount,
              'pending'
            )
            ON CONFLICT (commission_id, beneficiary_broker_id, depth)
            DO NOTHING;

            INSERT INTO public.notifications (
              user_id, type, title, message, link, metadata
            )
            VALUES (
              v_parent_broker,
              'payment',
              'Override de red generado',
              'Tu red generó un override de $' || v_parent_override_amount || ' pendiente de pago.',
              '/asesor/red',
              jsonb_build_object(
                'commission_id', v_commission_id,
                'source_broker_id', v_network_source,
                'amount', v_parent_override_amount,
                'rate', v_parent_override_rate,
                'depth', 1
              )
            );
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  -- La venta canónica (public.sales) se crea al actualizar el precio del lote,
  -- antes de existir la comisión, con quien registra como cierre. Si cerró el
  -- broker, se corrige para que venta y comisión nombren al mismo vendedor.
  IF v_broker_closes AND to_regclass('public.sales') IS NOT NULL THEN
    EXECUTE 'UPDATE public.sales
                SET closing_agent_id = $1,
                    originator_agent_id = COALESCE(originator_agent_id, $1)
              WHERE reservation_id = $2
                AND status = ''closed''
                AND closing_agent_id IS DISTINCT FROM $1'
      USING v_closer, p_reservation_id;
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
  uuid, numeric, numeric, text, uuid, numeric, uuid, boolean
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_sale(
  uuid, numeric, numeric, text, uuid, numeric, uuid, boolean
) TO authenticated;
