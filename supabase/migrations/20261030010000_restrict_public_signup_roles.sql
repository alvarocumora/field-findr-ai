-- Public signup metadata is untrusted. Administrative roles must be assigned
-- through an authorized privileged operation, never account_type metadata.
-- Preserve the existing profile/trigger contract and existing role assignments.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );

  -- Keep both currently supported public signup intents. Every other value,
  -- including malformed JSON values and privileged role names, becomes buyer.
  _role := CASE
    WHEN NEW.raw_user_meta_data->>'account_type' = 'agent' THEN 'agent'::public.app_role
    ELSE 'buyer'::public.app_role
  END;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;

-- Trigger execution remains available to Auth; direct API execution does not.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
