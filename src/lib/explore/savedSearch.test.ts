import { describe, expect, it } from 'vitest';
import { canNotifySearch, savedSearchDestination, savedSearchFilters } from './savedSearch';
import { readExploreSearch } from './searchState';

describe('saved search continuity', () => {
  it('restores independent UF/CLP budgets without persisting a listing or campaign', () => {
    const state = readExploreSearch(new URLSearchParams('q=Valle&currency=UF&ufMax=900&clpMax=30000000&region=Maule&listing=private-context&utm_source=old'));
    const url = savedSearchDestination(savedSearchFilters(state));
    expect(readExploreSearch(new URLSearchParams(url.split('?')[1]))).toEqual(state);
    expect(url).not.toContain('listing='); expect(url).not.toContain('utm_source');
    expect(canNotifySearch(state)).toBe(false);
  });
  it('preserves legacy saved filters and only offers notifications supported by the existing worker', () => {
    expect(savedSearchDestination({ types: ['parcela_rural'], regions: ['Maule'], priceMax: 30000000 })).toContain('clpMax=30000000');
    expect(canNotifySearch(readExploreSearch(new URLSearchParams('type=parcela_rural&region=Maule&areaMin=5000')))).toBe(true);
  });
});
