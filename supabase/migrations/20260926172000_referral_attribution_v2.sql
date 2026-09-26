-- Referral Attribution V2
-- Separates user rewards (OT- codes) from broker network/sales attribution
-- (BK- codes). This migration only claims general user referrals.

CREATE OR REPLACE FUNCTION public.claim_user_referral(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
DECLARE
  v_uid uuid := auth.uid();
  v_referral_id uuid;
  v_referrer_id uuid;
  v_created_at timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Requiere sesión';
  END IF;

  IF p_code IS NULL OR upper(trim(p_code)) !~ '^OT-[A-Z0-9_-]{3,76}$' THEN
    RETURN false;
  END IF;

  -- Serialize claims for the same account.
  PERFORM pg_advisory_xact_lock(hashtext(v_uid::text));

  SELECT created_at INTO v_created_at
  FROM auth.users
  WHERE id = v_uid;

  -- Referral rewards are onboarding attribution, not retroactive account claims.
  IF v_created_at IS NULL OR v_created_at < now() - interval '7 days' THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.referrals
    WHERE referred_user_id = v_uid
  ) THEN
    RETURN false;
  END IF;

  SELECT r.id, r.referrer_id
    INTO v_referral_id, v_referrer_id
  FROM public.referrals r
  WHERE upper(r.referral_code) = upper(trim(p_code))
    AND r.referred_user_id IS NULL
    AND r.status = 'pending'
  ORDER BY r.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_referral_id IS NULL OR v_referrer_id = v_uid THEN
    RETURN false;
  END IF;

  UPDATE public.referrals
  SET referred_user_id = v_uid,
      status = 'registered'
  WHERE id = v_referral_id;

  RETURN true;
END;
$fn$;

REVOKE ALL ON FUNCTION public.claim_user_referral(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_user_referral(text) TO authenticated;

COMMENT ON FUNCTION public.claim_user_referral(text) IS
  'Claims a general OT-* user referral for a newly registered authenticated account.';
