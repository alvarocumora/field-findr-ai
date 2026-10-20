import { describe, expect, it } from 'vitest';
import { favoritePriceLabel, isPublishedFavorite } from './favoriteView';

describe('private buyer favorites', () => {
  it('never presents deleted, inactive or demo listings as sellable', () => {
    expect(isPublishedFavorite(null)).toBe(false);
    expect(isPublishedFavorite({ status: 'inactive', is_demo: false })).toBe(false);
    expect(isPublishedFavorite({ status: 'active', is_demo: true })).toBe(false);
    expect(isPublishedFavorite({ status: 'active', is_demo: false })).toBe(true);
  });

  it('shows currency from source without inventing prices or UF conversion', () => {
    expect(favoritePriceLabel({ price: 2500, currency: 'UF', status: 'active', is_demo: false })).toBe('2.500 UF');
    expect(favoritePriceLabel({ price: 19_990_000, currency: 'CLP', status: 'active', is_demo: false })).toBe('$19.990.000 CLP');
    expect(favoritePriceLabel({ price: 0, currency: 'CLP', status: 'active', is_demo: false })).toBeNull();
    expect(favoritePriceLabel({ price: 19_990_000, currency: 'CLP', status: 'sold', is_demo: false })).toBeNull();
  });
});
