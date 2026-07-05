import { describe, it, expect } from 'vitest';
import { whatsapp } from './whatsappUtils';

describe('whatsapp.quoteSummary', () => {
  it('builds a wa.me link addressed to the buyer phone (digits only)', () => {
    const url = whatsapp.quoteSummary({
      buyerName: 'María',
      projectName: 'Loteo Vista Volcán',
      lotNumber: '20',
      lotArea: 7280,
      salePrice: 92_500_000,
      reservationAmount: 500_000,
      downPayment: 18_500_000,
      termMonths: 36,
      monthlyPayment: 2_457_859,
      phone: '+56 9 2222-2222',
    });
    expect(url).toMatch(/^https:\/\/wa\.me\/\+56922222222\?text=/);
    const text = decodeURIComponent(url.split('?text=')[1]);
    expect(text).toContain('Hola María');
    expect(text).toContain('Lote 20');
    expect(text).toContain('Loteo Vista Volcán');
    expect(text).toContain('36 cuotas');
  });

  it('omits financing lines when no plan is provided and works without phone', () => {
    const url = whatsapp.quoteSummary({
      projectName: 'Proyecto X',
      lotNumber: '5',
      lotArea: 5000,
      salePrice: 45_000_000,
    });
    expect(url).toMatch(/^https:\/\/wa\.me\/\?text=/);
    const text = decodeURIComponent(url.split('?text=')[1]);
    expect(text).not.toContain('cuotas');
    expect(text).not.toContain('seña');
  });
});

describe('whatsapp.lotInquiry', () => {
  it('includes lot, project and price context', () => {
    const url = whatsapp.lotInquiry({
      projectName: 'Loteo Sur',
      lotNumber: '3',
      lotArea: 5000,
      lotPrice: 50_000_000,
    });
    const text = decodeURIComponent(url.split('?text=')[1]);
    expect(text).toContain('Lote 3');
    expect(text).toContain('Loteo Sur');
    expect(text).toContain('$50.000.000');
  });
});
