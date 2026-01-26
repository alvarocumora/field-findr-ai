import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMapboxToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        // Prefer build-time public token if present
        const envToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
        if (envToken?.startsWith('pk.')) {
          setToken(envToken);
          setError(null);
          return;
        }

        // Fallback to backend function (reads MAPBOX_PUBLIC_TOKEN secret)
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;

        const fetched = (data as { token?: string } | null)?.token;
        if (!fetched) {
          throw new Error('Mapbox token not configured');
        }
        setToken(fetched);
        setError(null);
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
