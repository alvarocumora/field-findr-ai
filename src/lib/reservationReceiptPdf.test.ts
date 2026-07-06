import { describe, it, expect } from 'vitest';
import { buildReceiptData, generateReservationReceipt } from './reservationReceiptPdf';

const reservation = {
  id: 'a1b2c3d4-1111-2222-3333-444455556666',
  buyer_name: 'Ana Prueba',
  buyer_email: 'ana@x.cl',
  buyer_phone: '+56911112222',
  buyer_rut: '12.345.678-9',
  reservation_amount: 500000,
  paid_at: '2026-07-06T12:30:00Z',
  mercadopago_payment_id: 'mp-12345',
  lots: {
    lot_number: 'A-12',
    area: 5000,
    projects: { name: 'Parcelas Valle Verde', location: 'Teno' },
  },
};

describe('buildReceiptData', () => {
  it('maps the reservation row into receipt fields', () => {
    const d = buildReceiptData(reservation);
    expect(d.folio).toBe('A1B2C3D4');
    expect(d.buyerName).toBe('Ana Prueba');
    expect(d.buyerRut).toBe('12.345.678-9');
    expect(d.lotNumber).toBe('A-12');
    expect(d.lotArea).toBe(5000);
    expect(d.projectName).toBe('Parcelas Valle Verde');
    expect(d.projectLocation).toBe('Teno');
    expect(d.amount).toBe(500000);
    expect(d.currency).toBe('CLP');
    expect(d.mercadopagoPaymentId).toBe('mp-12345');
  });

  it('is resilient to missing nested lot/project and numeric strings', () => {
    const d = buildReceiptData({
      id: 'ffffffff-0000-0000-0000-000000000000',
      reservation_amount: '750000' as unknown as number,
      lots: null,
    });
    expect(d.folio).toBe('FFFFFFFF');
    expect(d.buyerName).toBe('—');
    expect(d.lotNumber).toBeUndefined();
    expect(d.projectName).toBeUndefined();
    expect(d.amount).toBe(750000);
  });
});

describe('generateReservationReceipt', () => {
  it('produces a non-empty jsPDF document', () => {
    const doc = generateReservationReceipt(buildReceiptData(reservation));
    const out = doc.output('arraybuffer');
    expect(out.byteLength).toBeGreaterThan(1000);
    // jsPDF documents start with the %PDF- magic bytes
    const head = new TextDecoder('latin1').decode(new Uint8Array(out).slice(0, 5));
    expect(head).toBe('%PDF-');
  });

  it('does not throw when optional buyer/lot fields are absent', () => {
    const d = buildReceiptData({
      id: '11112222-3333-4444-5555-666677778888',
      buyer_name: 'Solo Nombre',
      reservation_amount: 300000,
      lots: { lot_number: 'B-3', projects: null },
    });
    expect(() => generateReservationReceipt(d)).not.toThrow();
  });
});
