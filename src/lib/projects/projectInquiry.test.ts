import { describe, expect, it } from 'vitest';
import { resolveProjectInquiryLot } from './projectInquiry';

const lots = [
  { id: 'database-lot-a', lot_number: '1' },
  { id: 'database-lot-b', lot_number: '36' },
];

describe('project buyer inquiry lot mapping', () => {
  it('resolves the selected lot by its current database UUID', () => {
    expect(resolveProjectInquiryLot(lots, new URLSearchParams('lote=database-lot-a')))
      .toEqual(lots[0]);
  });

  it('recovers lot context when the tour geometry ID is not the database ID', () => {
    expect(resolveProjectInquiryLot(lots, new URLSearchParams('lote=kmz-id&loteNumero=36')))
      .toEqual(lots[1]);
  });

  it('prefers the explicitly selected number over a mismatched stale ID', () => {
    expect(resolveProjectInquiryLot(lots, new URLSearchParams('lote=database-lot-a&loteNumero=36')))
      .toEqual(lots[1]);
  });

  it('does not accept an unrecognized lot as a CRM lot ID', () => {
    expect(resolveProjectInquiryLot(lots, new URLSearchParams('lote=unknown&loteNumero=99')))
      .toBeNull();
  });

  it('leaves project-only consultations without a lot', () => {
    expect(resolveProjectInquiryLot(lots, new URLSearchParams('consulta=1')))
      .toBeNull();
  });
});
