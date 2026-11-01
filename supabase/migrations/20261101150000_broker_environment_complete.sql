-- Entorno broker funcional de punta a punta.
--
-- 1) register_sale(): si la reserva (o el lead) llegó con el link de un broker,
--    ese broker cierra la venta por defecto y recibe la comisión de VENTA del
--    proyecto (monto fijo). p_broker_closes = false deja la venta al equipo del
--    proyecto y el broker recibe solo la CAPTACIÓN (comportamiento anterior).
--    El broker recibe un aviso con el monto. Firma nueva: se elimina la de 7
--    argumentos para no dejar sobrecargas ambiguas.
-- 2) Lectura: el broker ve las reservas que llegaron con su link, y el dueño del
--    proyecto ve las comisiones de su proyecto (para saber qué debe pagar).
-- 3) broker_profiles: el broker edita su perfil público, pero nivel, tasas,
--    código, estado y referente solo los cambia un admin.
-- 4) approve_broker_application(): si no se pasa usuario, lo busca por el email
--    de la postulación (auth.users). Avisa al broker que su cuenta está activa.
-- 5) Solicitudes de proyecto: el aviso al dueño lleva a la bandeja de aprobación
--    y el broker recibe aviso cuando su solicitud se aprueba o rechaza.
-- 6) Regla de reparto: la comisión fija del proyecto es el TOTAL por venta. Si
--    otro vendedor captó al cliente, el captador recibe su parte
--    (referral_fixed_amount) y quien cierra el resto (total − captación).
--    Si quien cierra también captó, recibe el total. Ej. Hualañé: total
--    $750.000 = $350.000 captación + $400.000 cierre.
-- 7) set_project_commission(): la captación no puede superar el total.
-- Requiere 20261031150000_project_owner_commissions.sql.

-- 1) register_sale ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.register_sale(uuid, numeric, numeric, text, uuid, numeric, uuid);

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
  uuid, numeric, numeric, text, uuid, numeric, uuid, boolean
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_sale(
  uuid, numeric, numeric, text, uuid, numeric, uuid, boolean
) TO authenticated;

-- 2) Lectura de reservas y comisiones ----------------------------------------
DROP POLICY IF EXISTS "Referring brokers view their reservations" ON public.reservations;
CREATE POLICY "Referring brokers view their reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (referring_agent_id = auth.uid());

DROP POLICY IF EXISTS "Project owners view project commissions" ON public.agent_commissions;
CREATE POLICY "Project owners view project commissions"
ON public.agent_commissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = agent_commissions.project_id
      AND p.user_id = auth.uid()
  )
);

-- 3) Campos sensibles del perfil de broker -----------------------------------
CREATE OR REPLACE FUNCTION public.guard_broker_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  -- Sin sesión (service role / migraciones) o admin de plataforma: sin límite.
  IF auth.uid() IS NULL OR public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.level IS DISTINCT FROM OLD.level
     OR NEW.base_commission_rate IS DISTINCT FROM OLD.base_commission_rate
     OR NEW.network_override_rate IS DISTINCT FROM OLD.network_override_rate
     OR NEW.invite_code IS DISTINCT FROM OLD.invite_code
     OR NEW.referred_by IS DISTINCT FROM OLD.referred_by
     OR NEW.is_active IS DISTINCT FROM OLD.is_active
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.slug IS DISTINCT FROM OLD.slug THEN
    RAISE EXCEPTION 'Solo un administrador puede cambiar nivel, comisiones, código, enlace o estado del broker'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.guard_broker_profile_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_broker_profile_update ON public.broker_profiles;
CREATE TRIGGER trg_guard_broker_profile_update
BEFORE UPDATE ON public.broker_profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_broker_profile_update();

