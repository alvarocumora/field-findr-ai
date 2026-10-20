import { describe, expect, it } from 'vitest';
import { computeEasyCredit, financingInquiryUrl, LICANTEN_PROMO_PRICE } from './easyCredit';

describe('easy credit', () => {
  it('uses the communicated promotional starting price without changing inventory', () => {
    expect(LICANTEN_PROMO_PRICE).toBe(19_990_000);
  });
  it('splits the promotional price at 0% over 36 months without rounding interest', () => {
    const result = computeEasyCredit({ price: 19_990_000, downPct: 20, months: 36, annualRatePct: 0 });
    expect(result.downPayment).toBe(3_998_000);
    expect(result.principal).toBe(15_992_000);
    expect(result.monthlyPayment).toBe(444_222);
    expect(result.totalInterest).toBe(0);
    expect(result.totalPaid).toBe(19_990_000);
  });
  it('applies a nominal annual 12% rate as 1% monthly for 36 months', () => {
    const result = computeEasyCredit({ price: 19_990_000, downPct: 20, months: 36, annualRatePct: 12 });
    expect(result.monthlyPayment).toBe(Math.round(15_992_000 * 0.01 / (1 - 1.01 ** -36)));
    expect(result.totalPaid).toBe(3_998_000 + result.monthlyPayment * 36);
    expect(result.totalInterest).toBe(result.totalPaid - 19_990_000);
  });
  it('returns zero amounts for a zero price', () => {
    expect(computeEasyCredit({ price: 0, downPct: 20, months: 36, annualRatePct: 12 })).toEqual({
      downPayment: 0, principal: 0, monthlyPayment: 0, totalInterest: 0, totalPaid: 0,
    });
  });
  it('protects against nonfinite numbers and an invalid term', () => {
    const result = computeEasyCredit({ price: NaN, downPct: Infinity, months: 0, annualRatePct: NaN });
    expect(result.monthlyPayment).toBe(0);
    expect(Object.values(result).every(Number.isFinite)).toBe(true);
    expect(computeEasyCredit({ price: 36_000, downPct: 0, months: -3, annualRatePct: 0 }).monthlyPayment).toBe(1000);
  });
  it('caps down payment and negative rates safely', () => {
    const result = computeEasyCredit({ price: 19_990_000, downPct: 150, months: 60, annualRatePct: -12 });
    expect(result.principal).toBe(0);
    expect(result.downPayment).toBe(19_990_000);
    expect(result.monthlyPayment).toBe(0);
  });
  it('keeps lot context and explicit financing intent in the existing consultation flow', () => {
    const url = financingInquiryUrl('lot-123');
    expect(url).toContain('/p/valle-escondido-licanten?');
    expect(new URLSearchParams(url.split('?')[1]).get('lote')).toBe('lot-123');
    expect(url).toContain('consulta=1');
    expect(url).toContain('utm_campaign=consulta_financiamiento');
  });
});