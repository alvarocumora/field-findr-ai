import { describe, expect, it } from 'vitest';
import { computeLotPrice, readProjectPricing, VALLE_HUALANE_PRICING } from './lotPricing';

describe('computeLotPrice', () => {
  it('Valle de Hualañé per_ha', () => {
    expect(computeLotPrice(10800, VALLE_HUALANE_PRICING)).toBe(12_990_000);
    expect(computeLotPrice(13300, VALLE_HUALANE_PRICING)).toBe(12_990_000);
    expect(computeLotPrice(20000, VALLE_HUALANE_PRICING)).toBe(12_990_000);
    expect(computeLotPrice(15000, VALLE_HUALANE_PRICING)).toBe(12_990_000);
    expect(computeLotPrice(11400, VALLE_HUALANE_PRICING)).toBe(12_990_000);
  });
  it('per_m2 and per_lot', () => {
    expect(computeLotPrice(5000, { pricing_mode: 'per_m2', unit_price: 3000 })).toBe(15_000_000);
    expect(computeLotPrice(5000, { pricing_mode: 'per_lot', unit_price: 20_000_000 })).toBe(20_000_000);
  });
  it('reads landing_config.pricing', () => {
    expect(readProjectPricing({ pricing: { pricing_mode: 'per_lot', unit_price: 12990000 } })).toEqual(VALLE_HUALANE_PRICING);
    expect(readProjectPricing({})).toBeNull();
  });
});