-- 4) Aprobar postulación: vincula la cuenta por email ------------------------
CREATE OR REPLACE FUNCTION public.approve_broker_application(
  p_application_id uuid,
  p_user_id uuid,
  p_level text DEFAULT 'starter',
  p_base_commission_rate numeric DEFAULT 3
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_app public.broker_applications%ROWTYPE;
  v_user uuid;
  v_slug text;
  v_code text;
  v_profile_id uuid;
  v_referrer uuid;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;

  SELECT * INTO v_app FROM public.broker_applications WHERE id = p_application_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Postulación no encontrada'; END IF;

  v_user := COALESCE(p_user_id, v_app.user_id);
  IF v_user IS NULL AND v_app.email IS NOT NULL THEN
    SELECT u.id INTO v_user
    FROM auth.users u
    WHERE lower(u.email) = lower(btrim(v_app.email))
    ORDER BY u.created_at
    LIMIT 1;
  END IF;
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'La persona aún no tiene cuenta con el email %. Pídele que se registre en ofertaterrenos.com con ese email y vuelve a aprobar.', v_app.email;
  END IF;

  v_slug := public.project_slugify(v_app.full_name);
  IF v_slug IS NULL OR v_slug = '' THEN v_slug := 'broker'; END IF;
  WHILE EXISTS (SELECT 1 FROM public.broker_profiles WHERE slug = v_slug AND user_id <> v_user) LOOP
    v_slug := v_slug || '-' || substr(md5(random()::text), 1, 4);
  END LOOP;

  v_code := 'BK-' || upper(substr(md5(random()::text), 1, 6));
  WHILE EXISTS (SELECT 1 FROM public.broker_profiles WHERE invite_code = v_code) LOOP
    v_code := 'BK-' || upper(substr(md5(random()::text), 1, 6));
  END LOOP;

  IF v_app.invited_by_code IS NOT NULL THEN
    SELECT user_id INTO v_referrer FROM public.broker_profiles WHERE invite_code = v_app.invited_by_code;
    IF v_referrer = v_user THEN v_referrer := NULL; END IF;
  END IF;

  INSERT INTO public.broker_profiles (
    user_id, slug, display_name, level, base_commission_rate, invite_code,
    referred_by, phone, email, company_name
  ) VALUES (
    v_user, v_slug, v_app.full_name, coalesce(p_level,'starter'),
    coalesce(p_base_commission_rate,3), v_code, v_referrer, v_app.phone, v_app.email, v_app.company_name
  )
  ON CONFLICT (user_id) DO UPDATE SET is_active = true, updated_at = now()
  RETURNING id INTO v_profile_id;

  INSERT INTO public.user_roles (user_id, role) VALUES (v_user, 'agent')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.broker_applications
     SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), user_id = v_user
   WHERE id = p_application_id;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_user, 'broker_request', 'Tu cuenta de broker está activa',
          'Ya puedes solicitar proyectos, descargar el kit de venta y compartir tu link personal.',
          '/asesor/mi-negocio');

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'broker_application_approved', 'broker_applications', p_application_id::text,
          jsonb_build_object('broker_user_id', v_user, 'level', p_level,
                             'linked_by_email', p_user_id IS NULL AND v_app.user_id IS NULL));

  RETURN v_profile_id;
END; $$;

REVOKE ALL ON FUNCTION public.approve_broker_application(uuid,uuid,text,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_broker_application(uuid,uuid,text,numeric) TO authenticated;

-- 5) Solicitudes de proyecto -------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_project_assignment(
  p_project_id uuid,
  p_message text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid; v_id uuid; v_rate numeric; v_project text; v_broker text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Requiere sesión'; END IF;

  SELECT user_id, name INTO v_owner, v_project FROM public.projects WHERE id = p_project_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Proyecto no encontrado'; END IF;
  IF v_owner = auth.uid() THEN RAISE EXCEPTION 'Ya eres dueño de este proyecto'; END IF;

  SELECT commission_rate INTO v_rate FROM public.commission_rules
   WHERE is_active AND scope = 'project' AND project_id = p_project_id LIMIT 1;
  IF v_rate IS NULL THEN
    SELECT commission_rate INTO v_rate FROM public.commission_rules
     WHERE is_active AND scope = 'default' LIMIT 1;
  END IF;

  INSERT INTO public.project_broker_assignments (project_id, broker_id, owner_id, commission_rate, message)
  VALUES (p_project_id, auth.uid(), v_owner, coalesce(v_rate, 3), left(coalesce(p_message,''), 1000))
  ON CONFLICT (project_id, broker_id) DO UPDATE SET status = 'pending', updated_at = now()
  RETURNING id INTO v_id;

  SELECT display_name INTO v_broker FROM public.broker_profiles WHERE user_id = auth.uid();

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_owner, 'broker_request', 'Nueva solicitud de broker',
          coalesce(v_broker, 'Un broker') || ' solicitó vender ' || coalesce(v_project, 'tu proyecto') || '. Apruébala o recházala.',
          '/asesor/proyectos-en-venta?tab=incoming');

  RETURN v_id;
END; $$;

