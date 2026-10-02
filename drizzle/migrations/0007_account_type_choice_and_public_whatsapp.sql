ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_whatsapp text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type_chosen_at timestamptz;

CREATE OR REPLACE FUNCTION public.choose_account_type(_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _chosen timestamptz;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF _type NOT IN ('buyer','agent') THEN RAISE EXCEPTION 'Tipo de cuenta inválido'; END IF;

  SELECT account_type_chosen_at INTO _chosen FROM public.profiles WHERE user_id = _uid;
  IF _chosen IS NOT NULL THEN RETURN 'already_chosen'; END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'buyer') ON CONFLICT DO NOTHING;
  IF _type = 'agent' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'agent') ON CONFLICT DO NOTHING;
  END IF;

  UPDATE public.profiles SET account_type_chosen_at = now() WHERE user_id = _uid;
  RETURN _type;
END;
$$;
REVOKE ALL ON FUNCTION public.choose_account_type(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.choose_account_type(text) TO authenticated;