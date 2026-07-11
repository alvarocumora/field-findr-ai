-- Self-contained test for the public lead-capture RPC.

DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  company_name text,
  public_slug text,
  is_public boolean DEFAULT false
);
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid
);
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid,
  first_name text NOT NULL,
  email text,
  phone text,
  source text,
  notes text,
  status text DEFAULT 'new'
);
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  metadata jsonb DEFAULT '{}'::jsonb
);

\i supabase/migrations/20260711180000_public_lead_capture.sql

INSERT INTO public.profiles (user_id, company_name, public_slug, is_public)
  VALUES ('11111111-1111-1111-1111-111111111111', 'Inmobiliaria Sur', 'sur', true),
         ('22222222-2222-2222-2222-222222222222', 'Privada', 'oculta', false);
INSERT INTO public.projects (id, user_id)
  VALUES ('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111'),
         ('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222');

DO $$
DECLARE _lead uuid; n int; owner uuid; proj uuid;
BEGIN
  -- happy path: creates a lead for the agency owner + a notification
  _lead := public.create_public_lead('sur', 'Ana', 'ana@example.cl', NULL, 'Me interesa el lote 5', '99999999-9999-9999-9999-999999999999');
  SELECT user_id, project_id INTO owner, proj FROM public.leads WHERE id = _lead;
  ASSERT owner = '11111111-1111-1111-1111-111111111111', 'lead must belong to the agency owner';
  ASSERT proj = '99999999-9999-9999-9999-999999999999', 'valid project should attach';
  SELECT count(*) INTO n FROM public.notifications WHERE user_id = owner AND type = 'lead';
  ASSERT n = 1, 'owner should get a lead notification';

  -- a project of ANOTHER agency is ignored (not attached)
  _lead := public.create_public_lead('sur', 'Beto', NULL, '+56911112222', NULL, '88888888-8888-8888-8888-888888888888');
  SELECT project_id INTO proj FROM public.leads WHERE id = _lead;
  ASSERT proj IS NULL, 'foreign project must not attach';

  -- non-public agency rejected
  BEGIN
    PERFORM public.create_public_lead('oculta', 'X', 'x@x.cl', NULL, NULL, NULL);
    RAISE EXCEPTION 'non-public agency should be rejected';
  EXCEPTION WHEN others THEN
    ASSERT SQLERRM LIKE '%no encontrada%', 'expected not-found error, got: '||SQLERRM;
  END;

  -- no contact info rejected
  BEGIN
    PERFORM public.create_public_lead('sur', 'SinContacto', NULL, NULL, NULL, NULL);
    RAISE EXCEPTION 'missing contact should be rejected';
  EXCEPTION WHEN others THEN
    ASSERT SQLERRM LIKE '%email o teléfono%', 'expected contact error, got: '||SQLERRM;
  END;

  RAISE NOTICE 'ALL PUBLIC LEAD ASSERTIONS PASSED';
END $$;
