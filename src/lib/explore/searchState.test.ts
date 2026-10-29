import { describe, expect, it } from 'vitest';
import { readExploreSearch, writeExploreSearch } from './searchState';

describe('shareable explorer state', () => {
  it('round-trips all filter values and independent currency budgets, preserving exact listing and campaign', () => {
    const input = new URLSearchParams('listing=exact-id&utm_source=campaign&q=Valle&type=parcela_rural&region=Maule&country=Chile&tags=agua&slopes=slight&valuation=high&currency=UF&ufMin=100&ufMax=1000&clpMax=30000000&areaMin=5000&areaMax=20000&view=map');
    const state = readExploreSearch(input);
    const output = writeExploreSearch(input, state);
    expect(readExploreSearch(output)).toEqual(state);
    expect(output.get('listing')).toBe('exact-id');
    expect(output.get('utm_source')).toBe('campaign');
    expect(state.uf).toEqual([100, 1000]);
    expect(state.clp).toEqual([0, 30_000_000]);
  });
  it('rejects invalid ranges and duplicates rather than emitting impossible query filters', () => {
    const state = readExploreSearch(new URLSearchParams('areaMin=100&areaMax=1&ufMin=-1&clpMax=Infinity&type=a,a&currency=USD&view=unknown'));
    expect(state.area).toEqual([0, 1_000_000]);
    expect(state.uf).toEqual([0, 500_000]);
    expect(state.clp).toEqual([0, 5_000_000_000]);
    expect(state.type).toEqual(['a']);
    expect(state.currency).toBe('all');
  });
});
