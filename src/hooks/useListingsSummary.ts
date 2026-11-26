import { useQuery } from '@tanstack/react-query';
import { filteredListingsQuery } from './useInfiniteListings';
import type { ListingFilters } from './useListings';

/** Currencies the explorer prices in; prices are never converted between them. */
const SUMMARY_CURRENCIES = ['CLP', 'UF'] as const;

export interface ListingsSummary {
  /** Lowest positive price per currency over the whole filtered inventory. */
  minByCurrency: { currency: string; min: number }[];
  featuredCount: number;
  recentCount: number;
}

const RECENT_DAYS = 7;

/**
 * Server-side summary of the same inventory the feed paginates: the "desde"
 * price and the Destacados/Nuevos counts must not be computed from the first
 * page only (featured/newest first), or a $155M listing hides a $10M one.
 */
export const fetchListingsSummary = async (filters?: ListingFilters): Promise<ListingsSummary> => {
  const currencies = filters?.currency ? [filters.currency.toUpperCase()] : [...SUMMARY_CURRENCIES];
  const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [mins, featured, recent] = await Promise.all([
    Promise.all(
      currencies.map(async (currency) => {
        const { data, error } = await filteredListingsQuery({ ...filters, currency }, 'price,currency')
          .gt('price', 0)
          .order('price', { ascending: true })
          .limit(1);
        if (error) throw error;
        const row = (data as unknown as { price: number | null }[] | null)?.[0];
        return row?.price ? { currency, min: Number(row.price) } : null;
      }),
    ),
    filteredListingsQuery(filters, 'id', { count: 'exact', head: true }).eq('featured', true),
    filteredListingsQuery(filters, 'id', { count: 'exact', head: true }).gt('created_at', since),
  ]);

  if (featured.error) throw featured.error;
  if (recent.error) throw recent.error;

  return {
    minByCurrency: mins.filter((m): m is { currency: string; min: number } => m !== null),
    featuredCount: featured.count ?? 0,
    recentCount: recent.count ?? 0,
  };
};

export const useListingsSummary = (filters?: ListingFilters) =>
  useQuery({
    queryKey: ['listings-summary', filters],
    queryFn: () => fetchListingsSummary(filters),
    staleTime: 60_000,
  });
