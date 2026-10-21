import { describe, expect, it } from 'vitest';
import { consumeProjectInquiry, resolveProjectInquiryLot } from './projectInquiry';

const lots = [
  { id: 'database-lot-a', lot_number: '1' },
  { id: 'database-lot-b', lot_number: '36' },
];

describe('project buyer inquiry lot mapping', () => {
  it('consumes the automatic inquiry once while preserving lot, tab and campaign', () => {
    const original = new URLSearchParams('consulta=1&lote=database-lot-a&loteNumero=1&tab=info&utm_campaign=consulta_financiamiento');
    const consumed = consumeProjectInquiry(original);
    expect(consumed?.toString()).toBe('lote=database-lot-a&loteNumero=1&tab=info&utm_campaign=consulta_financiamiento');
    expect(original.get('consulta')).toBe('1');
    if (!consumed) throw new Error('Expected consumed inquiry');
    consumed.set('tab', 'lots');
    expect(consumeProjectInquiry(consumed)).toBeNull();
  });

  it('does not open an inquiry without an explicit request', () => {
    expect(consumeProjectInquiry(new URLSearchParams('consulta=0&tab=map'))).toBeNull();
    expect(consumeProjectInquiry(new URLSearchParams('tab=map'))).toBeNull();
  });
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
