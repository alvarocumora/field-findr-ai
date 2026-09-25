/**
 * Rural Finder pricing rule. A project price is ALWAYS interpreted with its
 * pricing_mode, so "$12.990.000 por hectárea" is never read as a lot price.
 */
export type PricingMode = 'per_lot' | 'per_ha' | 'per_m2';

export interface ProjectPricing {
  pricing_mode: PricingMode;
  unit_price: number;
}

/** Lot price in CLP from its area (m²) and the project pricing. */
export function computeLotPrice(areaM2: number, pricing: ProjectPricing): number {
  const area = Number(areaM2) || 0;
  const unit = Number(pricing.unit_price) || 0;
  switch (pricing.pricing_mode) {
    case 'per_ha':
      // Use the commercial area rounded to 2 decimals of ha (as shown to buyers).
      return Math.round((Math.round((area / 10000) * 100) / 100) * unit);
    case 'per_m2':
      return Math.round(area * unit);
    default:
      return Math.round(unit);
  }
}

export function pricingUnitLabel(mode: PricingMode): string {
  return mode === 'per_ha' ? 'por hectárea' : mode === 'per_m2' ? 'por m²' : 'por lote';
}

/** Read pricing from projects.landing_config.pricing (no schema change needed). */
export function readProjectPricing(landingConfig: unknown): ProjectPricing | null {
  const cfg = landingConfig && typeof landingConfig === 'object' ? (landingConfig as any).pricing : null;
  if (!cfg || !['per_lot', 'per_ha', 'per_m2'].includes(cfg.pricing_mode)) return null;
  const unit = Number(cfg.unit_price);
  return Number.isFinite(unit) && unit > 0 ? { pricing_mode: cfg.pricing_mode, unit_price: unit } : null;
}

export const VALLE_HUALANE_PRICING: ProjectPricing = { pricing_mode: 'per_ha', unit_price: 12_990_000 };
