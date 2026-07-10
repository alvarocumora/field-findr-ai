import { describe, it, expect } from 'vitest';
import { subdivisionToLotInserts, perimeterToGeo } from './persistLots';
import { autoSubdivide } from './autoSubdivide';
import type { SubdivisionResult } from './autoSubdivide';

const CENTER = { lng: -71.16, lat: -34.87 };

// A 300×240m macro-lot centred on the origin (local metres).
const perimeter: [number, number][] = [
  [-150, -120],
  [150, -120],
  [150, 120],
  [-150, 120],
];

const result: SubdivisionResult = autoSubdivide(perimeter, {
  minLotArea: 5000,
  roadPercentage: 15,
  greenPercentage: 10,
  minFrontage: 20,
  roadWidth: 8,
});

describe('subdivisionToLotInserts', () => {
  const rows = subdivisionToLotInserts(result, {
    projectId: 'p1',
    centerLng: CENTER.lng,
    centerLat: CENTER.lat,
    pricePerSqm: 12000,
  });

  it('produces one row per generated lot', () => {
    expect(result.lots.length).toBeGreaterThan(0);
    expect(rows).toHaveLength(result.lots.length);
  });

  it('numbers lots sequentially and attaches the project id', () => {
    expect(rows[0].lot_number).toBe('1');
    expect(rows[1].lot_number).toBe('2');
    expect(rows.every((r) => r.project_id === 'p1')).toBe(true);
    expect(rows.every((r) => r.status === 'available')).toBe(true);
  });

  it('honours a start number and prefix', () => {
    const r = subdivisionToLotInserts(result, {
      projectId: 'p1', centerLng: CENTER.lng, centerLat: CENTER.lat, startNumber: 10, numberPrefix: 'A-',
    });
    expect(r[0].lot_number).toBe('A-10');
    expect(r[1].lot_number).toBe('A-11');
  });

  it('prices each lot as area × price/m²', () => {
    for (const r of rows) {
      expect(r.price).toBe(Math.round(r.area * 12000));
      expect(r.price_per_sqm).toBe(12000);
    }
  });

  it('leaves price at 0 when no price/m² is given', () => {
    const r = subdivisionToLotInserts(result, { projectId: 'p1', centerLng: CENTER.lng, centerLat: CENTER.lat });
    expect(r.every((x) => x.price === 0)).toBe(true);
  });

  it('projects rings to plausible [lng,lat] near the anchor', () => {
    for (const r of rows) {
      expect(r.polygon.length).toBeGreaterThanOrEqual(3);
      for (const [lng, lat] of r.polygon) {
        expect(Math.abs(lng - CENTER.lng)).toBeLessThan(0.01); // within ~1km
        expect(Math.abs(lat - CENTER.lat)).toBeLessThan(0.01);
      }
    }
  });
});

describe('perimeterToGeo', () => {
  it('round-trips a local ring back to geo centred on the anchor', () => {
    const geo = perimeterToGeo(perimeter, CENTER.lng, CENTER.lat);
    expect(geo).toHaveLength(4);
    // The ring centroid should land back on the anchor.
    const cLng = geo.reduce((s, p) => s + p[0], 0) / geo.length;
    const cLat = geo.reduce((s, p) => s + p[1], 0) / geo.length;
    expect(cLng).toBeCloseTo(CENTER.lng, 6);
    expect(cLat).toBeCloseTo(CENTER.lat, 6);
  });
});
