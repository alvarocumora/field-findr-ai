import { describe, expect, it } from 'vitest';
import { canReserveFromQuote, reservationDraftFromQuote } from './quoteToReservation';

const now = new Date('2026-10-21T12:00:00Z');
const base = {
  id: 'q1', lot_id: 'l1', status: 'sent', valid_until: '2026-10-25T00:00:00Z',
  customer_name: 'Ana', customer_email: 'ana@x.cl', customer_phone: null,
};

describe('quote → reservation', () => {
  it('allows an open, valid quote on an available lot', () => {
    expect(canReserveFromQuote(base, 'available', now)).toBe(true);
  });
  it('blocks when the lot is no longer available', () => {
    expect(canReserveFromQuote(base, 'reserved', now)).toBe(false);
  });
  it('blocks expired quotes', () => {
    expect(canReserveFromQuote({ ...base, valid_until: '2026-10-20T00:00:00Z' }, 'available', now)).toBe(false);
  });
  it('blocks cancelled quotes', () => {
    expect(canReserveFromQuote({ ...base, status: 'cancelled' }, 'available', now)).toBe(false);
  });
  it('prefills customer data', () => {
    expect(reservationDraftFromQuote(base)).toEqual({ name: 'Ana', email: 'ana@x.cl', phone: '' });
  });
});
