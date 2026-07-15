
DROP POLICY IF EXISTS "Users can update their referrals" ON public.referrals;
-- Users may no longer directly UPDATE referrals — reward fields are system-managed.
-- Admins keep full access via "Admins manage all referrals".
