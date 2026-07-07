import { describe, it, expect } from 'vitest';
import { generateParcelaDesign, polygonArea, pointInPolygon, mulberry32 } from './autoDesign';
import { OBJECT_CATALOG } from '@/components/parcela/useParcelaState';

const rect = (w: number, h: number): [number, number][] => [
  [-w / 2, -h / 2],
  [w / 2, -h / 2],
  [w / 2, h / 2],
  [-w / 2, h / 2],
];

describe('polygonArea', () => {
  it('computes the area of a square regardless of winding', () => {
    expect(polygonArea(rect(20, 20))).toBeCloseTo(400, 6);
    expect(polygonArea([...rect(20, 20)].reverse())).toBeCloseTo(400, 6);
  });
});

describe('pointInPolygon', () => {
  const sq = rect(10, 10);
  it('detects inside and outside points', () => {
    expect(pointInPolygon(0, 0, sq)).toBe(true);
    expect(pointInPolygon(4, 4, sq)).toBe(true);
    expect(pointInPolygon(50, 0, sq)).toBe(false);
    expect(pointInPolygon(0, 6, sq)).toBe(false);
  });
});

describe('mulberry32', () => {
  it('is deterministic and stays within [0,1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 20; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('generateParcelaDesign', () => {
  it('returns nothing for a degenerate ring', () => {
    expect(generateParcelaDesign([[0, 0], [1, 1]])).toEqual([]);
  });

  it('always includes a dwelling on a normal lot', () => {
    const design = generateParcelaDesign(rect(30, 40), { seed: 1 });
    const houseTypes = new Set(['casa_50', 'casa_80', 'casa_120', 'casa_moderna', 'tiny_house', 'cabana']);
    expect(design.some((o) => houseTypes.has(o.type))).toBe(true);
    expect(design.length).toBeGreaterThan(3);
  });

  it('places every object inside the lot boundary', () => {
    const ring = rect(30, 40);
    const design = generateParcelaDesign(ring, { seed: 3 });
    for (const o of design) {
      // world position is [x, y, -localY] → recover local (x, localY)
      const lx = o.position[0];
      const ly = -o.position[2];
      expect(pointInPolygon(lx, ly, ring), `${o.type} @ ${lx},${ly}`).toBe(true);
    }
  });

  it('does not place overlapping objects (respects bounding radii)', () => {
    const design = generateParcelaDesign(rect(40, 40), { seed: 7 });
    for (let i = 0; i < design.length; i++) {
      for (let j = i + 1; j < design.length; j++) {
        const a = design[i], b = design[j];
        const dx = a.position[0] - b.position[0];
        const dz = a.position[2] - b.position[2];
        const dist = Math.hypot(dx, dz);
        const ra = (OBJECT_CATALOG[a.type].boundingRadius ?? 1.5) * a.scale;
        const rb = (OBJECT_CATALOG[b.type].boundingRadius ?? 1.5) * b.scale;
        expect(dist).toBeGreaterThanOrEqual((ra + rb) * 0.6 - 1e-6);
      }
    }
  });

  it('is deterministic for a given seed and varies across seeds', () => {
    const a = generateParcelaDesign(rect(30, 40), { seed: 5 });
    const b = generateParcelaDesign(rect(30, 40), { seed: 5 });
    const c = generateParcelaDesign(rect(30, 40), { seed: 6 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c));
  });

  it('scales the program up with lot size (bigger lot → more objects)', () => {
    const small = generateParcelaDesign(rect(14, 14), { seed: 2 });
    const big = generateParcelaDesign(rect(60, 60), { seed: 2 });
    expect(big.length).toBeGreaterThan(small.length);
  });

  it('gives a tiny lot a compact dwelling', () => {
    const tiny = generateParcelaDesign(rect(9, 11), { seed: 1 });
    expect(tiny.some((o) => o.type === 'tiny_house' || o.type === 'casa_50')).toBe(true);
  });
});
