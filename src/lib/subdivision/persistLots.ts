import { localToGeo, type SubdivisionResult } from './autoSubdivide';

/**
 * Bridge from the design-time auto-subdivision result to persistable `lots`
 * rows. The engine works in local planar metres; here we project every lot
 * ring back to [lng, lat] (the raw-array shape `lots.polygon` and the map
 * expect) and derive lot numbers and prices.
 */

export interface LotDraftRow {
  project_id: string;
  lot_number: string;
  name: string;
  area: number;
  price: number;
  price_per_sqm: number;
  status: 'available';
  /** Raw [lng, lat] ring — same shape as lots.polygon and the map renderer. */
  polygon: [number, number][];
}

export interface SubdivisionToLotsOptions {
  projectId: string;
  /** Geo anchor the local metres are centred on. */
  centerLng: number;
  centerLat: number;
  /** If set, each lot's price = round(area × pricePerSqm). */
  pricePerSqm?: number;
  /** First lot number (default 1). */
  startNumber?: number;
  /** Prefix for lot_number, e.g. "" or "L" (default ""). */
  numberPrefix?: string;
}

/** Convert a subdivision result into lot rows ready to insert for a project. */
export function subdivisionToLotInserts(
  result: SubdivisionResult,
  opts: SubdivisionToLotsOptions,
): LotDraftRow[] {
  const start = opts.startNumber ?? 1;
  const prefix = opts.numberPrefix ?? '';
  const pps = Math.max(0, opts.pricePerSqm ?? 0);

  return result.lots.map((lot, i) => {
    const num = start + i;
    const area = Math.round(lot.area);
    return {
      project_id: opts.projectId,
      lot_number: `${prefix}${num}`,
      name: `Lote ${num}`,
      area,
      price: Math.round(area * pps),
      price_per_sqm: Math.round(pps),
      status: 'available' as const,
      polygon: localToGeo(lot.polygon, opts.centerLng, opts.centerLat),
    };
  });
}

/** Project a local-metres perimeter ring to a [lng, lat] boundary for the project. */
export function perimeterToGeo(
  localPerimeter: [number, number][],
  centerLng: number,
  centerLat: number,
): [number, number][] {
  return localToGeo(localPerimeter, centerLng, centerLat);
}
