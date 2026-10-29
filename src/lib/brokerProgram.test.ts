import { describe, it, expect } from 'vitest';
import { brokerCommissionFor, BROKER_REFERRAL_BONUS_CLP } from './brokerProgram';

describe('programa vendedores', () => {
  it('paga mínimo $500.000 aunque el 3% sea menor', () => {
    expect(brokerCommissionFor(10_000_000, 3)).toBe(500_000);
  });
  it('paga el % cuando supera el mínimo', () => {
    expect(brokerCommissionFor(30_000_000, 3)).toBe(900_000);
  });
  it('bono referido fijo de $200.000', () => {
    expect(BROKER_REFERRAL_BONUS_CLP).toBe(200_000);
  });
});
