-- Comisiones fijadas por el dueño del proyecto y venta sin tasa manual.
--
-- 1) set_project_commission(): el dueño del proyecto (o quien tenga
--    commissions.write en él, o un admin de plataforma) fija la comisión fija
--    por venta y por captación de SU proyecto. Actualiza la regla activa del
--    proyecto o la crea; nunca toca reglas 'default' ni 'plan'.
-- 2) register_sale(): la comisión sale de la regla del proyecto, no de una
--    tasa escrita al registrar la venta. p_commission_rate NULL = usar la regla,
--    0 = no generar comisión, > 0 = tasa explícita (compatibilidad).
--    El aviso al broker referido usa el monto real (fijo) de la comisión.
-- Requiere 20260926182500_referral_commission_overrides.sql y
-- 20261030180000_project_fixed_commissions.sql.

CREATE OR REPLACE FUNCTION public.set_project_commission(
  p_project_id uuid,
  p_sale_amount numeric,
  p_capture_amount numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_count int;
  v_rule_id uuid;
  v_notes text;
BEGIN
  IF p_project_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.projects WHERE id = p_project_id) THEN
    RAISE EXCEPTION 'Proyecto no encontrado';
  END IF;
  IF NOT (public.can_access_project(p_project_id, 'commissions.write') OR public.is_platform_admin()) THEN
    RAISE EXCEPTION 'No tienes permiso para fijar comisiones en este proyecto';
  END IF;
  IF p_sale_amount IS NULL OR p_sale_amount < 0 OR p_sale_amount > 100000000 THEN
    RAISE EXCEPTION 'Comisión por venta fuera de rango (0 a 100.000.000 CLP)';
  END IF;
  IF p_capture_amount IS NULL OR p_capture_amount < 0 OR p_capture_amount > 100000000 THEN
    RAISE EXCEPTION 'Comisión por captación fuera de rango (0 a 100.000.000 CLP)';
  END IF;

  v_notes := 'Venta fija CLP $' || replace(to_char(round(p_sale_amount), 'FM999,999,999'), ',', '.')
          || ' y captación fija CLP $' || replace(to_char(round(p_capture_amount), 'FM999,999,999'), ',', '.')
          || ' por venta efectiva; pago sujeto a validación';

  -- Serializa cambios simultáneos sobre el mismo proyecto.
  PERFORM pg_advisory_xact_lock(hashtext('commission_rules:' || p_project_id::text));

  SELECT count(*) INTO v_count
  FROM public.commission_rules
  WHERE scope = 'project' AND project_id = p_project_id AND is_active;
  IF v_count > 1 THEN
    RAISE EXCEPTION 'El proyecto tiene % reglas de comisión activas; pide a un administrador que deje una', v_count;
  END IF;

  IF v_count = 1 THEN
    UPDATE public.commission_rules
       SET commission_rate = 0,
           referral_override_rate = 0,
           min_commission_amount = NULL,
           fixed_sale_amount = round(p_sale_amount),
           referral_fixed_amount = round(p_capture_amount),
           notes = v_notes,
           updated_at = now()
     WHERE scope = 'project' AND project_id = p_project_id AND is_active
     RETURNING id INTO v_rule_id;
  ELSE
    INSERT INTO public.commission_rules
      (scope, project_id, commission_rate, referral_override_rate,
       min_commission_amount, fixed_sale_amount, referral_fixed_amount, is_active, notes)
    VALUES
      ('project', p_project_id, 0, 0, NULL, round(p_sale_amount), round(p_capture_amount), true, v_notes)
    RETURNING id INTO v_rule_id;
  END IF;

  RETURN v_rule_id;
END;
$fn$;

REVOKE ALL ON FUNCTION public.set_project_commission(uuid, numeric, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_project_commission(uuid, numeric, numeric) TO authenticated;

COMMENT ON FUNCTION public.set_project_commission(uuid, numeric, numeric) IS
  'Fija la comisión fija por venta y captación de un proyecto (dueño, commissions.write o admin). Solo afecta comisiones nuevas.';

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
     OR NOT public.can_access_project(v_res.lot_project_id, 'sales.write') THEN
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
      auth.uid(), p_reservation_id, v_res.lot_id, v_res.lot_project_id,
      v_listing_id, p_lead_id,
      p_sale_amount, v_rate,
      round(p_sale_amount * v_rate / 100),
      'earned', p_notes,
      v_referring, v_ref_rate, v_ref_amount, v_ref_status,
      auth.uid()
    )
    RETURNING id, referral_amount INTO v_commission_id, v_ref_amount;
    -- normalize_commission_ledger() aplica los montos fijos del proyecto al
    -- insertar; el aviso al referido usa ese monto real.
    v_ref_amount := COALESCE(v_ref_amount, 0);

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

      -- One-level upline override. The parent relationship is stored as a UUID
      -- in broker_profiles.referred_by. Only active parents with a positive
      -- configured network_override_rate accrue an override.
      SELECT bp.referred_by
        INTO v_parent_broker
      FROM public.broker_profiles bp
      WHERE bp.user_id = v_referring
        AND bp.is_active
      LIMIT 1;

      IF v_parent_broker IS NOT NULL
         AND v_parent_broker <> v_referring
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
              v_referring,
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
                'source_broker_id', v_referring,
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
