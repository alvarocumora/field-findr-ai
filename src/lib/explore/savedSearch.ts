import type { Json } from '@/integrations/supabase/types';
import { jsonObject } from '@/lib/jsonData';
import { readExploreSearch, writeExploreSearch, type ExploreSearchState } from './searchState';

export function canNotifySearch(state: ExploreSearchState): boolean {
  // The existing notification worker supports types, regions and area only reliably.
  return !state.q && !state.country.length && !state.tags.length && !state.slopes.length && !state.valuation.length &&
    state.currency === 'all' && state.clp[0] === 0 && state.clp[1] === 5_000_000_000 && state.uf[0] === 0 && state.uf[1] === 500_000;
}
export function savedSearchFilters(state: ExploreSearchState): Json {
  return {
    version: 1, exploreQuery: writeExploreSearch(new URLSearchParams(), state).toString(),
    types: state.type, regions: state.region,
    areaMin: state.area[0] || null, areaMax: state.area[1] === 1_000_000 ? null : state.area[1],
    notifications_supported: canNotifySearch(state),
  };
}
export function savedSearchDestination(filters: Json): string {
  const data = jsonObject(filters);
  if (typeof data.exploreQuery === 'string') return `/explorar?${writeExploreSearch(new URLSearchParams(), readExploreSearch(new URLSearchParams(data.exploreQuery)))}`;
  const params = new URLSearchParams();
  for (const [key, value] of [['type', data.types || data.type], ['region', data.regions || data.region]] as const) {
    if (Array.isArray(value)) params.set(key, value.filter(v => typeof v === 'string').join(','));
  }
  for (const [key, value] of [['clpMin', data.priceMin], ['clpMax', data.priceMax], ['areaMin', data.areaMin], ['areaMax', data.areaMax]] as const) {
    if (typeof value === 'number' && Number.isFinite(value)) params.set(key, String(value));
  }
  return `/explorar?${writeExploreSearch(new URLSearchParams(), readExploreSearch(params))}`;
}
