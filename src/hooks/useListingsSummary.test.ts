import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = { id: string; price: number; currency: string; featured: boolean; created_at: string; tags: string[] };

const now = Date.now();
const day = 24 * 60 * 60 * 1000;
// First page of the feed is featured/newest first: the cheapest lot is NOT in it.
const rows: Row[] = [
  { id: 'huellelhue', price: 155_000_000, currency: 'CLP', featured: true, created_at: new Date(now - 30 * day).toISOString(), tags: [] },
  { id: 'explora', price: 10_000_000, currency: 'CLP', featured: false, created_at: new Date(now - 2 * day).toISOString(), tags: [] },
  { id: 'uf-lot', price: 900, currency: 'UF', featured: false, created_at: new Date(now - 40 * day).toISOString(), tags: [] },
  { id: 'loteo-lot', price: 5_000_000, currency: 'CLP', featured: false, created_at: new Date(now - 1 * day).toISOString(), tags: ['loteo'] },
];

let calls: string[][] = [];

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => {
      let matching = [...rows];
      let head = false;
      let limit: number | null = null;
      const log: string[] = [];
      calls.push(log);
      const query = {
        select: (_cols: string, opts?: { head?: boolean }) => { head = Boolean(opts?.head); return query; },
        eq: (field: keyof Row, value: unknown) => { log.push(`eq:${String(field)}`); matching = matching.filter(r => (field in r ? r[field] === value : true)); return query; },
        not: (_field: string, _op: string, _value: string) => { matching = matching.filter(r => !r.tags.includes('loteo')); return query; },
        gt: (field: keyof Row, value: number | string) => { matching = matching.filter(r => r[field] > value); return query; },
        order: (field: keyof Row, opts: { ascending: boolean }) => { matching.sort((a, b) => (a[field] > b[field] ? 1 : -1) * (opts.ascending ? 1 : -1)); return query; },
        limit: (n: number) => { limit = n; return query; },
        then: (resolve: (value: { data: Row[] | null; count: number; error: null }) => unknown) =>
          Promise.resolve(resolve({ data: head ? null : matching.slice(0, limit ?? matching.length), count: matching.length, error: null })),
      };
      return query;
    },
  },
}));

import { fetchListingsSummary } from './useListingsSummary';

describe('fetchListingsSummary', () => {
  beforeEach(() => { calls = []; });

  it('returns the lowest price per currency over the whole inventory, not the first page', async () => {
    const summary = await fetchListingsSummary({});
    expect(summary.minByCurrency).toEqual([
      { currency: 'CLP', min: 10_000_000 },
      { currency: 'UF', min: 900 },
    ]);
  });

  it('counts featured and recent listings server-side and keeps loteo lots out by default', async () => {
    const summary = await fetchListingsSummary({});
    expect(summary.featuredCount).toBe(1);
    expect(summary.recentCount).toBe(1);
  });

  it('includes loteo lots when the explorer does', async () => {
    const summary = await fetchListingsSummary({ includeLoteoLots: true });
    expect(summary.minByCurrency[0]).toEqual({ currency: 'CLP', min: 5_000_000 });
    expect(summary.recentCount).toBe(2);
  });

  it('only queries the selected currency', async () => {
    const summary = await fetchListingsSummary({ currency: 'UF' });
    expect(summary.minByCurrency).toEqual([{ currency: 'UF', min: 900 }]);
  });
});
