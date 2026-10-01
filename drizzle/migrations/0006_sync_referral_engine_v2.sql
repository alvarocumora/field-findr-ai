CREATE OR REPLACE FUNCTION public.claim_user_referral(p_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE v_user uuid := auth.uid(); v_referral_id uuid;
BEGIN
  IF v_user IS NULL OR NULLIF(trim(p_code), '') IS NULL THEN RETURN false; END IF;
  SELECT id INTO v_referral_id FROM public.referrals
  WHERE referral_code = trim(p_code) AND referrer_id <> v_user AND referred_user_id IS NULL
  ORDER BY created_at ASC LIMIT 1 FOR UPDATE;
  IF v_referral_id IS NULL THEN RETURN false; END IF;
  UPDATE public.referrals SET referred_user_id = v_user,
    status = CASE WHEN status = 'pending' THEN 'registered' ELSE status END
  WHERE id = v_referral_id;
  RETURN true;
END; $fn$;
REVOKE ALL ON FUNCTION public.claim_user_referral(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_user_referral(text) TO authenticated;