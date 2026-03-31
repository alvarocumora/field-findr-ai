import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useTrackEvent = () => {
  const { user } = useAuth();

  const track = useCallback(async (eventType: string, metadata: Record<string, any> = {}) => {
    if (!user) return;
    try {
      await supabase.from('user_events').insert({
        user_id: user.id,
        event_type: eventType,
        metadata,
      });
    } catch (e) {
      // Silent fail – tracking should never break UX
    }
  }, [user]);

  return { track };
};
