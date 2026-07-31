import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LandingStats {
  totalListings: number;
  totalProjects: number;
  totalLots: number;
  totalReservations: number;
  totalRegions: number;
  totalHectares: number;
  regionData: { region: string; count: number; minPrice: number; maxPrice: number }[];
}

const FALLBACK_STATS: LandingStats = {
  totalListings: 0,
  totalProjects: 0,
  totalLots: 0,
  totalReservations: 0,
  totalRegions: 0,
  totalHectares: 0,
  regionData: [],
};

export const useLandingStats = () => {
  return useQuery({
    queryKey: ['landing-stats'],
    queryFn: async (): Promise<LandingStats> => {
      // Anonymous-safe aggregates only: `lots` buyer data and `reservations`
      // are RLS-protected, so lot/placement counts are derived from the public
      // `projects` counters instead of hitting those tables directly.
      const [listings, projectRows, listingsWithArea] = await Promise.all([
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('projects').select('total_lots, available_lots').eq('status', 'active'),
        supabase.from('listings').select('region, price, area_ha').eq('status', 'active'),
      ]);

      const projectsData = projectRows.data ?? [];
      const totalLots = projectsData.reduce((acc, p) => acc + (p.total_lots ?? 0), 0);
      const placedLots = projectsData.reduce(
        (acc, p) => acc + Math.max(0, (p.total_lots ?? 0) - (p.available_lots ?? 0)),
        0,
      );

      const listingsData = listingsWithArea.data || [];

      // Calculate total hectares
      const totalHectares = listingsData.reduce((acc, l) => acc + (l.area_ha || 0), 0);

      // Calculate region data
      const regionMap: Record<string, { count: number; prices: number[] }> = {};
      listingsData.forEach(l => {
        if (l.region) {
          if (!regionMap[l.region]) regionMap[l.region] = { count: 0, prices: [] };
          regionMap[l.region].count++;
          if (l.price) regionMap[l.region].prices.push(l.price);
        }
      });

      const regionData = Object.entries(regionMap)
        .map(([region, data]) => ({
          region,
          count: data.count,
          minPrice: data.prices.length > 0 ? Math.min(...data.prices) : 0,
          maxPrice: data.prices.length > 0 ? Math.max(...data.prices) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      const uniqueRegions = new Set(regionData.map(r => r.region));

      return {
        totalListings: listings.count ?? 0,
        totalProjects: projects.count ?? 0,
        totalLots: lots.count ?? 0,
        totalReservations: reservations.count ?? 0,
        totalRegions: uniqueRegions.size,
        totalHectares: Math.round(totalHectares),
        regionData,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
