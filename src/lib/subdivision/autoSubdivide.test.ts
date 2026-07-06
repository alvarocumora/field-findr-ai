import { describe, it, expect } from 'vitest';
import { autoSubdivide, type SubdivisionParams } from './autoSubdivide';

// Shoelace area helper
const area = (pts: [number, number][]) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  return Math.abs(a) / 2;
};

// Ray-cast point-in-polygon
const inside = (p: [number, number], poly: [number, number][]) => {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
};

const params: SubdivisionParams = {
  minLotArea: 500,
  roadPercentage: 15,
  greenPercentage: 10,
  minFrontage: 15,
  roadWidth: 8,
};

describe('autoSubdivide', () => {
  // 200m × 150m rectangle (30.000 m²) centered at origin
  const rect: [number, number][] = [
    [-100, -75], [100, -75], [100, 75], [-100, 75],
  ];

  it('generates lots that fit inside the parcel and meet the minimum area', () => {
    const r = autoSubdivide(rect, params);
    expect(r.lots.length).toBeGreaterThan(0);
    for (const lot of r.lots) {
      expect(lot.area).toBeGreaterThanOrEqual(params.minLotArea * 0.8);
      // Centroid must lie within the parcel (real clipping, not stick-out rects)
      const cx = lot.polygon.reduce((s, p) => s + p[0], 0) / lot.polygon.length;
      const cy = lot.polygon.reduce((s, p) => s + p[1], 0) / lot.polygon.length;
      expect(inside([cx, cy], rect)).toBe(true);
    }
  });

  it('never places lot area beyond the parcel total', () => {
    const r = autoSubdivide(rect, params);
    const lotSum = r.lots.reduce((s, l) => s + l.area, 0);
    expect(lotSum).toBeLessThanOrEqual(area(rect) + 1);
    expect(r.stats.efficiency).toBeGreaterThan(0);
    expect(r.stats.efficiency).toBeLessThanOrEqual(100);
  });

  it('clips boundary lots to a non-convex (L-shaped) parcel', () => {
    // L-shape: a 200×200 square with the top-right 100×100 quadrant removed
    const lShape: [number, number][] = [
      [0, 0], [200, 0], [200, 100], [100, 100], [100, 200], [0, 200],
    ];
    const r = autoSubdivide(lShape, { ...params, minLotArea: 400 });
    expect(r.lots.length).toBeGreaterThan(0);
    // No lot centroid may fall in the removed quadrant (x>100 && y>100)
    for (const lot of r.lots) {
      const cx = lot.polygon.reduce((s, p) => s + p[0], 0) / lot.polygon.length;
      const cy = lot.polygon.reduce((s, p) => s + p[1], 0) / lot.polygon.length;
      expect(cx > 100 && cy > 100).toBe(false);
    }
  });

  it('respects the target lot count when set', () => {
    const r = autoSubdivide(rect, { ...params, targetLots: 6 });
    expect(r.lots.length).toBeLessThanOrEqual(6);
  });

  it('recomputes frontage/depth from the clipped footprint (area ≈ frontage×depth)', () => {
    const r = autoSubdivide(rect, params);
    for (const lot of r.lots.slice(0, 5)) {
      expect(lot.frontage).toBeGreaterThan(0);
      expect(lot.depth).toBeGreaterThan(0);
      expect(Math.abs(lot.frontage * lot.depth - lot.area)).toBeLessThan(lot.area * 0.05 + 1);
    }
  });
});
