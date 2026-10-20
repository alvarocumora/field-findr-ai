/**
 * Currency-safe price helpers. CLP and UF are never mixed: no conversion
 * without a trusted rate, no cross-currency $/m² comparisons.
 */
export type PriceCurrency = 'CLP' | 'UF' | string;

interface Priced {
  price: number;
  area_m2: number | null;
  currency?: string | null;
}

const cur = (c?: string | null) => (c || 'CLP').toUpperCase();

/** "$4.000/m²" for CLP, "0,35 UF/m²" for UF, null when not computable. */
export const formatPricePerM2 = (price: number, areaM2: number | null, currency?: string | null): string | null => {
  if (!price || !areaM2 || areaM2 <= 0) return null;
  const v = price / areaM2;
  const c = cur(currency);
  if (c === 'UF') {
    const digits = v < 1 ? 3 : v < 100 ? 2 : 0;
    return `${v.toLocaleString('es-CL', { maximumFractionDigits: digits, minimumFractionDigits: digits ? 2 : 0 })} UF/m²`;
  }
  if (c === 'CLP') {
    if (v < 1) return null; // nonsense like "$1/m²" for UF-as-CLP data
    return `$${Math.round(v).toLocaleString('es-CL')}/m²`;
  }
  return `${Math.round(v).toLocaleString('es-CL')} ${c}/m²`;
};

/** Short total price with explicit currency: "$35M CLP" or "35.000 UF". */
export const formatPriceWithCurrency = (price: number, currency?: string | null): string => {
  const c = cur(currency);
  if (c === 'UF') return `${price.toLocaleString('es-CL', { maximumFractionDigits: 0 })} UF`;
  if (price >= 1_000_000_000) return `$${(price / 1_000_000_000).toLocaleString('es-CL', { maximumFractionDigits: 1 })} mil M ${c}`;
  if (price >= 1_000_000) return `$${(price / 1_000_000).toLocaleString('es-CL', { maximumFractionDigits: 1 })}M ${c}`;
  return `$${price.toLocaleString('es-CL')} ${c}`;
};

/** Minimum price per currency, sorted by count desc. */
export const minPriceByCurrency = (items: Priced[]) => {
  const map = new Map<string, { currency: string; min: number; count: number }>();
  for (const l of items) {
    if (!l.price || l.price <= 0) continue;
    const c = cur(l.currency);
    const e = map.get(c);
    if (!e) map.set(c, { currency: c, min: l.price, count: 1 });
    else { e.count++; e.min = Math.min(e.min, l.price); }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
};

/** Lowest price/m² within ONE currency (the most common one unless given). */
export const bestPricePerM2 = <T extends Priced>(items: T[], currency?: string): T | null => {
  const target = currency ? cur(currency) : minPriceByCurrency(items)[0]?.currency;
  if (!target) return null;
  let best: T | null = null;
  let ratio = Infinity;
  for (const l of items) {
    if (cur(l.currency) !== target || !l.price || !l.area_m2 || l.area_m2 <= 0) continue;
    const r = l.price / l.area_m2;
    if (r < ratio) { ratio = r; best = l; }
  }
  return best;
};

/** A comparative winner or price rank cannot be asserted across currencies
 * without an explicit, trusted UF/CLP exchange rate. */
export const hasMixedCurrencies = (items: ReadonlyArray<{ currency?: string | null }>): boolean =>
  new Set(items.map(item => cur(item.currency))).size > 1;
