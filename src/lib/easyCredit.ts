import { computeFinancing } from '@/lib/buyerTools';

/** Campaign values are display defaults only, never inventory updates. */
export const LICANTEN_PROMO_PRICE = 19_990_000;
export const LICANTEN_PATH = '/p/valle-escondido-licanten';
export const EASY_CREDIT_TERMS = [12, 24, 36, 48, 60] as const;

const bounded = (value: number, min: number, max: number, fallback = 0) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

export function computeEasyCredit(input: { price: number; downPct: number; months: number; annualRatePct: number }) {
  const price = bounded(input.price, 0, 1_000_000_000);
  const downPct = bounded(input.downPct, 0, 100);
  const months = EASY_CREDIT_TERMS.find(term => term === input.months) ?? 36;
  const annualRatePct = bounded(input.annualRatePct, 0, 60);
  const result = computeFinancing({ price, downPct, months, annualRatePct });
  // Rounding a monthly instalment must not create fictitious interest at 0%.
  return annualRatePct === 0 ? { ...result, totalPaid: price, totalInterest: 0 } : result;
}

export function financingInquiryUrl(lotId?: string | null) {
  const params = new URLSearchParams({ consulta: '1', utm_campaign: 'consulta_financiamiento' });
  if (lotId) params.set('lote', lotId);
  return `${LICANTEN_PATH}?${params}`;
}