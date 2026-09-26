import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  captureReferralAttribution,
  clearReferralAttribution,
  readReferralAttribution,
} from '@/lib/referrals/attribution';

/**
 * Captures ?ref= once at the application edge so attribution survives normal
 * navigation and OAuth round-trips. General user rewards are claimed after an
 * authenticated session exists; broker sales codes remain available for lead
 * capture until they expire or are replaced by a newer explicit ref.
 */
const ReferralAttributionTracker = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    captureReferralAttribution(location.search, location.pathname);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!user) return;
    const attribution = readReferralAttribution();
    if (!attribution || attribution.kind !== 'user') return;

    let cancelled = false;
    void supabase.rpc('claim_user_referral', { p_code: attribution.code })
      .then(({ error }) => {
        if (!cancelled && !error) clearReferralAttribution();
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return null;
};

export default ReferralAttributionTracker;
