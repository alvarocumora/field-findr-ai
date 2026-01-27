import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseMapboxTokenResult {
  token: string | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const CACHE_KEY = 'mapbox_public_token';
const CACHE_EXPIRY_KEY = 'mapbox_token_expiry';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export const useMapboxToken = (): UseMapboxTokenResult => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isValidToken = (t: string | null | undefined): t is string => {
    return typeof t === 'string' && t.startsWith('pk.');
  };

  const getCachedToken = (): string | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
      
      if (cached && expiry && isValidToken(cached)) {
        const expiryTime = parseInt(expiry, 10);
        if (Date.now() < expiryTime) {
          return cached;
        }
        // Cache expired, clear it
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_EXPIRY_KEY);
      }
    } catch {
      // localStorage might be unavailable
    }
    return null;
  };

  const setCachedToken = (t: string) => {
    try {
      localStorage.setItem(CACHE_KEY, t);
      localStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_DURATION));
    } catch {
      // localStorage might be unavailable
    }
  };

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Check cache first
    const cached = getCachedToken();
    if (cached) {
      setToken(cached);
      setLoading(false);
      return;
    }

    // Try fetching from backend
    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-mapbox-token');
      
      if (fnError) throw fnError;

      const fetched = (data as { token?: string } | null)?.token;
      if (isValidToken(fetched)) {
        setCachedToken(fetched);
        setToken(fetched);
        setError(null);
        setLoading(false);
        return;
      }
      
      throw new Error('Token inválido recibido del servidor');
    } catch (fnErr) {
      console.warn('Backend token fetch failed, trying fallback:', fnErr);
      
      // Fallback to VITE_MAPBOX_TOKEN
      const fallback = import.meta.env.VITE_MAPBOX_TOKEN;
      if (isValidToken(fallback)) {
        setCachedToken(fallback);
        setToken(fallback);
        setError(null);
        setLoading(false);
        return;
      }

      // Both methods failed
      console.error('Error fetching Mapbox token:', fnErr);
      setToken(null);
      setError('No se pudo obtener el token de Mapbox. Verifica la configuración.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const retry = useCallback(() => {
    // Clear cache before retry
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_EXPIRY_KEY);
    } catch {
      // Ignore
    }
    fetchToken();
  }, [fetchToken]);

  return { token, loading, error, retry };
};
