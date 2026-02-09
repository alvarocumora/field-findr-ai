import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LandingStats {
  totalListings: number;
  totalProjects: number;
  totalLots: number;
  totalReservations: number;
}

const FALLBACK_STATS: LandingStats = {
  totalListings: 0,
  totalProjects: 0,
  totalLots: 0,
  totalReservations: 0,
};

export const useLandingStats = () => {
  return useQuery({
    queryKey: ['landing-stats'],
    queryFn: async (): Promise<LandingStats> => {
      const [listings, projects, lots, reservations] = await Promise.all([
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('lots').select('id', { count: 'exact', head: true }),
        supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
      ]);

      return {
        totalListings: listings.count ?? 0,
        totalProjects: projects.count ?? 0,
        totalLots: lots.count ?? 0,
        totalReservations: reservations.count ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
};
