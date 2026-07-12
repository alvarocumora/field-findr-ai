-- Public lead capture from the agency showcase (/inmobiliaria/:slug).
--
-- A visitor must be able to send an inquiry without any access to the `leads`
-- table. This SECURITY DEFINER RPC resolves the agency owner FROM THE PUBLIC
-- SLUG (never a caller-supplied user_id, so leads can't be injected to
-- arbitrary accounts), inserts the lead for that owner and notifies them.

-- DROP first so a re-push that changes the signature can't hit
-- "cannot change return type of existing function".
DROP FUNCTION IF EXISTS public.create_public_lead(text, text, text, text, text, uuid);
CREATE OR REPLACE FUNCTION public.create_public_lead(
  p_slug text,
  p_first_name text,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_project_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid;
  _project uuid;
  _lead uuid;
BEGIN
  SELECT user_id INTO _owner
  FROM public.profiles
  WHERE is_public = true AND public_slug = p_slug
  LIMIT 1;

  IF _owner IS NULL THEN
    RAISE EXCEPTION 'Agencia no encontrada';
  END IF;
  IF coalesce(btrim(p_first_name), '') = '' THEN
    RAISE EXCEPTION 'El nombre es obligatorio';
  END IF;
  IF coalesce(btrim(p_email), '') = '' AND coalesce(btrim(p_phone), '') = '' THEN
    RAISE EXCEPTION 'Ingresa un email o teléfono de contacto';
  END IF;

  -- Only accept a project that actually belongs to this agency.
  SELECT id INTO _project FROM public.projects WHERE id = p_project_id AND user_id = _owner;

  INSERT INTO public.leads (user_id, project_id, first_name, email, phone, source, notes, status)
  VALUES (_owner, _project, btrim(p_first_name), nullif(btrim(p_email), ''), nullif(btrim(p_phone), ''),
          'vitrina', nullif(btrim(p_message), ''), 'new')
  RETURNING id INTO _lead;

  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (_owner, 'lead', 'Nuevo contacto desde tu vitrina',
          btrim(p_first_name) || ' te contactó desde tu vitrina pública.',
          '/asesor/dashboard',
          jsonb_build_object('lead_id', _lead, 'source', 'vitrina'));

  RETURN _lead;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_public_lead(text, text, text, text, text, uuid) TO anon, authenticated;
