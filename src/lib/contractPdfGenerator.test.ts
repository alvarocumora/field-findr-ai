import { describe, expect, it } from 'vitest';
import { buildCreditSchedule } from './contractPdfGenerator';
import { computeFinancing } from './buyerTools';

describe('buildCreditSchedule (anexo promesa con crédito directo)', () => {
  it('amortiza el saldo completo en 60 cuotas al 12% anual', () => {
    const f = computeFinancing({ price: 19_990_000, downPct: 20, months: 60, annualRatePct: 12 });
    const rows = buildCreditSchedule({ totalAmount: 19_990_000, downPayment: f.downPayment, financedAmount: f.principal, annualRatePct: 12, termMonths: 60, monthlyPayment: f.monthlyPayment }, new Date(2026, 9, 21));
    expect(rows).toHaveLength(60);
    expect(rows[59].balance).toBe(0);
    expect(rows.reduce((s, r) => s + r.capital, 0)).toBe(f.principal);
    expect(rows[0].interest).toBe(Math.round(f.principal * 0.01));
  });

  it('pie 0% y tasa 0%: cuotas solo capital', () => {
    const rows = buildCreditSchedule({ totalAmount: 12_000_000, downPayment: 0, financedAmount: 12_000_000, annualRatePct: 0, termMonths: 12, monthlyPayment: 1_000_000 }, new Date(2026, 0, 5));
    expect(rows.every(r => r.interest === 0 && r.payment === 1_000_000)).toBe(true);
    expect(rows[11].balance).toBe(0);
  });
});
