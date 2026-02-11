import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type IsochroneProfile = 'driving' | 'walking' | 'cycling';

interface IsochroneResult {
  geojson: GeoJSON.FeatureCollection | null;
  center: [number, number] | null;
  profile: IsochroneProfile;
}

export const useIsochrone = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<IsochroneResult>({
    geojson: null,
    center: null,
    profile: 'driving',
  });

  const fetchIsochrone = useCallback(async (
    lng: number,
    lat: number,
    profile: IsochroneProfile = 'driving',
    contours_minutes = '5,10,15'
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-isochrone', {
        body: { lng, lat, profile, contours_minutes },
      });

      if (error) throw error;

      setResult({
        geojson: data as GeoJSON.FeatureCollection,
        center: [lng, lat],
        profile,
      });

      return data as GeoJSON.FeatureCollection;
    } catch (err) {
      console.error('Isochrone error:', err);
      toast.error('Error al calcular isócronas');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearIsochrone = useCallback(() => {
    setResult({ geojson: null, center: null, profile: 'driving' });
  }, []);

  return { ...result, isLoading, fetchIsochrone, clearIsochrone };
};
