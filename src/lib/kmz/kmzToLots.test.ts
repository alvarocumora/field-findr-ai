import { describe, it, expect } from 'vitest';
import { lotNumberFromPlacemark, placemarkToLotRow, planKmzImport } from './kmzToLots';
import type { KMLPlacemark } from './types';

const square = (cx: number, cy: number): [number, number][] => [
  [cx - 0.001, cy - 0.001],
  [cx + 0.001, cy - 0.001],
  [cx + 0.001, cy + 0.001],
  [cx - 0.001, cy + 0.001],
];

const placemark = (name: string, cx = -71.16, cy = -34.87, area = 5000): KMLPlacemark => ({
  name,
  coordinates: square(cx, cy),
  area,
  isPolygon: true,
});

const pricing = { basePrice: 15_000_000, pricePerSqm: 3000 };

describe('lotNumberFromPlacemark', () => {
  it('takes the first number in the name', () => {
    expect(lotNumberFromPlacemark(placemark('Lote 12'), 0)).toBe('12');
  });
  it('falls back to the 1-based index when there is no number', () => {
    expect(lotNumberFromPlacemark(placemark('Parcela'), 4)).toBe('5');
  });
});

describe('placemarkToLotRow', () => {
  const row = placemarkToLotRow(placemark('Lote 7'), 6, pricing);
  it('emits a RAW [lng,lat] ring, not a GeoJSON object', () => {
    expect(Array.isArray(row.polygon)).toBe(true);
    expect(row.polygon).toHaveLength(4);
    expect(row.polygon[0]).toHaveLength(2);
  });
  it('computes the centroid of the ring', () => {
    expect(row.latitude).toBeCloseTo(-34.87, 6);
    expect(row.longitude).toBeCloseTo(-71.16, 6);
  });
  it('applies the pricing heuristic and defaults', () => {
    expect(row.price).toBe(Math.round(15_000_000 + (5000 * 3000) / 1000));
    expect(row.price_per_sqm).toBe(3000);
    expect(row.status).toBe('available');
    expect(row.lot_number).toBe('7');
  });
});

describe('planKmzImport', () => {
  const placemarks = [placemark('Lote 1'), placemark('Lote 2'), placemark('Lote 3')];

  it('inserts everything when there are no existing lots', () => {
    const plan = planKmzImport(placemarks, [], pricing);
    expect(plan.toInsert.map((r) => r.lot_number)).toEqual(['1', '2', '3']);
    expect(plan.toUpdate).toHaveLength(0);
  });

  it('upserts by lot_number: matches update, the rest insert', () => {
    const existing = [{ id: 'aa', lot_number: '2' }];
    const plan = planKmzImport(placemarks, existing, pricing);
    expect(plan.toInsert.map((r) => r.lot_number)).toEqual(['1', '3']);
    expect(plan.toUpdate).toHaveLength(1);
    expect(plan.toUpdate[0].id).toBe('aa');
    expect(plan.toUpdate[0].row.lot_number).toBe('2');
  });
});
