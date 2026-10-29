import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  let from = 0, to = 29;
  let matching = Array.from({ length: 35 }, (_, index) => ({ id: String(index + 1), tags: index === 34 ? ['pendiente-suave'] : [] }));
  const query = {
    select: () => query, eq: () => query, not: () => query, order: () => query,
    range: (start: number, end: number) => { from = start; to = end; return query; },
    overlaps: (_field: string, tags: string[]) => { matching = matching.filter(row => row.tags.some(tag => tags.includes(tag))); return query; },
    then: (resolve: (value: { data: typeof matching; count: number; error: null }) => unknown) => Promise.resolve(resolve({ data: matching.slice(from, to + 1), count: matching.length, error: null })),
  };
  return query;
} } }));
import { useInfiniteListings } from './useInfiniteListings';

describe('advanced filtering over the whole inventory', () => {
  it('finds a gentle-slope match beyond the first unfiltered page', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result, unmount } = renderHook(() => useInfiniteListings({ slopes: ['slight'] }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0].listings.map(row => row.id)).toEqual(['35']);
    expect(result.current.data?.pages[0].totalCount).toBe(1);
    unmount(); client.clear();
  });
});
