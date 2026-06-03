import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RealListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  area_m2: number | null;
  location: string;
  region: string | null;
  country: string;
  type: string;
  image_url: string | null;
  source_url: string;
  source_portal: string;
  lat: number | null;
  lng: number | null;
}

export interface UseRealListingsParams {
  country?: string;
  region?: string;
  limit?: number;
  enabled?: boolean;
}

export function useRealListings(params: UseRealListingsParams = {}) {
  const { country = 'all', region, limit = 60, enabled = true } = params;

  return useQuery({
    queryKey: ['real-listings', country, region, limit],
    enabled,
    staleTime: 1000 * 60 * 30, // 30 min client cache
    queryFn: async (): Promise<RealListing[]> => {
      const qs = new URLSearchParams();
      qs.set('country', country);
      if (region) qs.set('region', region);
      qs.set('limit', String(limit));

      const { data, error } = await supabase.functions.invoke(
        `scrape-real-listings?${qs.toString()}`,
        { method: 'GET' },
      );
      if (error) throw error;
      return (data?.listings ?? []) as RealListing[];
    },
  });
}
