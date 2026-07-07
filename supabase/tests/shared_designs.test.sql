-- Functional test for 20260707120000_shared_designs.sql: RLS (owner-only rows,
-- no enumeration) + public token RPC. Self-contained, run on a throwaway DB.
\set ON_ERROR_STOP on

DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('test.uid', true), '')::uuid $$;

\i supabase/migrations/20260707120000_shared_designs.sql

-- Seed two designs by two different owners (as superuser, bypassing RLS).
INSERT INTO public.shared_designs (token, created_by, lot_number, design_json)
VALUES
  ('tokenAAA', '00000000-0000-0000-0000-0000000000a1', 'A-1', '[{"type":"casa_80"}]'),
  ('tokenBBB', '00000000-0000-0000-0000-0000000000b2', 'B-2', '[]');

DO $$
DECLARE n int; d jsonb; failed boolean;
BEGIN
  -- Anonymous visitor: no table grant at all → direct access denied (cannot
  -- even attempt enumeration)…
  PERFORM set_config('test.uid', '', true);
  SET LOCAL ROLE anon;
  failed := false;
  BEGIN
    EXECUTE 'SELECT count(*) FROM public.shared_designs' INTO n;
  EXCEPTION WHEN insufficient_privilege THEN failed := true; END;
  IF NOT failed THEN RAISE EXCEPTION 'FAIL: anon can access shared_designs table directly'; END IF;

  -- …but CAN fetch a specific design by token via the RPC.
  EXECUTE 'SELECT count(*) FROM public.get_shared_design(''tokenAAA'')' INTO n;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: RPC did not return the shared design for a valid token'; END IF;
  EXECUTE 'SELECT design_json FROM public.get_shared_design(''tokenAAA'')' INTO d;
  IF d IS NULL THEN RAISE EXCEPTION 'FAIL: RPC returned null design_json'; END IF;

  -- Unknown token → no rows.
  EXECUTE 'SELECT count(*) FROM public.get_shared_design(''nope'')' INTO n;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: RPC returned a row for an unknown token'; END IF;
  RESET ROLE;
  RAISE NOTICE 'OK: anon cannot enumerate, RPC resolves valid token, rejects unknown';

  -- Owner A sees only their own row via RLS.
  PERFORM set_config('test.uid', '00000000-0000-0000-0000-0000000000a1', true);
  SET LOCAL ROLE authenticated;
  EXECUTE 'SELECT count(*) FROM public.shared_designs' INTO n;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: owner A sees % rows (expected only their 1)', n; END IF;
  -- Owner A can insert their own; inserting as another user must fail.
  BEGIN
    EXECUTE 'INSERT INTO public.shared_designs (created_by, design_json) VALUES (''00000000-0000-0000-0000-0000000000b2'', ''[]'')';
    RAISE EXCEPTION 'FAIL: owner A inserted a row owned by someone else';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL; END;
  RESET ROLE;
  RAISE NOTICE 'OK: RLS restricts rows to the owner; cross-owner insert blocked';
END $$;

SELECT 'ALL SHARED_DESIGNS TESTS PASSED' AS result;
