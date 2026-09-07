-- P4 Events — 1:N Open Land events, registration, check-in and CRM conversion.

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  venue text,
  address text,
  capacity integer CHECK (capacity IS NULL OR capacity > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','cancelled','completed')),
  reminder_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  attendee_name text NOT NULL,
  attendee_email text NOT NULL,
  attendee_phone text,
  status text NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered','confirmed','attended','no_show','cancelled')),
  checkin_code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  registered_at timestamptz NOT NULL DEFAULT now(),
  checked_in_at timestamptz,
  UNIQUE(event_id, attendee_email)
);

CREATE TABLE public.event_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL UNIQUE REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  checked_in_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE RESTRICT,
  checked_in_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX events_public_schedule_idx ON public.events(status, starts_at);
CREATE INDEX events_organizer_idx ON public.events(organizer_id, starts_at DESC);
CREATE INDEX event_registrations_event_idx ON public.event_registrations(event_id, status);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT, UPDATE ON public.event_registrations TO authenticated;
GRANT SELECT ON public.event_checkins TO authenticated;
GRANT ALL ON public.events, public.event_registrations, public.event_checkins TO service_role;

CREATE POLICY "Public reads published events" ON public.events
  FOR SELECT USING (status = 'published' OR organizer_id = auth.uid() OR public.is_platform_admin());
CREATE POLICY "Organizers create events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (organizer_id = auth.uid());
CREATE POLICY "Organizers update events" ON public.events
  FOR UPDATE TO authenticated USING (organizer_id = auth.uid() OR public.is_platform_admin())
  WITH CHECK (organizer_id = auth.uid() OR public.is_platform_admin());
CREATE POLICY "Organizers delete draft events" ON public.events
  FOR DELETE TO authenticated USING ((organizer_id = auth.uid() AND status = 'draft') OR public.is_platform_admin());

CREATE POLICY "Organizers read registrations" ON public.event_registrations
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.organizer_id = auth.uid() OR public.is_platform_admin()))
  );
CREATE POLICY "Organizers update registrations" ON public.event_registrations
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND (e.organizer_id = auth.uid() OR public.is_platform_admin()))
  );

CREATE POLICY "Organizers read checkins" ON public.event_checkins
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.event_registrations r
      JOIN public.events e ON e.id = r.event_id
      WHERE r.id = registration_id AND (e.organizer_id = auth.uid() OR public.is_platform_admin())
    )
  );

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.register_for_event(
  p_event_id uuid,
  p_name text,
  p_email text,
  p_phone text DEFAULT NULL
) RETURNS TABLE(registration_id uuid, checkin_code text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_id uuid;
  v_code text;
  v_count integer;
BEGIN
  IF length(trim(COALESCE(p_name, ''))) < 2 OR position('@' in COALESCE(p_email, '')) < 2 THEN
    RAISE EXCEPTION 'Nombre y email válidos son requeridos';
  END IF;

  SELECT * INTO v_event FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF v_event.id IS NULL OR v_event.status <> 'published' OR v_event.starts_at <= now() THEN
    RAISE EXCEPTION 'Evento no disponible para inscripción';
  END IF;

  SELECT count(*) INTO v_count FROM public.event_registrations
  WHERE event_id = p_event_id AND status <> 'cancelled';
  IF v_event.capacity IS NOT NULL AND v_count >= v_event.capacity THEN
    RAISE EXCEPTION 'Evento sin cupos disponibles';
  END IF;

  INSERT INTO public.event_registrations(event_id, attendee_name, attendee_email, attendee_phone)
  VALUES (p_event_id, trim(p_name), lower(trim(p_email)), NULLIF(trim(p_phone), ''))
  ON CONFLICT (event_id, attendee_email) DO UPDATE
    SET attendee_name = EXCLUDED.attendee_name,
        attendee_phone = EXCLUDED.attendee_phone,
        status = CASE WHEN event_registrations.status = 'cancelled' THEN 'registered' ELSE event_registrations.status END
  RETURNING id, event_registrations.checkin_code INTO v_id, v_code;

  RETURN QUERY SELECT v_id, v_code;
END;
$$;

REVOKE ALL ON FUNCTION public.register_for_event(uuid,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_for_event(uuid,text,text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.checkin_event_attendee(p_code text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_registration public.event_registrations%ROWTYPE;
BEGIN
  SELECT r.* INTO v_registration
  FROM public.event_registrations r
  JOIN public.events e ON e.id = r.event_id
  WHERE r.checkin_code = upper(trim(p_code))
    AND (e.organizer_id = auth.uid() OR public.is_platform_admin())
  FOR UPDATE OF r;

  IF v_registration.id IS NULL THEN RAISE EXCEPTION 'Código no encontrado o sin acceso'; END IF;

  INSERT INTO public.event_checkins(registration_id, checked_in_by)
  VALUES (v_registration.id, auth.uid())
  ON CONFLICT (registration_id) DO NOTHING;

  UPDATE public.event_registrations
  SET status = 'attended', checked_in_at = COALESCE(checked_in_at, now())
  WHERE id = v_registration.id;

  RETURN v_registration.id;
END;
$$;

REVOKE ALL ON FUNCTION public.checkin_event_attendee(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.checkin_event_attendee(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.convert_event_registration_to_lead(p_registration_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_registration public.event_registrations%ROWTYPE;
  v_event public.events%ROWTYPE;
  v_lead_id uuid;
BEGIN
  SELECT r.* INTO v_registration FROM public.event_registrations r WHERE r.id = p_registration_id FOR UPDATE;
  SELECT * INTO v_event FROM public.events WHERE id = v_registration.event_id;

  IF v_event.id IS NULL OR (v_event.organizer_id <> auth.uid() AND NOT public.is_platform_admin()) THEN
    RAISE EXCEPTION 'Registro no encontrado o sin acceso';
  END IF;

  IF v_registration.lead_id IS NOT NULL THEN RETURN v_registration.lead_id; END IF;

  INSERT INTO public.leads(
    user_id, project_id, listing_id, first_name, email, phone, source, status, notes
  ) VALUES (
    v_event.organizer_id, v_event.project_id, v_event.listing_id,
    v_registration.attendee_name, v_registration.attendee_email, v_registration.attendee_phone,
    'event:' || v_event.slug, 'new', 'Lead originado en evento ' || v_event.title
  ) RETURNING id INTO v_lead_id;

  UPDATE public.event_registrations SET lead_id = v_lead_id WHERE id = p_registration_id;
  RETURN v_lead_id;
END;
$$;

REVOKE ALL ON FUNCTION public.convert_event_registration_to_lead(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.convert_event_registration_to_lead(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_event_funnel(p_event_id uuid)
RETURNS TABLE(registered bigint, attended bigint, leads bigint, reservations bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    count(*) FILTER (WHERE r.status <> 'cancelled'),
    count(*) FILTER (WHERE r.status = 'attended'),
    count(*) FILTER (WHERE r.lead_id IS NOT NULL),
    count(*) FILTER (WHERE r.reservation_id IS NOT NULL)
  FROM public.event_registrations r
  JOIN public.events e ON e.id = r.event_id
  WHERE r.event_id = p_event_id
    AND (e.organizer_id = auth.uid() OR public.is_platform_admin());
$$;

REVOKE ALL ON FUNCTION public.get_event_funnel(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_event_funnel(uuid) TO authenticated;
