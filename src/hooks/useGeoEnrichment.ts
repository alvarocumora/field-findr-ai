import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GeoElevation {
  elevation: number | null;
}

export interface GeoClimate {
  avgTempMax: number;
  avgTempMin: number;
  annualRainMm: number;
  annualSunHours: number;
}

export interface GeoPOI {
  name: string;
  type: string;
  distance: number;
}

export interface GeoAddress {
  displayName: string | null;
  road: string | null;
  suburb: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postcode: string | null;
}

export interface GeoEnrichmentData {
  elevation?: GeoElevation;
  climate?: GeoClimate;
  pois?: Record<string, GeoPOI[]>;
  geocode?: GeoAddress;
}

type ServiceName = 'elevation' | 'climate' | 'pois' | 'geocode';

export function useGeoEnrichment() {
  const [data, setData] = useState<GeoEnrichmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrich = useCallback(
    async (lat: number, lng: number, services?: ServiceName[]) => {
      setLoading(true);
      setError(null);

      try {
        const { data: result, error: fnError } = await supabase.functions.invoke(
          'geo-enrichment',
          { body: { lat, lng, services } }
        );

        if (fnError) throw new Error(fnError.message);
        if (!result?.success) throw new Error(result?.error ?? 'Unknown error');

        setData(result.data as GeoEnrichmentData);
        return result.data as GeoEnrichmentData;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error fetching geo data';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, enrich, reset };
}
