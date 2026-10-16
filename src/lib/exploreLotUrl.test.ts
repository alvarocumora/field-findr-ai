import { describe, expect, it } from 'vitest';
import { getExploreLotPath } from './exploreLotUrl';

describe('tour links to explorer cards', () => {
  it('uses the linked listing ID for a specific parcel', () => {
    expect(getExploreLotPath('81923f55-3243-4109-a8d9-83040a99c362')).toBe('/explorar?listing=81923f55-3243-4109-a8d9-83040a99c362');
  });
  it('does not invent a listing for unlinked inventory', () => {
    expect(getExploreLotPath(null)).toBeNull();
  });
});