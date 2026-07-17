import { describe, it, expect } from 'vitest';
import { seatsForPlan, seatsSummary } from './seats';

describe('seatsForPlan', () => {
  it('planes individuales tienen 1 asiento', () => {
    expect(seatsForPlan('free')).toBe(1);
    expect(seatsForPlan('corredor')).toBe(1);
    expect(seatsForPlan(null)).toBe(1);
  });
  it('corredora 3, inmobiliaria 8, grupo 25', () => {
    expect(seatsForPlan('corredora')).toBe(3);
    expect(seatsForPlan('inmobiliaria')).toBe(8);
    expect(seatsForPlan('grupo')).toBe(25);
  });
  it('enterprise es ilimitado (null)', () => {
    expect(seatsForPlan('enterprise')).toBeNull();
  });
  it('mapea planes legacy (starter→corredora, growth→inmobiliaria, scale→grupo)', () => {
    expect(seatsForPlan('starter')).toBe(3);
    expect(seatsForPlan('growth')).toBe(8);
    expect(seatsForPlan('scale')).toBe(25);
  });
});

describe('seatsSummary', () => {
  it('permite invitar mientras queden asientos', () => {
    expect(seatsSummary('inmobiliaria', 3)).toEqual({ limit: 8, used: 3, remaining: 5, canInvite: true });
  });
  it('bloquea al llegar al límite', () => {
    expect(seatsSummary('corredora', 3)).toEqual({ limit: 3, used: 3, remaining: 0, canInvite: false });
  });
  it('no produce remaining negativo si se excedió (downgrade de plan)', () => {
    const s = seatsSummary('corredora', 5);
    expect(s.remaining).toBe(0);
    expect(s.canInvite).toBe(false);
  });
  it('enterprise siempre puede invitar', () => {
    const s = seatsSummary('enterprise', 500);
    expect(s.limit).toBeNull();
    expect(s.canInvite).toBe(true);
  });
});
