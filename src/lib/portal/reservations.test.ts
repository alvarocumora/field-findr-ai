import { describe, it, expect } from 'vitest';
import { ownReservations, partitionReservations, reservationsSummary, type PortalReservation } from './reservations';

const rows: PortalReservation[] = [
  { id: 'a', user_id: 'me', status: 'paid', reservation_amount: 500_000, lots: { price: 50_000_000 } },
  { id: 'b', user_id: 'me', status: 'pending_payment', reservation_amount: 500_000, lots: { price: 40_000_000 } },
  { id: 'c', user_id: 'me', status: 'converted', reservation_amount: 500_000, lots: { price: 60_000_000 } },
  { id: 'd', user_id: 'me', status: 'expired', reservation_amount: 500_000, lots: { price: 30_000_000 } },
  { id: 'e', user_id: 'other', status: 'paid', reservation_amount: 999_999, lots: { price: 99_000_000 } },
];

describe('ownReservations', () => {
  it('keeps only the current user rows', () => {
    expect(ownReservations(rows, 'me').map((r) => r.id)).toEqual(['a', 'b', 'c', 'd']);
  });
  it('returns nothing without a user id', () => {
    expect(ownReservations(rows, undefined)).toEqual([]);
  });
});

describe('partitionReservations', () => {
  it('splits active vs historical by status', () => {
    const { active, past } = partitionReservations(ownReservations(rows, 'me'));
    expect(active.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(past.map((r) => r.id)).toEqual(['d']);
  });
});

describe('reservationsSummary', () => {
  const { active } = partitionReservations(ownReservations(rows, 'me'));
  const s = reservationsSummary(active);
  it('counts active reservations', () => {
    expect(s.activeCount).toBe(3);
  });
  it('sums only paid/converted deposits (excludes pending)', () => {
    expect(s.totalDeposited).toBe(1_000_000); // a + c, not the pending b
  });
  it('sums the reserved lots values across all active', () => {
    expect(s.totalValue).toBe(150_000_000); // 50 + 40 + 60
  });
  it('handles missing amounts safely', () => {
    const empty = reservationsSummary([{ id: 'x', user_id: 'me', status: 'paid' }]);
    expect(empty.totalDeposited).toBe(0);
    expect(empty.totalValue).toBe(0);
  });
});
