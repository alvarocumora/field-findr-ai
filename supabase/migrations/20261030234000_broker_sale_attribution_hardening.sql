-- Fase 2 / Broker flow: explicit seller on fixed-project sales
-- Apply ONLY after canonical sales ledger, fixed commission rules, Hualañé 750k
-- and public broker attribution migrations. No historical commission edits.
-- This is a new, purpose-built RPC; legacy percentage sale paths are guarded by triggers.

CREATE OR REPLACE FUNCTION public.list_project_closing_brokers(p_project_id uuid)
RETURNS TABLE(user_id uuid, display_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $fn$
BEGIN
  IF auth.uid() IS NULL OR NOT (
      public.is_platform_admin()
      OR EXISTS (SELECT 1 FROM public.projects p
                 WHERE p.id=p_project_id AND p.user_id=auth.uid())
  ) THEN
    RAISE EXCEPTION 'No autorizado para listar vendedores del proyecto';
  END IF;

  RETURN QUERY SELECT bp.user_id,bp.display_name
  FROM public.project_broker_assignments pa
  JOIN public.broker_profiles bp ON bp.user_id=pa.broker_id AND bp.is_active=true
  WHERE pa.project_id=p_project_id AND pa.status='approved'
  ORDER BY bp.display_name,bp.user_id;
END;
$fn$;

REVOKE ALL ON FUNCTION public.list_project_closing_brokers(uuid)
FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.list_project_closing_brokers(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.register_project_broker_sale(
  p_reservation_id uuid,
  p_sale_amount numeric,
  p_closing_agent_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $fn$
DECLARE
  v_res record;
  v_fixed numeric;
  v_capture_amount numeric;
  v_referring uuid;
  v_sale_id uuid;
  v_commission_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Requiere sesión'; END IF;
  IF p_sale_amount IS NULL OR p_sale_amount<=0
     OR p_closing_agent_id IS NULL THEN
    RAISE EXCEPTION 'Indica precio y vendedor responsable';
  END IF;

  -- Same reservation is locked through conversion: retries cannot pay twice.
  SELECT r.*,l.user_id AS lot_owner,l.project_id AS lot_project_id,
         l.area AS lot_area
    INTO v_res
  FROM public.reservations r
  JOIN public.lots l ON l.id=r.lot_id
  WHERE r.id=p_reservation_id
  FOR UPDATE OF r;

  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva no encontrada'; END IF;
  IF v_res.lot_owner IS DISTINCT FROM auth.uid()
      AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'No autorizado para convertir esta reserva';
  END IF;
  IF v_res.status <> 'paid' THEN
    RAISE EXCEPTION 'La reserva debe estar pagada y pendiente de conversión';
  END IF;
  IF v_res.currency <> 'CLP' THEN
    RAISE EXCEPTION 'Las comisiones fijas requieren una venta en CLP';
  END IF;
  IF v_res.lot_project_id NOT IN (
      '761e73ed-cc0d-5605-a06a-4a4348523b4b'::uuid,
      'b4363fda-e99f-400d-ae95-2cbc8244b770'::uuid
  ) THEN
    RAISE EXCEPTION 'Utiliza el cierre convencional para este proyecto';
  END IF;

  IF (SELECT count(*) FROM public.commission_rules
      WHERE scope='project' AND project_id=v_res.lot_project_id AND is_active=true) <> 1 THEN
    RAISE EXCEPTION 'Debe existir exactamente una regla activa de comisión fija';
  END IF;
  SELECT fixed_sale_amount, referral_fixed_amount
    INTO v_fixed,v_capture_amount
  FROM public.commission_rules
  WHERE scope='project' AND project_id=v_res.lot_project_id
    AND is_active=true;
  IF v_fixed IS NULL OR v_fixed<=0 THEN
    RAISE EXCEPTION 'Falta configurar la comisión fija del proyecto';
  END IF;

  -- Prevent awarding a seller commission to an arbitrary user or the owner.
  IF NOT EXISTS (
    SELECT 1 FROM public.project_broker_assignments pa
    JOIN public.broker_profiles bp ON bp.user_id=pa.broker_id
    WHERE pa.project_id=v_res.lot_project_id
      AND pa.broker_id=p_closing_agent_id
      AND pa.status='approved' AND bp.is_active=true
  ) THEN
    RAISE EXCEPTION 'El vendedor no está aprobado para este proyecto';
  END IF;

  -- Use ONLY server-validated attribution already stored with the reservation.
  -- A manually supplied referral user ID or URL alone is never sufficient.
  IF v_res.referring_agent_id IS NOT NULL AND v_res.referral_code IS NOT NULL THEN
    SELECT bp.user_id INTO v_referring
    FROM public.broker_profiles bp
    JOIN public.project_broker_assignments pa
      ON pa.broker_id=bp.user_id AND pa.project_id=v_res.lot_project_id
      AND pa.status='approved'
    WHERE bp.user_id=v_res.referring_agent_id
      AND bp.invite_code=v_res.referral_code
      AND bp.is_active=true;
  END IF;

  IF v_referring IS NOT NULL AND (v_capture_amount IS NULL OR v_capture_amount<=0) THEN
    RAISE EXCEPTION 'Captación sin regla válida en CLP; revisar configuración';
  END IF;

  IF v_referring IS NOT NULL AND v_referring=p_closing_agent_id THEN
    RAISE EXCEPTION 'La coincidencia de vendedor y captador requiere revisión comercial';
  END IF;

  IF EXISTS (SELECT 1 FROM public.agent_commissions
             WHERE reservation_id=p_reservation_id AND status<>'cancelled') THEN
    RAISE EXCEPTION 'Esta reserva ya tiene una comisión asociada';
  END IF;

  -- Transaction-local proof set by this validated RPC only.
  -- Legacy register_sale/admin_register_manual_sale cannot supply it via PostgREST.
  PERFORM set_config('app.verified_broker_sale','ok',true);

  UPDATE public.reservations
  SET status='converted',converted_at=now(),notes=coalesce(p_notes,notes)
  WHERE id=p_reservation_id;

  -- Existing lot/reservation triggers create the canonical public.sales row.
  UPDATE public.lots
  SET price=p_sale_amount,
      price_per_sqm=CASE WHEN area>0 THEN round(p_sale_amount/area)
                         ELSE price_per_sqm END
  WHERE id=v_res.lot_id;

  SELECT sale.id INTO v_sale_id FROM public.sales sale
  WHERE sale.reservation_id=p_reservation_id AND sale.status='closed'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se generó la venta canónica; operación revertida';
  END IF;

  UPDATE public.sales SET
    sale_amount=p_sale_amount,
    closing_agent_id=p_closing_agent_id,
    referring_agent_id=v_referring,
    originator_agent_id=coalesce(v_referring,p_closing_agent_id)
  WHERE id=v_sale_id;

  INSERT INTO public.agent_commissions(
    agent_id,closing_agent_id,originator_agent_id,
    reservation_id,sale_id,lot_id,project_id,
    sale_amount,commission_rate,commission_amount,status,notes,
    referring_agent_id,referral_rate,referral_amount,referral_status
  ) VALUES (
    p_closing_agent_id,p_closing_agent_id,coalesce(v_referring,p_closing_agent_id),
    p_reservation_id,v_sale_id,v_res.lot_id,v_res.lot_project_id,
    p_sale_amount,0,v_fixed,'pending',left(p_notes,2000),
    v_referring,0,
    CASE WHEN v_referring IS NOT NULL THEN coalesce(v_capture_amount,0) ELSE 0 END,
    CASE WHEN v_referring IS NOT NULL AND coalesce(v_capture_amount,0)>0 THEN 'pending' ELSE 'none' END
  ) RETURNING id INTO v_commission_id;

  RETURN v_commission_id;
END;
$fn$;

REVOKE ALL ON FUNCTION public.register_project_broker_sale(uuid,numeric,uuid,text)
FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.register_project_broker_sale(uuid,numeric,uuid,text)
TO authenticated;


-- Refuse fixed-project conversion via ANY legacy path, without replacing
-- the bodies of existing register_sale overloads or other legacy functions.
CREATE OR REPLACE FUNCTION public.guard_fixed_project_sale_conversion()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $fn$
BEGIN
  IF TG_OP='UPDATE'
     AND NEW.status='converted' AND OLD.status IS DISTINCT FROM 'converted'
     AND EXISTS (
       SELECT 1 FROM public.lots l
       WHERE l.id=NEW.lot_id AND l.project_id IN (
         '761e73ed-cc0d-5605-a06a-4a4348523b4b'::uuid,
         'b4363fda-e99f-400d-ae95-2cbc8244b770'::uuid
       )
     )
     AND current_setting('app.verified_broker_sale',true) IS DISTINCT FROM 'ok'
  THEN
    RAISE EXCEPTION 'Esta venta requiere vendedor autorizado y cierre de comisión fija';
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.guard_fixed_project_sale_conversion()
  FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_guard_fixed_project_sale_conversion ON public.reservations;
CREATE TRIGGER trg_guard_fixed_project_sale_conversion
BEFORE UPDATE OF status ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.guard_fixed_project_sale_conversion();

-- A manual/admin insert also cannot create an unverified fixed-project commission.
-- This protects alternative call paths that insert commission rows without a reservation.
CREATE OR REPLACE FUNCTION public.guard_fixed_project_commission_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $fn$
BEGIN
  IF NEW.project_id IN (
    '761e73ed-cc0d-5605-a06a-4a4348523b4b'::uuid,
    'b4363fda-e99f-400d-ae95-2cbc8244b770'::uuid
  ) AND current_setting('app.verified_broker_sale',true) IS DISTINCT FROM 'ok'
  THEN
    RAISE EXCEPTION 'Comisión fija requiere cierre validado de reserva y vendedor';
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.guard_fixed_project_commission_insert()
  FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_guard_fixed_project_commission_insert ON public.agent_commissions;
CREATE TRIGGER trg_guard_fixed_project_commission_insert
BEFORE INSERT ON public.agent_commissions
FOR EACH ROW EXECUTE FUNCTION public.guard_fixed_project_commission_insert();

-- Critical: no self-service "paid" confirmation.
REVOKE ALL ON FUNCTION public.mark_commission_paid(uuid)
FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.mark_referral_paid(uuid)
FROM PUBLIC,anon,authenticated;
