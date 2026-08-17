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

      try {
        const { data, error } = await supabase.functions.invoke(
          `scrape-real-listings?${qs.toString()}`,
          { method: 'GET' },
        );
        if (error) throw error;
        const listings = (data?.listings ?? []) as RealListing[];
        if (listings.length > 0) return listings;
      } catch {
        // La función de agregación puede fallar (CORS, cuota, rate limit):
        // en ese caso mostramos inventario propio en vez de una sección vacía.
      }
      return fetchOwnListings({ country, limit });
    },
  });
}

/** Fallback: inventario real publicado en la plataforma. */
async function fetchOwnListings({ country, limit }: { country: string; limit: number }): Promise<RealListing[]> {
  let query = supabase
    .from('listings')
    .select('id, title, price, currency, area_m2, location, region, country, type, images, lat, lng')
    .eq('status', 'active')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (country && country !== 'all') query = query.eq('country', country);

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((l) => ({
    id: l.id,
    title: l.title,
    price: Number(l.price) || 0,
    currency: l.currency || 'CLP',
    area_m2: l.area_m2 != null ? Number(l.area_m2) : null,
    location: l.location,
    region: l.region,
    country: l.country || 'Chile',
    type: l.type,
    image_url: Array.isArray(l.images) ? (l.images.find(Boolean) ?? null) : null,
    source_url: `/propiedad/${l.id}`,
    source_portal: 'OFERTA TERRENOS',
    lat: l.lat != null ? Number(l.lat) : null,
    lng: l.lng != null ? Number(l.lng) : null,
  }));
}
