import type { KMLPlacemark } from './types';

/**
 * Turn parsed KMZ/KML placemarks into project lot rows.
 *
 * Two things this fixes/centralizes:
 *  - `polygon` is emitted as a RAW [lng,lat][] ring (the shape the map renderer
 *    and the rest of the app expect) — the wizard previously wrote a GeoJSON
 *    `{type,coordinates}` object, so imported lots fell back to simulated grids.
 *  - `planKmzImport` matches placemarks to existing lots by lot number so a
 *    re-import (or importing while editing) UPSERTS instead of duplicating.
 */

export interface KmzPricing {
  basePrice: number;
  pricePerSqm: number;
}

export interface KmzLotRow {
  lot_number: string;
  name: string;
  description: string | null;
  area: number;
  price: number;
  price_per_sqm: number;
  status: 'available';
  latitude: number;
  longitude: number;
  /** Raw [lng,lat] ring — same shape as lots.polygon / the map renderer. */
  polygon: [number, number][];
}

/** Lot number = first number in the placemark name, else its 1-based index. */
export function lotNumberFromPlacemark(placemark: KMLPlacemark, index: number): string {
  return placemark.name?.match(/\d+/)?.[0] || String(index + 1);
}

function centroid(coords: [number, number][]): { lat: number; lng: number } {
  const n = coords.length || 1;
  const sum = coords.reduce((acc, [lng, lat]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }), { lat: 0, lng: 0 });
  return { lat: sum.lat / n, lng: sum.lng / n };
}

export function placemarkToLotRow(placemark: KMLPlacemark, index: number, pricing: KmzPricing): KmzLotRow {
  const area = placemark.area || 5000;
  const c = centroid(placemark.coordinates);
  return {
    lot_number: lotNumberFromPlacemark(placemark, index),
    name: placemark.name || `Lote ${index + 1}`,
    description: placemark.description ?? null,
    area,
    // Preserve the wizard's original pricing heuristic.
    price: Math.round(pricing.basePrice + (area * pricing.pricePerSqm) / 1000),
    price_per_sqm: pricing.pricePerSqm,
    status: 'available',
    latitude: c.lat,
    longitude: c.lng,
    polygon: placemark.coordinates,
  };
}

export interface KmzImportPlan {
  toInsert: KmzLotRow[];
  toUpdate: Array<{ id: string; row: KmzLotRow }>;
}

/**
 * Match placemarks to existing lots by lot_number: matches become updates
 * (refresh geometry/area/centroid), the rest are inserts. Prevents duplicate
 * lots when re-importing or importing on an existing project.
 */
export function planKmzImport(
  placemarks: KMLPlacemark[],
  existingLots: Array<{ id: string; lot_number: string | null }>,
  pricing: KmzPricing,
): KmzImportPlan {
  const byNumber = new Map(existingLots.map((l) => [String(l.lot_number ?? ''), l.id]));
  const toInsert: KmzLotRow[] = [];
  const toUpdate: Array<{ id: string; row: KmzLotRow }> = [];
  placemarks.forEach((p, i) => {
    const row = placemarkToLotRow(p, i, pricing);
    const existingId = byNumber.get(row.lot_number);
    if (existingId) toUpdate.push({ id: existingId, row });
    else toInsert.push(row);
  });
  return { toInsert, toUpdate };
}
