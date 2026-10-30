-- Self-contained integration regression. Run ONLY on a disposable PostgreSQL.
-- It intentionally proves the old behavior before applying the actual fix.
\set ON_ERROR_STOP on
DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE ROLE signup_test_service NOLOGIN;
CREATE SCHEMA auth;
CREATE TYPE public.app_role AS ENUM ('buyer', 'agent', 'admin');
CREATE TABLE auth.users (
  id uuid PRIMARY KEY,
  email text,
  raw_user_meta_data jsonb DEFAULT '{}'
);
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text, first_name text, last_name text
);
CREATE TABLE public.user_roles (
  user_id uuid REFERENCES auth.users(id), role public.app_role,
  PRIMARY KEY (user_id, role)
);
GRANT USAGE ON SCHEMA auth TO signup_test_service;
GRANT INSERT, UPDATE ON auth.users TO signup_test_service;
-- The service fixture may insert Auth rows, but cannot insert app roles/profiles.
\ir ../migrations/20260213112738_d3caed97-36eb-4393-9071-4f54af199aaf.sql
SET ROLE signup_test_service;
INSERT INTO auth.users VALUES ('00000000-0000-4000-8000-000000000001', 'legacy@example.test', '{"account_type":"admin"}');
RESET ROLE;
DO $$ BEGIN
  ASSERT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = '00000000-0000-4000-8000-000000000001' AND role = 'admin'), 'control: historical migration must reproduce metadata-to-admin risk';
END $$;

\ir ../migrations/20261030010000_restrict_public_signup_roles.sql
-- Applying again must not detach the existing trigger or alter existing roles.
\ir ../migrations/20261030010000_restrict_public_signup_roles.sql
SET ROLE signup_test_service;
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
 ('00000000-0000-4000-8000-000000000002', 'buyer@example.test', '{"account_type":"buyer"}'),
 ('00000000-0000-4000-8000-000000000003', 'agent@example.test', '{"account_type":"agent","first_name":"Broker","last_name":"Prueba"}'),
 ('00000000-0000-4000-8000-000000000004', 'admin-attempt@example.test', '{"account_type":"admin"}'),
 ('00000000-0000-4000-8000-000000000005', 'unknown@example.test', '{"account_type":"commercial_manager"}'),
 ('00000000-0000-4000-8000-000000000006', 'empty@example.test', '{"account_type":""}'),
 ('00000000-0000-4000-8000-000000000007', 'missing@example.test', '{}'),
 ('00000000-0000-4000-8000-000000000008', 'null@example.test', '{"account_type":null}'),
 ('00000000-0000-4000-8000-000000000009', 'number@example.test', '{"account_type":17}'),
 ('00000000-0000-4000-8000-000000000010', 'array@example.test', '{"account_type":["admin"]}'),
 ('00000000-0000-4000-8000-000000000011', 'object@example.test', '{"account_type":{"role":"admin"}}'),
 ('00000000-0000-4000-8000-000000000012', 'alternate-key@example.test', '{"role":"admin"}'),
 ('00000000-0000-4000-8000-000000000013', 'uppercase@example.test', '{"account_type":"ADMIN"}'),
 ('00000000-0000-4000-8000-000000000014', 'null-metadata@example.test', null);
RESET ROLE;
DO $$
DECLARE _user record; _expected public.app_role;
BEGIN
  FOR _user IN SELECT id FROM auth.users WHERE id <> '00000000-0000-4000-8000-000000000001' LOOP
    _expected := CASE WHEN _user.id = '00000000-0000-4000-8000-000000000003' THEN 'agent'::public.app_role ELSE 'buyer'::public.app_role END;
    ASSERT (SELECT count(*) = 1 FROM public.user_roles WHERE user_id = _user.id), 'exactly one initial role required';
    ASSERT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user.id AND role = _expected), 'unexpected initial role';
    ASSERT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user.id), 'signup must create profile';
  END LOOP;
  ASSERT (SELECT count(*) = 1 FROM public.user_roles WHERE role = 'admin'), 'only pre-existing admin may remain';
  ASSERT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'agent@example.test' AND first_name = 'Broker' AND last_name = 'Prueba'), 'profile metadata contract must be preserved';
  ASSERT NOT has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE'), 'anon direct execution forbidden';
  ASSERT NOT has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE'), 'authenticated direct execution forbidden';
  RAISE NOTICE '13 signup metadata cases passed; existing roles, profile fields and function ACL preserved';
END $$;
-- Updating the untrusted metadata after signup cannot assign new roles either.
UPDATE auth.users SET raw_user_meta_data = '{"account_type":"admin"}' WHERE id = '00000000-0000-4000-8000-000000000002';
DO $$ BEGIN
  ASSERT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = '00000000-0000-4000-8000-000000000002' AND role = 'buyer'), 'metadata update cannot promote buyer';
  ASSERT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = '00000000-0000-4000-8000-000000000002' AND role = 'admin'), 'metadata update cannot add admin';
  RAISE NOTICE 'AUTH SIGNUP ROLE REGRESSION PASSED';
END $$;
