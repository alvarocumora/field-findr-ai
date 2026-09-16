import type { VelLot } from './lots';

export interface VelTerrainInsight {
  elevationAvg: number;
  elevationMin: number;
  elevationMax: number;
  slopeCategory: 'flat' | 'slight' | 'steep';
  slopeDegrees: number;
}

export interface RuralScore {
  overall: number;
  value: number;
  space: number;
  terrain: number | null;
  pricePerM2: number | null;
  insights: string[];
}

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));
const normalized = (value: number, min: number, max: number) =>
  max <= min ? 0.5 : clamp((value - min) / (max - min), 0, 1);

export function calculateRuralScore(
  lot: VelLot,
  allLots: VelLot[],
  terrain?: VelTerrainInsight | null,
): RuralScore {
  const commercial = allLots.filter((item) => item.status === 'available' && item.price_clp > 0);
  const pricePerM2Values = commercial.map((item) => item.price_clp / item.area_m2);
  const areas = commercial.map((item) => item.area_m2);
  const lotPricePerM2 = lot.price_clp > 0 ? lot.price_clp / lot.area_m2 : null;

  const minPpm2 = Math.min(...pricePerM2Values);
  const maxPpm2 = Math.max(...pricePerM2Values);
  const minArea = Math.min(...areas);
  const maxArea = Math.max(...areas);
  const avgPpm2 = pricePerM2Values.reduce((sum, value) => sum + value, 0) / Math.max(1, pricePerM2Values.length);
  const avgArea = areas.reduce((sum, value) => sum + value, 0) / Math.max(1, areas.length);

  const value = lotPricePerM2
    ? Math.round(55 + (1 - normalized(lotPricePerM2, minPpm2, maxPpm2)) * 40)
    : 50;
  const space = Math.round(55 + normalized(lot.area_m2, minArea, maxArea) * 40);
  const terrainScore = terrain
    ? terrain.slopeCategory === 'flat'
      ? 95
      : terrain.slopeCategory === 'slight'
        ? 82
        : 62
    : null;

  const overall = terrainScore === null
    ? Math.round(value * 0.58 + space * 0.42)
    : Math.round(value * 0.42 + space * 0.28 + terrainScore * 0.30);

  const insights: string[] = [];
  if (lotPricePerM2 && avgPpm2 > 0) {
    const delta = Math.round(((lotPricePerM2 - avgPpm2) / avgPpm2) * 100);
    if (delta <= -5) insights.push(`${Math.abs(delta)}% bajo el promedio del proyecto por m²`);
    else if (delta >= 5) insights.push(`${delta}% sobre el promedio del proyecto por m²`);
    else insights.push('Precio por m² cercano al promedio del proyecto');
  }
  if (lot.area_m2 >= avgArea * 1.15) insights.push('Superficie superior al promedio del proyecto');
  else if (lot.area_m2 <= avgArea * 0.9) insights.push('Formato compacto dentro del proyecto');
  else insights.push('Superficie cercana al promedio del proyecto');

  if (terrain) {
    insights.push(
      terrain.slopeCategory === 'flat'
        ? `Relieve estimado plano · ${terrain.slopeDegrees.toFixed(1)}°`
        : terrain.slopeCategory === 'slight'
          ? `Pendiente estimada suave · ${terrain.slopeDegrees.toFixed(1)}°`
          : `Pendiente estimada marcada · ${terrain.slopeDegrees.toFixed(1)}°`,
    );
  }

  return {
    overall: clamp(overall),
    value: clamp(value),
    space: clamp(space),
    terrain: terrainScore,
    pricePerM2: lotPricePerM2 ? Math.round(lotPricePerM2) : null,
    insights,
  };
}

export interface LotSearchIntent {
  priceRange?: { min: number | null; max: number | null } | null;
  areaRange?: { min: number | null; max: number | null } | null;
}

export interface LotMatch {
  lot: VelLot;
  score: number;
  reasons: string[];
}

export function rankLotsForIntent(lots: VelLot[], intent?: LotSearchIntent | null): LotMatch[] {
  const available = lots.filter((lot) => lot.status === 'available' && lot.price_clp > 0);
  if (!available.length) return [];

  const pricesPerM2 = available.map((lot) => lot.price_clp / lot.area_m2);
  const areas = available.map((lot) => lot.area_m2);
  const minPpm2 = Math.min(...pricesPerM2);
  const maxPpm2 = Math.max(...pricesPerM2);
  const minArea = Math.min(...areas);
  const maxArea = Math.max(...areas);

  return available
    .map((lot) => {
      const reasons: string[] = [];
      let score = 0;
      let weight = 0;
      const priceMin = intent?.priceRange?.min ?? null;
      const priceMax = intent?.priceRange?.max ?? null;
      const areaMin = intent?.areaRange?.min ?? null;
      const areaMax = intent?.areaRange?.max ?? null;

      if (priceMin !== null || priceMax !== null) {
        weight += 45;
        const inBudget =
          (priceMin === null || lot.price_clp >= priceMin) &&
          (priceMax === null || lot.price_clp <= priceMax);
        if (inBudget) {
          score += 45;
          reasons.push('Dentro del presupuesto indicado');
        } else if (priceMax && lot.price_clp <= priceMax * 1.08) {
          score += 22;
          reasons.push('Muy cerca del presupuesto');
        }
      }

      if (areaMin !== null || areaMax !== null) {
        weight += 35;
        const inArea =
          (areaMin === null || lot.area_m2 >= areaMin) &&
          (areaMax === null || lot.area_m2 <= areaMax);
        if (inArea) {
          score += 35;
          reasons.push('Superficie dentro del rango buscado');
        } else if (areaMin && lot.area_m2 >= areaMin * 0.9) {
          score += 18;
          reasons.push('Superficie cercana a lo solicitado');
        }
      }

      weight += 20;
      const valueScore = 1 - normalized(lot.price_clp / lot.area_m2, minPpm2, maxPpm2);
      const spaceScore = normalized(lot.area_m2, minArea, maxArea);
      score += valueScore * 12 + spaceScore * 8;
      if (valueScore >= 0.75) reasons.push('Precio por m² competitivo');
      if (spaceScore >= 0.75) reasons.push('Entre las parcelas de mayor superficie');

      return {
        lot,
        score: Math.round((score / weight) * 100),
        reasons: reasons.slice(0, 3),
      };
    })
    .sort((a, b) => b.score - a.score || a.lot.price_clp - b.lot.price_clp);
}
