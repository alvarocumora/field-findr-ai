import { describe, expect, it } from 'vitest';
import { canReservePublicLot, formatPublicLotPrice, formatPublicLotUnitPrice } from './publicLotCommercial';

describe('public lot commercial contract', () => {
  it('requires verified available status AND a positive published price to reserve', () => {
    expect(canReservePublicLot({ status: 'available', price: 19_990_000 })).toBe(true);
    for (const status of ['reserved', 'sold', 'unverified', null]) {
      expect(canReservePublicLot({ status, price: 19_990_000 })).toBe(false);
    }
    for (const price of [null, 0, -1, Number.NaN, Infinity]) {
      expect(canReservePublicLot({ status: 'available', price })).toBe(false);
    }
  });

  it('shows an explicit currency, without pretending missing prices are zero', () => {
    expect(formatPublicLotPrice(19_990_000)).toBe('$19.990.000 CLP');
    expect(formatPublicLotPrice(null)).toBe('Precio por confirmar');
    expect(formatPublicLotPrice(0)).toBe('Precio por confirmar');
    expect(formatPublicLotUnitPrice(19_990_000, 5000)).toBe('$3.998 CLP/m²');
    expect(formatPublicLotUnitPrice(null, 5000)).toBeNull();
    expect(formatPublicLotUnitPrice(19_990_000, 0)).toBeNull();
  });
});
