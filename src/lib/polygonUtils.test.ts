import { describe, it, expect } from 'vitest';
import { normalizePolygon } from './polygonUtils';

describe('normalizePolygon', () => {
  // ~90m × 77m quad near Teno (lng steps 0.001, lat steps 0.0007)
  const quad: number[][] = [
    [-71.160, -34.870],
    [-71.159, -34.870],
    [-71.159, -34.8693],
    [-71.160, -34.8693],
  ];

  it('marks a valid polygon and centres local coords on the centroid', () => {
    const n = normalizePolygon(quad);
    expect(n.valid).toBe(true);
    expect(n.coords).toHaveLength(4);
    const cx = n.localCoords.reduce((s, p) => s + p[0], 0) / n.localCoords.length;
    const cy = n.localCoords.reduce((s, p) => s + p[1], 0) / n.localCoords.length;
    expect(cx).toBeCloseTo(0, 6);
    expect(cy).toBeCloseTo(0, 6);
  });

  it('converts degrees to metres (~90m × 77m span)', () => {
    const n = normalizePolygon(quad);
    expect(n.bounds.spanX).toBeGreaterThan(80);
    expect(n.bounds.spanX).toBeLessThan(100);
    expect(n.bounds.spanY).toBeGreaterThan(70);
    expect(n.bounds.spanY).toBeLessThan(85);
  });

  it('drops the duplicate closing vertex', () => {
    const closed = [...quad, quad[0]];
    const n = normalizePolygon(closed);
    expect(n.coords).toHaveLength(4); // closing point removed
    expect(closed).toEqual([...quad, quad[0]]); // never mutate surveyed geometry
  });

  it('terrainSize is at least 60 m and scales with the polygon span', () => {
    const small = normalizePolygon([[-71.16, -34.87], [-71.1599, -34.87], [-71.1599, -34.8699]]);
    expect(small.terrainSize).toBe(60); // tiny polygon → floor
    const big = normalizePolygon(quad);
    expect(big.terrainSize).toBeGreaterThan(60);
    expect(big.terrainSize).toBeCloseTo(big.bounds.span * 2.5, 5);
  });

  it('falls back to invalid for degenerate input, using fallback centroid', () => {
    const n = normalizePolygon([[0, 0], [1, 1]], -34.9, -71.6);
    expect(n.valid).toBe(false);
    expect(n.localCoords).toHaveLength(0);
    expect(n.centroidLat).toBe(-34.9);
    expect(n.centroidLng).toBe(-71.6);
  });

  it('handles null/undefined polygon safely', () => {
    expect(normalizePolygon(null).valid).toBe(false);
    expect(normalizePolygon(undefined).valid).toBe(false);
  });

  it('rejects malformed JSON coordinates before geometry calculations', () => {
    for (const value of ['polygon', {}, [null, null, null], [[1], [2], [3]], [[1, 2], [2, 3], ['4', 5]], [[1, 2], [2, 3], [NaN, 4]], [[1, 2], [2, 3], [Infinity, 4]]]) {
      const result = normalizePolygon(value, -34, -71);
      expect(result.valid).toBe(false);
      expect(result.coords).toEqual([]);
      expect(result.centroidLat).toBe(-34);
    }
  });
});
