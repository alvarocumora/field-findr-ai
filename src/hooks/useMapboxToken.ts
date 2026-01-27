import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMapboxToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        // Use cached token first (avoids extra requests)
        const cached = localStorage.getItem('mapbox_public_token');
        if (cached?.startsWith('pk.')) {
          setToken(cached);
          setError(null);
          return;
        }

        // Always prefer backend token to avoid stale/invalid build-time tokens
        try {
          const { data, error: fnError } = await supabase.functions.invoke('get-mapbox-token');
          if (fnError) throw fnError;

          const fetched = (data as { token?: string } | null)?.token;
          if (!fetched?.startsWith('pk.')) {
            throw new Error('Mapbox token not configured');
          }

          localStorage.setItem('mapbox_public_token', fetched);
          setToken(fetched);
          setError(null);
          return;
        } catch (fnErr) {
          // Fallback to VITE_* token (public) to keep maps working if the function is unreachable.
          const fallback = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
          if (typeof fallback === 'string' && fallback.startsWith('pk.')) {
            localStorage.setItem('mapbox_public_token', fallback);
            setToken(fallback);
            setError(null);
            return;
          }

          throw fnErr;
        }
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setToken(null);
        setError(err instanceof Error ? err.message : 'Failed to fetch token');
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  return { token, loading, error };
};
