import { describe, expect, it } from 'vitest';
import { commercialOfferInquiryUrl, getProjectCommercialOffer } from './commercialOffers';

describe('confirmed commercial offers', () => {
  it('prices Hualañé 7500 m² at CLP 10990000', () => {
    expect(getProjectCommercialOffer('parcelas-caone-hualane')?.prices.find(p => p.areaM2 === 7500)?.priceClp).toBe(10_990_000);
  });
  it('prices Hualañé one hectare at CLP 12990000', () => {
    expect(getProjectCommercialOffer('parcelas-caone-hualane')?.prices.find(p => p.areaM2 === 10000)?.priceClp).toBe(12_990_000);
  });
  it('does not assign a price to other Hualañé surfaces', () => {
    expect(getProjectCommercialOffer('parcelas-caone-hualane')?.prices.find(p => p.areaM2 === 20000)).toBeUndefined();
  });
  it('starts Explora Park at CLP 10990000', () => {
    expect(getProjectCommercialOffer('explora-park')?.prices[0].priceClp).toBe(10_990_000);
  });
  it('offers only two liquidation parcels at CLP 6990000 without assigning lot IDs', () => {
    expect(getProjectCommercialOffer('explora-park')?.liquidation).toEqual({ count: 2, priceClp: 6_990_000 });
  });
  it('starts Licantén at CLP 15990000', () => {
    expect(getProjectCommercialOffer('valle-escondido-licanten')?.prices[0].priceClp).toBe(15_990_000);
  });
  it('preserves attribution and tab context for a liquidation inquiry', () => {
    const url = commercialOfferInquiryUrl('/p/explora-park', new URLSearchParams('ref=BK-1&tab=lots'), true);
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('ref')).toBe('BK-1');
    expect(params.get('tab')).toBe('lots');
    expect(params.get('consulta')).toBe('1');
    expect(params.get('utm_campaign')).toBe('explora_liquidacion');
  });
  it('does not attach offers to unrelated projects', () => {
    expect(getProjectCommercialOffer('reserva-huellelhue')).toBeNull();
  });
});