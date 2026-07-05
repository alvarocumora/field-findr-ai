import { describe, it, expect } from 'vitest';
import { generateAmortizationSchedule } from './useCredits';

describe('generateAmortizationSchedule', () => {
  it('computes the French-system monthly payment for a standard credit', () => {
    // 54.4M CLP at 12% annual over 24 months → known amortization result
    const { monthlyPayment, schedule } = generateAmortizationSchedule(
      54_400_000, 12, 24, new Date('2026-01-15T12:00:00Z'),
    );

    // Reference value: P·r·(1+r)^n / ((1+r)^n − 1) with r = 0.01
    const r = 0.01;
    const expected = Math.round((54_400_000 * r * Math.pow(1 + r, 24)) / (Math.pow(1 + r, 24) - 1));
    expect(monthlyPayment).toBe(expected);
    expect(schedule).toHaveLength(24);
    expect(schedule[0].payment_number).toBe(1);
    expect(schedule[23].payment_number).toBe(24);
  });

  it('splits the principal evenly when the rate is zero', () => {
    const { monthlyPayment, schedule } = generateAmortizationSchedule(
      12_000_000, 0, 12, new Date('2026-01-15T12:00:00Z'),
    );
    expect(monthlyPayment).toBe(1_000_000);
    expect(schedule.every((p) => p.amount === 1_000_000)).toBe(true);
  });

  it('spaces due dates one month apart starting the month after the start date', () => {
    const start = new Date('2026-01-15T12:00:00Z');
    const { schedule } = generateAmortizationSchedule(1_000_000, 12, 3, start);
    const months = schedule.map((p) => new Date(p.due_date).getUTCMonth());
    expect(months).toEqual([1, 2, 3]); // feb, mar, abr (0-indexed)
  });

  it('total interest is positive when the rate is positive', () => {
    const financed = 10_000_000;
    const { monthlyPayment } = generateAmortizationSchedule(financed, 10, 36, new Date());
    expect(monthlyPayment * 36).toBeGreaterThan(financed);
  });
});
