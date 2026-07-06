import { describe, it, expect } from 'vitest';
import { computeFinancing, computeInvestment } from './buyerTools';

describe('computeFinancing', () => {
  it('splits price into pie + financed principal', () => {
    const r = computeFinancing({ price: 20_000_000, downPct: 20, months: 24, annualRatePct: 0 });
    expect(r.downPayment).toBe(4_000_000);
    expect(r.principal).toBe(16_000_000);
    // 0% rate → principal / months
    expect(r.monthlyPayment).toBe(Math.round(16_000_000 / 24));
  });

  it('amortizes with interest (French system)', () => {
    const r = computeFinancing({ price: 24_990_000, downPct: 30, months: 36, annualRatePct: 12 });
    // known amortization: principal 17,493,000 at 1%/mo for 36 → ~581k/mo
    expect(r.monthlyPayment).toBeGreaterThan(560_000);
    expect(r.monthlyPayment).toBeLessThan(600_000);
    expect(r.totalInterest).toBeGreaterThan(0);
    expect(r.totalPaid).toBe(r.downPayment + r.monthlyPayment * 36);
  });

  it('clamps down payment to [0,100]% and months to ≥1', () => {
    const r = computeFinancing({ price: 1_000_000, downPct: 150, months: 0, annualRatePct: 0 });
    expect(r.downPayment).toBe(1_000_000);
    expect(r.principal).toBe(0);
    expect(r.monthlyPayment).toBe(0);
  });
});

describe('computeInvestment', () => {
  it('projects appreciation and ROI over the horizon', () => {
    const r = computeInvestment({ price: 10_000_000, appreciationPct: 10, years: 3 });
    expect(r.projectedValue).toBe(Math.round(10_000_000 * 1.1 ** 3)); // 13,310,000
    expect(r.capitalGain).toBe(r.projectedValue - 10_000_000);
    expect(r.totalRoiPct).toBeCloseTo(33.1, 1);
    expect(r.annualRoiPct).toBeCloseTo(10, 5);
  });

  it('computes annual rental yield when rent is given', () => {
    const r = computeInvestment({ price: 12_000_000, appreciationPct: 0, years: 1, monthlyRent: 100_000 });
    expect(r.annualRentalYieldPct).toBeCloseTo(10, 5); // 1.2M / 12M
  });

  it('returns null rental yield without rent', () => {
    const r = computeInvestment({ price: 12_000_000, appreciationPct: 5, years: 5 });
    expect(r.annualRentalYieldPct).toBeNull();
  });

  it('estimates subdivision potential from area and min lot', () => {
    const r = computeInvestment({ price: 1, appreciationPct: 0, years: 1, areaM2: 30_000, minLotM2: 5_000 });
    // 30000 * 0.7 / 5000 = 4.2 → 4 lots
    expect(r.subdivisionLots).toBe(4);
  });

  it('subdivision is null without area/minLot', () => {
    expect(computeInvestment({ price: 1, appreciationPct: 0, years: 1 }).subdivisionLots).toBeNull();
  });
});