REVOKE ALL ON FUNCTION public.request_project_assignment(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_project_assignment(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_broker_assignment_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE v_project text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status
     OR NEW.status NOT IN ('approved', 'rejected', 'revoked') THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_project FROM public.projects WHERE id = NEW.project_id;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.broker_id,
    'broker_request',
    CASE NEW.status WHEN 'approved' THEN 'Proyecto aprobado para vender'
                    WHEN 'rejected' THEN 'Solicitud de proyecto rechazada'
                    ELSE 'Acceso al proyecto revocado' END,
    CASE NEW.status
      WHEN 'approved' THEN 'Ya puedes vender ' || coalesce(v_project, 'el proyecto') || ': abre el kit de venta y comparte tu link.'
      WHEN 'rejected' THEN 'El dueño de ' || coalesce(v_project, 'el proyecto') || ' no aprobó tu solicitud por ahora.'
      ELSE 'Ya no tienes acceso para vender ' || coalesce(v_project, 'el proyecto') || '.'
    END,
    CASE NEW.status WHEN 'approved' THEN '/asesor/kit-venta/' || NEW.project_id::text
                    ELSE '/asesor/proyectos-en-venta' END
  );
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.notify_broker_assignment_decision() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_broker_assignment_decision ON public.project_broker_assignments;
CREATE TRIGGER trg_notify_broker_assignment_decision
AFTER UPDATE OF status ON public.project_broker_assignments
FOR EACH ROW EXECUTE FUNCTION public.notify_broker_assignment_decision();

-- 6) Reparto de la comisión total entre captador y quien cierra ----------------
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
  v_split boolean := false;
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

    -- Hay reparto cuando captó un vendedor distinto del que cierra.
    v_split := NEW.referring_agent_id IS NOT NULL
               AND NEW.referring_agent_id IS DISTINCT FROM NEW.agent_id;

    IF v_project_rule AND v_fixed IS NOT NULL THEN
      -- Monto fijo = TOTAL por venta. Con captador, quien cierra recibe el resto.
      IF v_split AND v_ref IS NOT NULL THEN
        v_ref := LEAST(v_ref, v_fixed);
        NEW.commission_amount := v_fixed - v_ref;
      ELSE
        NEW.commission_amount := v_fixed;
      END IF;
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

    IF v_split AND v_ref IS NOT NULL THEN
      NEW.referral_amount := v_ref;
      IF v_ref > 0 AND COALESCE(NEW.referral_status, 'none') = 'none' THEN
        NEW.referral_status := 'pending';
      END IF;
    ELSIF NOT v_split THEN
      -- Mismo vendedor capta y cierra: no hay pago aparte de captación.
      NEW.referral_amount := 0;
      NEW.referral_status := 'none';
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$;

COMMENT ON COLUMN public.commission_rules.fixed_sale_amount IS
  'TOTAL CLP de comisión por venta. Si otro vendedor captó al cliente, quien cierra recibe este total menos referral_fixed_amount.';
COMMENT ON COLUMN public.commission_rules.referral_fixed_amount IS
  'Parte del total (CLP) para quien captó al cliente cuando la venta la cierra otro vendedor.';

-- Corrige comisiones aún no pagadas que sumaron la captación encima del total.
UPDATE public.agent_commissions ac
SET commission_amount = cr.fixed_sale_amount - LEAST(ac.referral_amount, cr.fixed_sale_amount),
    updated_at = now()
FROM public.commission_rules cr
WHERE cr.is_active AND cr.scope = 'project' AND cr.project_id = ac.project_id
  AND cr.fixed_sale_amount IS NOT NULL
  AND ac.referring_agent_id IS NOT NULL
  AND ac.referring_agent_id IS DISTINCT FROM ac.agent_id
  AND COALESCE(ac.referral_amount, 0) > 0
  AND ac.commission_amount = cr.fixed_sale_amount
  AND ac.status NOT IN ('paid', 'cancelled');

-- 7) set_project_commission: total y parte del captador -----------------------
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
    RAISE EXCEPTION 'Comisión total fuera de rango (0 a 100.000.000 CLP)';
  END IF;
  IF p_capture_amount IS NULL OR p_capture_amount < 0 OR p_capture_amount > 100000000 THEN
    RAISE EXCEPTION 'Parte del captador fuera de rango (0 a 100.000.000 CLP)';
  END IF;
  IF p_capture_amount > p_sale_amount THEN
    RAISE EXCEPTION 'La parte del captador no puede ser mayor que la comisión total';
  END IF;

  v_notes := 'Comisión total CLP $' || replace(to_char(round(p_sale_amount), 'FM999,999,999'), ',', '.')
          || ' por venta: $' || replace(to_char(round(p_capture_amount), 'FM999,999,999'), ',', '.')
          || ' al captador y $' || replace(to_char(round(p_sale_amount - p_capture_amount), 'FM999,999,999'), ',', '.')
          || ' a quien cierra (si capta y cierra el mismo, recibe el total); pago sujeto a validación';

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
  'Fija la comisión TOTAL por venta y la parte del captador de un proyecto (dueño, commissions.write o admin). Solo afecta comisiones nuevas.';
