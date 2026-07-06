-- Verifies the public-read contract for lots that the map/parcel cards depend on:
--   * RLS: anyone can read lots of ACTIVE projects, not of inactive ones.
--   * Column grants: buyer_* PII is NOT readable by anon/authenticated, so
--     `SELECT *` is rejected but the explicit non-PII column list works.
-- Self-contained: creates its own roles, schema, policies and grants, mirroring
-- migrations 20260205152710 + 20260603153301. Run on a throwaway database.
\set ON_ERROR_STOP on

DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('test.uid', true), '')::uuid $$;

CREATE TABLE public.projects (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active'
);

CREATE TABLE public.lots (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id),
  user_id uuid NOT NULL,
  lot_number text,
  area numeric,
  price numeric,
  status text DEFAULT 'available',
  polygon jsonb,
  features jsonb,
  buyer_name text,
  buyer_email text,
  buyer_phone text
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;

-- Policies (mirror 20260205152710)
CREATE POLICY "Anyone can view active projects" ON public.projects
  FOR SELECT USING (status = 'active');
CREATE POLICY "Anyone can view lots from active projects" ON public.lots
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = lots.project_id AND p.status = 'active'
  ));

-- Column grants (mirror 20260603153301)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
REVOKE SELECT ON public.lots FROM anon, authenticated;
GRANT SELECT (
  id, project_id, user_id, lot_number, area, price, status, polygon, features
) ON public.lots TO anon, authenticated;
GRANT SELECT ON public.projects TO anon, authenticated;

-- Seed: one active project with a lot, one inactive with a lot
INSERT INTO public.projects (id, user_id, status) VALUES
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000099', 'active'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000099', 'planning');
INSERT INTO public.lots (id, project_id, user_id, lot_number, area, price, polygon, buyer_name) VALUES
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000099', 'A-1', 5000, 1000000, '[[0,0],[1,0],[1,1]]', 'Comprador Secreto'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000099', 'B-1', 4000, 900000, '[[2,2],[3,2],[3,3]]', 'Otro Comprador');

DO $$
DECLARE
  n int;
  failed boolean;
BEGIN
  -- Visitor is a DIFFERENT user than the owner
  PERFORM set_config('test.uid', '00000000-0000-0000-0000-000000000042', true);

  SET LOCAL ROLE authenticated;

  -- 1) Explicit non-PII columns on an active project's lot → visible
  EXECUTE 'SELECT count(*) FROM public.lots WHERE project_id = ''00000000-0000-0000-0000-0000000000a1''' INTO n;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: explicit-column read of active project returned % rows (expected 1)', n; END IF;

  -- 2) The polygon (needed to draw the lot) is readable
  EXECUTE 'SELECT count(polygon) FROM public.lots WHERE project_id = ''00000000-0000-0000-0000-0000000000a1''' INTO n;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: polygon not readable for active project lot'; END IF;

  -- 3) SELECT * must be rejected (buyer_* not granted)
  failed := false;
  BEGIN
    EXECUTE 'SELECT * FROM public.lots WHERE project_id = ''00000000-0000-0000-0000-0000000000a1''';
  EXCEPTION WHEN insufficient_privilege THEN
    failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'FAIL: SELECT * unexpectedly allowed (PII leak risk)'; END IF;

  -- 4) buyer_* columns individually rejected
  failed := false;
  BEGIN
    EXECUTE 'SELECT buyer_name FROM public.lots LIMIT 1';
  EXCEPTION WHEN insufficient_privilege THEN
    failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'FAIL: buyer_name readable by authenticated (PII leak)'; END IF;

  -- 5) Inactive project lots hidden by RLS
  EXECUTE 'SELECT count(*) FROM public.lots WHERE project_id = ''00000000-0000-0000-0000-0000000000a2''' INTO n;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: inactive project lot visible (% rows)', n; END IF;

  RESET ROLE;
  RAISE NOTICE 'OK (authenticated): explicit cols work, SELECT */PII blocked, inactive hidden';

  -- Anonymous visitor: same guarantees
  SET LOCAL ROLE anon;
  EXECUTE 'SELECT count(*) FROM public.lots WHERE project_id = ''00000000-0000-0000-0000-0000000000a1''' INTO n;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: anon explicit-column read returned % rows', n; END IF;
  failed := false;
  BEGIN
    EXECUTE 'SELECT * FROM public.lots';
  EXCEPTION WHEN insufficient_privilege THEN failed := true; END;
  IF NOT failed THEN RAISE EXCEPTION 'FAIL: anon SELECT * allowed (PII leak risk)'; END IF;
  RESET ROLE;
  RAISE NOTICE 'OK (anon): explicit cols work, SELECT * blocked';
END $$;

SELECT 'ALL LOTS PUBLIC-READ TESTS PASSED' AS result;
