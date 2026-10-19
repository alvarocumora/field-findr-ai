import { describe, expect, it } from 'vitest';
import { bestPricePerM2, formatPricePerM2, formatPriceWithCurrency, minPriceByCurrency } from './priceCurrency';

describe('priceCurrency', () => {
  it('never renders 35.000 UF as $35K', () => {
    expect(formatPriceWithCurrency(35000, 'UF')).toBe('35.000 UF');
  });
  it('UF per m² keeps decimals instead of $1/m²', () => {
    expect(formatPricePerM2(3500, 10000, 'UF')).toBe('0,35 UF/m²');
  });
  it('CLP per m² is rounded pesos', () => {
    expect(formatPricePerM2(12990000, 5000, 'CLP')).toBe('$2.598/m²');
  });
  it('separates minimum price per currency', () => {
    const r = minPriceByCurrency([
      { price: 35000, area_m2: 1, currency: 'UF' },
      { price: 9990000, area_m2: 1, currency: 'CLP' },
      { price: 12990000, area_m2: 1, currency: 'CLP' },
    ]);
    expect(r).toEqual([
      { currency: 'CLP', min: 9990000, count: 2 },
      { currency: 'UF', min: 35000, count: 1 },
    ]);
  });
  it('best price/m² ignores other currencies', () => {
    const uf = { price: 100, area_m2: 10000, currency: 'UF' };
    const clp = { price: 10000000, area_m2: 5000, currency: 'CLP' };
    expect(bestPricePerM2([uf, clp], 'CLP')).toBe(clp);
  });
});
