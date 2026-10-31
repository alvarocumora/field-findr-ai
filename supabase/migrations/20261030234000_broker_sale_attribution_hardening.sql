-- Fase 2 / Broker flow: explicit seller on fixed-project sales
-- Apply ONLY after canonical sales ledger, fixed commission rules, Hualañé 750k
-- and public broker attribution migrations. No historical commission edits.
-- This is a new, purpose-built RPC; legacy percentage sale calls are guarded.

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

  SELECT fixed_sale_amount, referral_fixed_amount
    INTO v_fixed,v_capture_amount
  FROM public.commission_rules
  WHERE scope='project' AND project_id=v_res.lot_project_id
    AND is_active=true AND fixed_sale_amount IS NOT NULL;
  IF NOT FOUND OR v_fixed<=0 THEN
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

  IF v_referring IS NOT NULL AND v_referring=p_closing_agent_id THEN
    RAISE EXCEPTION 'La coincidencia de vendedor y captador requiere revisión comercial';
  END IF;

  IF EXISTS (SELECT 1 FROM public.agent_commissions
             WHERE reservation_id=p_reservation_id AND status<>'cancelled') THEN
    RAISE EXCEPTION 'Esta reserva ya tiene una comisión asociada';
  END IF;

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


-- Preserve the existing legacy API for other projects; fail closed for fixed projects.
CREATE OR REPLACE FUNCTION public.register_sale(p_reservation_id uuid, p_sale_amount numeric, p_commission_rate numeric DEFAULT NULL::numeric, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_res record;
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

  -- Fixed-project sales need verified seller attribution; legacy percent-based
  -- register_sale cannot assign a closing broker and must never run for them.
  IF v_res.lot_project_id IN ('761e73ed-cc0d-5605-a06a-4a4348523b4b'::uuid,'b4363fda-e99f-400d-ae95-2cbc8244b770'::uuid) THEN
    RAISE EXCEPTION 'Este proyecto requiere registrar venta con vendedor aprobado y comisión fija.';
  END IF;

  UPDATE public.reservations
  SET status = 'converted',
      converted_at = now(),
      notes = COALESCE(p_notes, notes)
  WHERE id = p_reservation_id;

  UPDATE public.lots
  SET price = p_sale_amount,
      price_per_sqm = CASE WHEN area > 0 THEN round(p_sale_amount / area) ELSE price_per_sqm END
  WHERE id = v_res.lot_id;

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
$function$
;

-- Preserve the existing legacy API for other projects; fail closed for fixed projects.
CREATE OR REPLACE FUNCTION public.register_sale(p_reservation_id uuid, p_sale_amount numeric, p_commission_rate numeric DEFAULT NULL::numeric, p_notes text DEFAULT NULL::text, p_referring_agent_id uuid DEFAULT NULL::uuid, p_referral_rate numeric DEFAULT NULL::numeric, p_lead_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Fixed-project sales need verified seller attribution; legacy percent-based
  -- register_sale cannot assign a closing broker and must never run for them.
  IF v_res.lot_project_id IN ('761e73ed-cc0d-5605-a06a-4a4348523b4b'::uuid,'b4363fda-e99f-400d-ae95-2cbc8244b770'::uuid) THEN
    RAISE EXCEPTION 'Este proyecto requiere registrar venta con vendedor aprobado y comisión fija.';
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
$function$
;


-- Critical: no self-service "paid" confirmation.
REVOKE ALL ON FUNCTION public.mark_commission_paid(uuid)
FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.mark_referral_paid(uuid)
FROM PUBLIC,anon,authenticated;
