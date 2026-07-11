-- Self-contained test for the public agency showcase RPC.
-- Creates a minimal profiles stub, applies the migration, and asserts the RPC
-- exposes only opted-in agencies and enforces slug uniqueness.

DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  first_name text,
  email text
);

\i supabase/migrations/20260711160000_agency_showcase.sql

INSERT INTO public.profiles (user_id, company_name, public_slug, bio, is_public) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Inmobiliaria Sur', 'sur', 'Loteos en el Maule', true),
  ('22222222-2222-2222-2222-222222222222', 'Privada', 'oculta', 'x', false);

DO $$
DECLARE c text; n int;
BEGIN
  SELECT company_name INTO c FROM public.get_agency_by_slug('sur');
  ASSERT c = 'Inmobiliaria Sur', 'public agency should resolve, got '||coalesce(c,'NULL');

  SELECT count(*) INTO n FROM public.get_agency_by_slug('oculta');
  ASSERT n = 0, 'non-public agency must not resolve';

  SELECT count(*) INTO n FROM public.get_agency_by_slug('nope');
  ASSERT n = 0, 'unknown slug must not resolve';

  -- slug uniqueness
  BEGIN
    INSERT INTO public.profiles (user_id, public_slug) VALUES ('33333333-3333-3333-3333-333333333333', 'sur');
    RAISE EXCEPTION 'duplicate slug should have been rejected';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  RAISE NOTICE 'ALL AGENCY ASSERTIONS PASSED';
END $$;

-- anon can execute the RPC
SET ROLE anon;
SELECT company_name FROM public.get_agency_by_slug('sur');
RESET ROLE;
