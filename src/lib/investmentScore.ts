import { Listing } from '@/hooks/useListings';

export interface InvestmentScoreResult {
  score: number; // 0-100
  label: string;
  color: string;
  factors: { name: string; value: number; max: number }[];
}

/**
 * Client-side heuristic investment score for quick display on cards.
 * Not a replacement for the full AI analysis, but provides instant feedback.
 */
export function calculateInvestmentScore(listing: Listing): InvestmentScoreResult {
  const factors: { name: string; value: number; max: number }[] = [];
  let total = 0;

  // 1. Price competitiveness (price per m²) — max 25
  const pricePerM2 = listing.area_m2 && listing.area_m2 > 0 ? listing.price / listing.area_m2 : null;
  if (pricePerM2 !== null) {
    // Lower price/m2 = better score. Benchmark ~50k CLP/m2 = excellent, >500k = poor
    const pScore = Math.max(0, Math.min(25, Math.round(25 * (1 - Math.min(pricePerM2 / 500000, 1)))));
    factors.push({ name: 'Precio/m²', value: pScore, max: 25 });
    total += pScore;
  } else {
    factors.push({ name: 'Precio/m²', value: 0, max: 25 });
  }

  // 2. Legal status — max 20
  const legalScores: Record<string, number> = { verified: 20, reviewing: 12, pending: 5 };
  const legalScore = legalScores[listing.legal_status] || 3;
  factors.push({ name: 'Estado legal', value: legalScore, max: 20 });
  total += legalScore;

  // 3. Utilities/services — max 20
  const utils = listing.utilities as Record<string, boolean> | null;
  if (utils) {
    const keys = ['agua', 'luz', 'gas', 'internet', 'alcantarillado'];
    const available = keys.filter(k => utils[k]).length;
    const uScore = Math.round((available / keys.length) * 20);
    factors.push({ name: 'Servicios', value: uScore, max: 20 });
    total += uScore;
  } else {
    factors.push({ name: 'Servicios', value: 5, max: 20 });
    total += 5;
  }

  // 4. Subdivision eligible — max 10
  const subScore = listing.subdivision_eligible ? 10 : 2;
  factors.push({ name: 'Subdivisión', value: subScore, max: 10 });
  total += subScore;

  // 5. Area size (bigger = more potential) — max 15
  const area = listing.area_m2 || (listing.area_ha ? listing.area_ha * 10000 : 0);
  const areaScore = Math.min(15, Math.round(15 * Math.min(area / 50000, 1)));
  factors.push({ name: 'Superficie', value: areaScore, max: 15 });
  total += areaScore;

  // 6. Engagement (views, featured) — max 10
  let engScore = 0;
  if (listing.featured) engScore += 5;
  if (listing.views_count > 50) engScore += 3;
  else if (listing.views_count > 10) engScore += 2;
  if (listing.images.length >= 3) engScore += 2;
  engScore = Math.min(10, engScore);
  factors.push({ name: 'Demanda', value: engScore, max: 10 });
  total += engScore;

  const score = Math.min(100, total);

  let label: string;
  let color: string;
  if (score >= 75) { label = 'Excelente'; color = 'text-emerald-500'; }
  else if (score >= 55) { label = 'Bueno'; color = 'text-blue-500'; }
  else if (score >= 35) { label = 'Regular'; color = 'text-amber-500'; }
  else { label = 'Bajo'; color = 'text-red-500'; }

  return { score, label, color, factors };
}
