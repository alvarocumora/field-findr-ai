import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Token de Mapbox compartido para portadas estáticas.
 * Singleton: una sola petición por sesión aunque se rendericen cientos de
 * tarjetas (a diferencia de useMapboxToken, pensado para mapas interactivos).
 */
const CACHE_KEY = 'mapbox_public_token';
const CACHE_EXPIRY_KEY = 'mapbox_token_expiry';
const CACHE_DURATION = 1000 * 60 * 60;
let cached: string | null = null;
let inflight: Promise<string | null> | null = null;

const isValid = (t: unknown): t is string => typeof t === 'string' && t.startsWith('pk.');

function readCache(): string | null {
  if (cached) return cached;
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (isValid(stored)) {
      cached = stored;
      return cached;
    }
  } catch {
    /* storage no disponible */
  }
  return null;
}

async function loadToken(): Promise<string | null> {
  const fromCache = readCache();
  if (fromCache) return fromCache;

  const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
  if (isValid(envToken)) {
    cached = envToken;
    return cached;
  }

  inflight ||= (async () => {
    try {
      const { data } = await supabase.functions.invoke('get-mapbox-token');
      const token = (data as { token?: string } | null)?.token;
      if (isValid(token)) {
        cached = token;
        try {
          localStorage.setItem(CACHE_KEY, token);
          localStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_DURATION));
        } catch {
          /* noop */
        }
        return token;
      }
    } catch {
      /* sin token: las tarjetas caen al placeholder */
    }
    return null;
  })();

  return inflight;
}

export function useStaticMapToken(): string | null {
  const [token, setToken] = useState<string | null>(() => readCache());

  useEffect(() => {
    if (token) return;
    let active = true;
    loadToken().then((t) => {
      if (active) setToken(t);
    });
    return () => {
      active = false;
    };
  }, [token]);

  return token;
}
