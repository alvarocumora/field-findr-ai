/** Display-only campaigns: lot quotes and reservations keep using live inventory. */
export const PROJECT_COMMERCIAL_OFFERS = {
  'explora-park': {
    prices: [{ priceClp: 10_990_000, areaM2: null }],
    liquidation: { count: 2, priceClp: 6_990_000 },
  },
  'parcelas-caone-hualane': {
    prices: [{ priceClp: 10_990_000, areaM2: 7_500 }, { priceClp: 12_990_000, areaM2: 10_000 }],
    liquidation: null,
  },
  'valle-escondido-licanten': {
    prices: [{ priceClp: 15_990_000, areaM2: null }],
    liquidation: null,
  },
} as const;

export function getProjectCommercialOffer(slug?: string | null) {
  if (!slug || !(slug in PROJECT_COMMERCIAL_OFFERS)) return null;
  return PROJECT_COMMERCIAL_OFFERS[slug as keyof typeof PROJECT_COMMERCIAL_OFFERS];
}

export function commercialOfferInquiryUrl(base: string, current: URLSearchParams, liquidation = false) {
  const params = new URLSearchParams(current);
  params.set('consulta', '1');
  params.set('utm_campaign', liquidation ? 'explora_liquidacion' : 'oferta_comercial');
  return `${base}?${params}`;
}

export function commercialOfferInquiryMessage(campaign: string | null) {
  return campaign === 'explora_liquidacion'
    ? 'Me interesa consultar por una de las 2 parcelas con pendiente en liquidación a $6.990.000 CLP en Explora Park.'
    : '';
}