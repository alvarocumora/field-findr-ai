import { describe, it, expect, beforeEach } from 'vitest';
import { saveReservationDraft, readReservationDraft, clearReservationDraft } from './reservationDraft';

describe('reservationDraft', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('round-trips a draft for the same lot', () => {
    saveReservationDraft({
      lotId: 'lot-1', firstName: 'Juan', lastName: 'Pérez',
      email: 'juan@test.cl', phone: '+56911112222',
    });
    expect(readReservationDraft('lot-1')).toEqual({
      lotId: 'lot-1', firstName: 'Juan', lastName: 'Pérez',
      email: 'juan@test.cl', phone: '+56911112222',
    });
  });

  it('does not return a draft saved for a different lot', () => {
    saveReservationDraft({
      lotId: 'lot-1', firstName: 'Juan', lastName: 'Pérez',
      email: 'juan@test.cl', phone: '+56911112222',
    });
    expect(readReservationDraft('lot-2')).toBeNull();
  });

  it('returns null when nothing was saved', () => {
    expect(readReservationDraft('lot-1')).toBeNull();
  });

  it('clears the draft', () => {
    saveReservationDraft({
      lotId: 'lot-1', firstName: 'Juan', lastName: 'Pérez',
      email: 'juan@test.cl', phone: '+56911112222',
    });
    clearReservationDraft();
    expect(readReservationDraft('lot-1')).toBeNull();
  });
});
