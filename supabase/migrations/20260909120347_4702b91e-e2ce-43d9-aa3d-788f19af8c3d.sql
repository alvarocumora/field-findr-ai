CREATE OR REPLACE FUNCTION public.create_public_visit_request(
  p_project_id uuid,
  p_lot_id uuid DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_scheduled_at timestamptz DEFAULT NULL,
  p_mode text DEFAULT 'presencial',
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_listing uuid;
  v_lead uuid;
  v_visit uuid;
  v_name text := btrim(coalesce(p_name, ''));
  v_email text := nullif(btrim(coalesce(p_email, '')), '');
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_mode text := coalesce(nullif(btrim(coalesce(p_mode, '')), ''), 'presencial');
BEGIN
  IF v_name = '' THEN
    RAISE EXCEPTION 'Nombre requerido';
  END IF;
  IF v_email IS NULL AND v_phone IS NULL THEN
    RAISE EXCEPTION 'Email o teléfono requerido';
  END IF;
  IF p_scheduled_at IS NULL OR p_scheduled_at < now() - interval '1 hour' THEN
    RAISE EXCEPTION 'Fecha de visita inválida';
  END IF;
  IF v_mode NOT IN ('presencial', 'virtual', 'tour') THEN
    v_mode := 'presencial';
  END IF;

  SELECT user_id INTO v_owner FROM public.projects WHERE id = p_project_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Proyecto no encontrado';
  END IF;

  IF p_lot_id IS NOT NULL THEN
    SELECT listing_id INTO v_listing
    FROM public.lots
    WHERE id = p_lot_id AND project_id = p_project_id;
  END IF;

  INSERT INTO public.leads (
    user_id, project_id, lot_id, listing_id, first_name, email, phone,
    source, status, interest_type, preferred_contact, notes
  ) VALUES (
    v_owner, p_project_id, p_lot_id, v_listing, v_name, v_email, v_phone,
    'visita_web', 'new', 'visita',
    CASE WHEN v_phone IS NOT NULL THEN 'phone' ELSE 'email' END,
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  RETURNING id INTO v_lead;

  INSERT INTO public.visits (
    user_id, lead_id, project_id, lot_id, listing_id,
    visitor_name, visitor_email, visitor_phone,
    scheduled_at, duration_minutes, mode, status, notes
  ) VALUES (
    v_owner, v_lead, p_project_id, p_lot_id, v_listing,
    v_name, v_email, v_phone,
    p_scheduled_at, 60, v_mode, 'scheduled',
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  RETURNING id INTO v_visit;

  RETURN v_visit;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_visit_request(uuid, uuid, text, text, text, timestamptz, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_visit_request(uuid, uuid, text, text, text, timestamptz, text, text) TO anon, authenticated, service_role;