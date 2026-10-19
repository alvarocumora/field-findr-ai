import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Listing, ListingFilters } from './useListings';

const PAGE_SIZE = 30;

/** Strip PostgREST `or()` syntax characters so user text can't break the filter. */
export const sanitizeSearchTerm = (raw?: string): string =>
  (raw ?? '').replace(/[%,()*\\:."']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

interface InfiniteListingsResult {
  listings: Listing[];
  nextCursor: number | null;
  totalCount: number;
}

export const useInfiniteListings = (filters?: ListingFilters) => {
  return useInfiniteQuery({
    queryKey: ['infinite-listings', filters],
    queryFn: async ({ pageParam = 0 }): Promise<InfiniteListingsResult> => {
      let query = supabase
        .from('listings')
        .select('*', { count: 'exact' })
        .eq('status', 'active')
        .eq('is_demo', false);

      // Hide individual lots of a loteo/project from the general explorer unless
      // the user opts in. Projects surface as their own cards via ProjectsRail.
      if (!filters?.includeLoteoLots) {
        query = query.not('tags', 'cs', '{loteo}');
      }

      query = query
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (filters?.type && filters.type.length > 0) {
        query = query.in('type', filters.type);
      }

      if (filters?.region && filters.region.length > 0) {
        query = query.in('region', filters.region);
      }

      if (filters?.country && filters.country.length > 0) {
        query = query.in('country', filters.country);
      }

      if (filters?.priceMin) {
        query = query.gte('price', filters.priceMin);
      }

      if (filters?.priceMax) {
        query = query.lte('price', filters.priceMax);
      }

      if (filters?.areaMin) {
        query = query.gte('area_m2', filters.areaMin);
      }

      if (filters?.areaMax) {
        query = query.lte('area_m2', filters.areaMax);
      }

      if (filters?.bounds) {
        query = query
          .gte('lat', filters.bounds.south)
          .lte('lat', filters.bounds.north)
          .gte('lng', filters.bounds.west)
          .lte('lng', filters.bounds.east);
      }

      if (filters?.featured !== undefined) {
        query = query.eq('featured', filters.featured);
      }

      if (filters?.currency) {
        query = query.eq('currency', filters.currency);
      }

      // Search the whole inventory, not just the pages already loaded.
      const term = sanitizeSearchTerm(filters?.search);
      if (term) {
        const p = `%${term}%`;
        query = query.or(`title.ilike.${p},location.ilike.${p},city.ilike.${p},region.ilike.${p}`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const listings = data as Listing[];
      const totalCount = count || 0;
      const hasMore = pageParam + PAGE_SIZE < totalCount;

      return {
        listings,
        nextCursor: hasMore ? pageParam + PAGE_SIZE : null,
        totalCount,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });
};

// Hook for getting all listings from infinite query pages
export const useFlattenedListings = (filters?: ListingFilters) => {
  const query = useInfiniteListings(filters);

  const listings = query.data?.pages.flatMap(page => page.listings) ?? [];
  const totalCount = query.data?.pages[0]?.totalCount ?? 0;

  return {
    ...query,
    listings,
    totalCount,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
    isLoadingMore: query.isFetchingNextPage,
  };
};
