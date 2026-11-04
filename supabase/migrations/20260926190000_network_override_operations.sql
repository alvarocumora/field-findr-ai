-- Network override operations: controlled lifecycle + audit trail.

CREATE TABLE IF NOT EXISTS public.broker_network_override_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  override_id uuid NOT NULL REFERENCES public.broker_network_overrides(id) ON DELETE CASCADE,
  actor_id uuid,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS broker_network_override_events_override_idx
  ON public.broker_network_override_events(override_id, created_at DESC);

ALTER TABLE public.broker_network_override_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.broker_network_override_events TO authenticated;
GRANT ALL ON public.broker_network_override_events TO service_role;

DROP POLICY IF EXISTS "Participants read network override events"
  ON public.broker_network_override_events;
CREATE POLICY "Participants read network override events"
  ON public.broker_network_override_events FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.broker_network_overrides bno
      WHERE bno.id = override_id
        AND auth.uid() IN (bno.beneficiary_broker_id, bno.source_broker_id)
    )
  );

CREATE OR REPLACE FUNCTION public.admin_update_network_override(
  p_override_id uuid,
  p_status text,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_before public.broker_network_overrides%ROWTYPE;
  v_allowed boolean := false;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF p_status NOT IN ('pending','paid','cancelled') THEN
    RAISE EXCEPTION 'Estado de override inválido';
  END IF;

  SELECT *
    INTO v_before
  FROM public.broker_network_overrides
  WHERE id = p_override_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Override no encontrado';
  END IF;

  IF p_status = v_before.status THEN
    RETURN p_override_id;
  END IF;

  v_allowed :=
    (v_before.status = 'pending' AND p_status IN ('paid','cancelled'));

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Transición inválida: % → %', v_before.status, p_status;
  END IF;

  UPDATE public.broker_network_overrides
  SET status = p_status,
      paid_at = CASE
        WHEN p_status = 'paid' THEN COALESCE(paid_at, now())
        ELSE paid_at
      END,
      updated_at = now()
  WHERE id = p_override_id;

  INSERT INTO public.broker_network_override_events (
    override_id, actor_id, event_type, from_status, to_status, details
  )
  VALUES (
    p_override_id,
    auth.uid(),
    CASE WHEN p_status = 'paid' THEN 'paid' ELSE 'cancelled' END,
    v_before.status,
    p_status,
    jsonb_build_object(
      'override_amount', v_before.override_amount,
      'override_rate', v_before.override_rate,
      'source_broker_id', v_before.source_broker_id,
      'beneficiary_broker_id', v_before.beneficiary_broker_id,
      'notes', p_notes
    )
  );

  INSERT INTO public.audit_logs (
    user_id, action, entity_type, entity_id, details
  )
  VALUES (
    auth.uid(),
    CASE WHEN p_status = 'paid' THEN 'network_override_paid' ELSE 'network_override_cancelled' END,
    'broker_network_overrides',
    p_override_id::text,
    jsonb_build_object(
      'from_status', v_before.status,
      'to_status', p_status,
      'amount', v_before.override_amount,
      'rate', v_before.override_rate,
      'notes', p_notes
    )
  );

  IF p_status = 'paid' THEN
    INSERT INTO public.notifications (
      user_id, type, title, message, link, metadata
    )
    VALUES (
      v_before.beneficiary_broker_id,
      'payment',
      'Override de red pagado',
      'Se registró el pago de tu override de red por $' || v_before.override_amount || '.',
      '/asesor/red',
      jsonb_build_object(
        'override_id', p_override_id,
        'amount', v_before.override_amount
      )
    );
  END IF;

  RETURN p_override_id;
END;
$fn$;

REVOKE ALL ON FUNCTION public.admin_update_network_override(uuid, text, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_network_override(uuid, text, text)
TO authenticated;

COMMENT ON TABLE public.broker_network_override_events IS
  'Append-only lifecycle history for broker network override payments.';
