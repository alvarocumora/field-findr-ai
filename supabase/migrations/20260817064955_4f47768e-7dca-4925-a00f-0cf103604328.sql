CREATE OR REPLACE FUNCTION public.create_listing_lead(
  p_listing_id uuid,
  p_first_name text,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_source text DEFAULT 'ficha_publica'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner uuid;
  v_title text;
  v_found boolean;
  v_lead uuid;
BEGIN
  IF coalesce(btrim(p_first_name), '') = '' THEN
    RAISE EXCEPTION 'El nombre es obligatorio';
  END IF;
  IF coalesce(btrim(p_email), '') = '' AND coalesce(btrim(p_phone), '') = '' THEN
    RAISE EXCEPTION 'Ingresa un email o teléfono de contacto';
  END IF;

  SELECT true, user_id, title INTO v_found, v_owner, v_title
  FROM public.listings
  WHERE id = p_listing_id AND status = 'active';

  IF v_found IS NOT TRUE THEN
    RAISE EXCEPTION 'Propiedad no disponible';
  END IF;

  -- Inventario sin dueño (importado/demo): lo atiende la plataforma.
  IF v_owner IS NULL THEN
    SELECT user_id INTO v_owner FROM public.user_roles WHERE role = 'admin' ORDER BY created_at LIMIT 1;
  END IF;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'No hay un responsable para esta propiedad';
  END IF;

  INSERT INTO public.leads (
    user_id, listing_id, first_name, email, phone, notes, source, status
  ) VALUES (
    v_owner,
    p_listing_id,
    left(btrim(p_first_name), 100),
    nullif(left(btrim(p_email), 200), ''),
    nullif(left(btrim(p_phone), 40), ''),
    nullif(left(btrim(coalesce(p_message, '')), 2000), ''),
    left(coalesce(nullif(btrim(p_source), ''), 'ficha_publica'), 60),
    'new'
  )
  RETURNING id INTO v_lead;

  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (
    v_owner, 'lead', 'Nuevo contacto desde tu publicación',
    btrim(p_first_name) || ' consultó por "' || coalesce(v_title, 'tu propiedad') || '".',
    '/asesor/leads',
    jsonb_build_object('lead_id', v_lead, 'listing_id', p_listing_id, 'source', p_source)
  );

  RETURN v_lead;
END;
$$;