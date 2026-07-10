/**
 * Consolidated project price list ("lista de precios").
 *
 * Pure helpers that turn a project's lots into an ordered, formatted table plus
 * summary totals — shared by the PDF export, the CSV export and any on-screen
 * table. No React / jsPDF here so it stays trivially unit-testable.
 */

export interface PriceListLot {
  lot_number?: string | null;
  name?: string | null;
  area?: number | null;
  price?: number | null;
  price_per_sqm?: number | null;
  status?: string | null;
}

export interface PriceRow {
  lotNumber: string;
  name: string;
  area: number;
  price: number;
  pricePerSqm: number;
  status: string;
  statusLabel: string;
}

export interface PriceSummary {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  totalArea: number;
  /** Sum of every lot's price. */
  totalValue: number;
  /** Sum of prices of lots still available (the sellable inventory). */
  availableValue: number;
  /** Area-weighted average price per m² over lots with area and price. */
  avgPricePerSqm: number;
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  reserved: 'Reservado',
  sold: 'Vendido',
};

export const statusLabel = (status?: string | null): string =>
  STATUS_LABELS[status ?? ''] ?? (status ? status : '—');

/**
 * Compare lot identifiers the way a human reads them: "2" before "10", and
 * "A-2" before "A-10", by comparing numeric chunks numerically and the rest
 * case-insensitively.
 */
export function compareLotNumbers(a: string, b: string): number {
  const ca = a.match(/(\d+|\D+)/g) ?? [];
  const cb = b.match(/(\d+|\D+)/g) ?? [];
  const n = Math.max(ca.length, cb.length);
  for (let i = 0; i < n; i++) {
    const sa = ca[i] ?? '';
    const sb = cb[i] ?? '';
    const na = Number(sa);
    const nb = Number(sb);
    const bothNum = sa !== '' && sb !== '' && !Number.isNaN(na) && !Number.isNaN(nb);
    if (bothNum) {
      if (na !== nb) return na - nb;
    } else {
      const cmp = sa.toLowerCase().localeCompare(sb.toLowerCase());
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}

/** Build the ordered, normalized rows. Missing $/m² is derived from price/area. */
export function buildPriceRows(lots: PriceListLot[]): PriceRow[] {
  return lots
    .map((l): PriceRow => {
      const area = Number(l.area || 0);
      const price = Number(l.price || 0);
      const explicit = Number(l.price_per_sqm || 0);
      const pricePerSqm = explicit > 0 ? explicit : area > 0 ? price / area : 0;
      return {
        lotNumber: l.lot_number != null && l.lot_number !== '' ? String(l.lot_number) : '—',
        name: l.name ?? '',
        area,
        price,
        pricePerSqm,
        status: l.status ?? '',
        statusLabel: statusLabel(l.status),
      };
    })
    .sort((a, b) => compareLotNumbers(a.lotNumber, b.lotNumber));
}

export function summarizePriceList(rows: PriceRow[]): PriceSummary {
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const totalArea = rows.reduce((acc, r) => acc + r.area, 0);
  const totalValue = rows.reduce((acc, r) => acc + r.price, 0);
  const availableValue = rows
    .filter((r) => r.status === 'available')
    .reduce((acc, r) => acc + r.price, 0);
  const priced = rows.filter((r) => r.area > 0 && r.price > 0);
  const pricedArea = priced.reduce((acc, r) => acc + r.area, 0);
  const pricedValue = priced.reduce((acc, r) => acc + r.price, 0);
  return {
    total: rows.length,
    available: count('available'),
    reserved: count('reserved'),
    sold: count('sold'),
    totalArea,
    totalValue,
    availableValue,
    avgPricePerSqm: pricedArea > 0 ? pricedValue / pricedArea : 0,
  };
}

const csvCell = (v: string | number): string => {
  const s = String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Semicolon-delimited CSV (the delimiter es-CL Excel expects) with a UTF-8 BOM
 * so accents survive when opened in Excel. Numbers are raw integers so the
 * spreadsheet reads them as numbers, not text.
 */
export function priceListToCsv(rows: PriceRow[]): string {
  const header = ['N°', 'Nombre', 'Superficie (m2)', 'Precio (CLP)', 'Precio/m2 (CLP)', 'Estado'];
  const lines = [header.map(csvCell).join(';')];
  for (const r of rows) {
    lines.push(
      [
        r.lotNumber,
        r.name,
        Math.round(r.area),
        Math.round(r.price),
        Math.round(r.pricePerSqm),
        r.statusLabel,
      ]
        .map(csvCell)
        .join(';'),
    );
  }
  return '\ufeff' + lines.join('\r\n');
}
