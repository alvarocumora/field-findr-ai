-- Forward safety guard on the existing admin manual sale procedure.
-- All other projects retain the legacy behavior. No historical rows are edited.
CREATE OR REPLACE FUNCTION public.admin_register_manual_sale(p_agent_id uuid, p_sale_amount numeric, p_commission_rate numeric DEFAULT 3, p_project_id uuid DEFAULT NULL::uuid, p_lot_id uuid DEFAULT NULL::uuid, p_listing_id uuid DEFAULT NULL::uuid, p_referring_agent_id uuid DEFAULT NULL::uuid, p_referral_rate numeric DEFAULT 0, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_id uuid; v_amount numeric; v_ref numeric;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  IF p_sale_amount IS NULL OR p_sale_amount <= 0 THEN RAISE EXCEPTION 'Monto de venta inválido'; END IF;
  IF p_agent_id IS NULL THEN RAISE EXCEPTION 'Debes indicar el agente'; END IF;

  -- Fixed projects need a verified reservation, closing broker and capture.
  -- Manual percent-based entries here can duplicate or misattribute their fees.
  IF p_project_id IN (
    '761e73ed-cc0d-5605-a06a-4a4348523b4b'::uuid,
    'b4363fda-e99f-400d-ae95-2cbc8244b770'::uuid
  ) THEN
    RAISE EXCEPTION 'Usa el cierre de reserva con vendedor aprobado para este proyecto';
  END IF;

  v_amount := round(p_sale_amount * coalesce(p_commission_rate, 3) / 100.0);
  v_ref := round(p_sale_amount * coalesce(p_referral_rate, 0) / 100.0);

  INSERT INTO public.agent_commissions (
    agent_id, project_id, lot_id, listing_id, sale_amount, commission_rate, commission_amount,
    status, notes, referring_agent_id, referral_rate, referral_amount, referral_status
  ) VALUES (
    p_agent_id, p_project_id, p_lot_id, p_listing_id, p_sale_amount,
    coalesce(p_commission_rate, 3), v_amount, 'pending', p_notes,
    p_referring_agent_id, coalesce(p_referral_rate, 0), v_ref,
    CASE WHEN p_referring_agent_id IS NULL THEN 'none' ELSE 'pending' END
  ) RETURNING id INTO v_id;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'manual_sale_registered', 'agent_commissions', v_id::text,
          jsonb_build_object('agent_id', p_agent_id, 'sale_amount', p_sale_amount));

  RETURN v_id;
END; $function$
;
