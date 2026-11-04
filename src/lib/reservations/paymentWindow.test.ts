import { describe, expect, it } from 'vitest';
import { isReservationPayable } from './paymentWindow';
const now = Date.parse('2026-11-04T12:00:00Z');
describe('payment window', () => {
  it('allows only a pending reservation strictly before its deadline', () => {
    expect(isReservationPayable({ status: 'pending_payment', expires_at: '2026-11-04T12:00:01Z' }, now)).toBe(true);
    for (const expires_at of ['2026-11-04T12:00:00Z', '2026-11-04T11:59:59Z', 'invalid']) {
      expect(isReservationPayable({ status: 'pending_payment', expires_at }, now)).toBe(false);
    }
    for (const status of ['paid', 'cancelled', 'expired', 'converted']) {
      expect(isReservationPayable({ status, expires_at: '2026-11-05T12:00:00Z' }, now)).toBe(false);
    }
  });
});
