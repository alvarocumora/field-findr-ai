import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { captureReferralAttribution, readReferralAttribution } from '@/lib/referrals/referralAttribution';

const CLAIMED_PREFIX = 'ot:user-referral-claimed:';

const ReferralAttributionCapture = () => {
  const location = useLocation();
  const { user } = useAuth();
  const inFlight = useRef(false);

  useEffect(() => {
    captureReferralAttribution(location.search, location.pathname);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!user || inFlight.current) return;
    const attribution = readReferralAttribution();
    if (!attribution?.code) return;

    const marker = CLAIMED_PREFIX + user.id + ':' + attribution.code;
    if (window.localStorage.getItem(marker)) return;

    inFlight.current = true;
    supabase.rpc('claim_user_referral', { p_code: attribution.code })
      .then(({ error }) => {
        if (!error) window.localStorage.setItem(marker, '1');
        inFlight.current = false;
      }, () => {
        inFlight.current = false;
      });
  }, [user]);

  return null;
};

export default ReferralAttributionCapture;
