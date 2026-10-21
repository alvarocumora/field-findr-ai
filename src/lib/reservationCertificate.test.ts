import { describe, it, expect } from 'vitest';
import { buildReservationFolio, certificateValidity } from './reservationCertificate';

describe('reservation certificate', () => {
  it('builds folio from year and id', () => {
    expect(buildReservationFolio('ab12cd34-0000-1111', '2026-10-21T12:00:00Z')).toBe('RES-2026-AB12CD34');
  });
  it('pending reservation past expiry is not valid', () => {
    const now = new Date('2026-10-22T00:00:00Z');
    expect(certificateValidity({ status: 'pending_payment', expires_at: '2026-10-21T00:00:00Z' }, now).valid).toBe(false);
    expect(certificateValidity({ status: 'pending_payment', expires_at: '2026-10-23T00:00:00Z' }, now).valid).toBe(true);
  });
  it('paid is valid, cancelled is not', () => {
    expect(certificateValidity({ status: 'paid', expires_at: '2000-01-01' }).valid).toBe(true);
    expect(certificateValidity({ status: 'cancelled', expires_at: '2999-01-01' }).valid).toBe(false);
  });
});
