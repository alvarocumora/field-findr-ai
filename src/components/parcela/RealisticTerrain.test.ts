import { describe, it, expect } from 'vitest';
import { bboxForPlane, staticSatelliteUrl, esriSatelliteUrl, satelliteProviders, normalizeElevations, MAX_RELIEF_M, cropResampleElevation, sampleGridBilinear, projectRingToLocal, pointInRing, hashRand, subdivideRing, gridFillPositions, vegetationScoreGrid, scatterTrees, edgeLabels } from './RealisticTerrain';

describe('esriSatelliteUrl', () => {
  it('builds a key-less Esri World Imagery bbox export', () => {
    const url = esriSatelliteUrl(-34.99, -71.63, 200);
    expect(url).toContain('server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export');
    expect(url).toContain('bbox=');
    expect(url).toContain('bboxSR=4326');
    expect(url).toContain('f=image');
    expect(url).not.toContain('access_token'); // no API key
  });
});

describe('satelliteProviders (fallback chain)', () => {
  it('tries Mapbox first then Esri when a token is present', () => {
    const p = satelliteProviders(-34.99, -71.63, 200, 'pk.tok');
    expect(p.map((x) => x.name)).toEqual(['mapbox', 'esri']);
  });
  it('uses only Esri when there is no Mapbox token', () => {
    const p = satelliteProviders(-34.99, -71.63, 200, '');
    expect(p.map((x) => x.name)).toEqual(['esri']);
    expect(p[0].url).toContain('arcgisonline.com');
  });
});

describe('projectRingToLocal', () => {
  const cLng = -71.63, cLat = -34.99;

  it('places the shared centroid at the local origin', () => {
    const [p] = projectRingToLocal([[cLng, cLat]], cLng, cLat);
    expect(p[0]).toBeCloseTo(0, 6);
    expect(p[1]).toBeCloseTo(0, 6);
  });

  it('keeps neighbours offset from the main lot (east & north positive)', () => {
    // A point ~100m east and ~100m north of the centroid
    const mLng = 111320 * Math.cos((cLat * Math.PI) / 180);
    const ring = [[cLng + 100 / mLng, cLat + 100 / 110540]];
    const [p] = projectRingToLocal(ring, cLng, cLat);
    expect(p[0]).toBeCloseTo(100, 0);
    expect(p[1]).toBeCloseTo(100, 0);
  });
});

describe('pointInRing', () => {
  const square: [number, number][] = [[-10, -10], [10, -10], [10, 10], [-10, 10]];
  it('detects points inside and outside', () => {
    expect(pointInRing(0, 0, square)).toBe(true);
    expect(pointInRing(50, 0, square)).toBe(false);
  });
});

describe('hashRand', () => {
  it('is deterministic and within [0,1)', () => {
    expect(hashRand(7)).toBe(hashRand(7));
    for (let i = 0; i < 50; i++) {
      const v = hashRand(i);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('varies across seeds', () => {
    expect(hashRand(1)).not.toBe(hashRand(2));
  });
});

describe('sampleGridBilinear', () => {
  // 2×2 grid: [0,10 / 20,30]
  const grid = Float32Array.from([0, 10, 20, 30]);

  it('returns exact values at integer coordinates', () => {
    expect(sampleGridBilinear(grid, 2, 0, 0)).toBe(0);
    expect(sampleGridBilinear(grid, 2, 1, 1)).toBe(30);
  });

  it('interpolates linearly between samples (smooth, not stair-stepped)', () => {
    expect(sampleGridBilinear(grid, 2, 0.5, 0)).toBeCloseTo(5, 6);
    expect(sampleGridBilinear(grid, 2, 0.5, 0.5)).toBeCloseTo(15, 6);
  });

  it('clamps to the grid edge outside bounds', () => {
    expect(sampleGridBilinear(grid, 2, -5, -5)).toBe(0);
    expect(sampleGridBilinear(grid, 2, 99, 99)).toBe(30);
  });
});

describe('cropResampleElevation', () => {
  const GRID = 96;
  // A north-south elevation ramp across the whole grid: 0 → 950 m
  const ramp = new Float32Array(GRID * GRID);
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) ramp[r * GRID + c] = r * 10;

  const range = (a: Float32Array) => Math.max(...a) - Math.min(...a);

  it('a flat sub-region yields a flat parcel', () => {
    const flat = new Float32Array(GRID * GRID).fill(177);
    const out = cropResampleElevation(flat, GRID, GRID / 2, GRID / 2, 20, 16);
    expect(range(out)).toBe(0);
    expect(out[0]).toBe(177);
  });

  it('cropping to the parcel shows far less relief than the whole tile', () => {
    // Whole grid relief ≈ 950 m; a 10px-wide central crop should show ~1/9 of it
    const cropped = cropResampleElevation(ramp, GRID, GRID / 2, GRID / 2, 10, 32);
    expect(range(cropped)).toBeLessThan(range(ramp) / 5);
    expect(range(cropped)).toBeGreaterThan(0);
  });

  it('clamps sampling to grid bounds when the crop overflows an edge', () => {
    const out = cropResampleElevation(ramp, GRID, 2, 2, 40, 16);
    expect(out.every((v) => Number.isFinite(v))).toBe(true);
    expect(Math.min(...out)).toBeGreaterThanOrEqual(0);
  });
});

describe('normalizeElevations', () => {
  it('measures relief above the lowest point', () => {
    const { min, relief } = normalizeElevations([100, 110, 130]);
    expect(min).toBe(100);
    expect(Array.from(relief)).toEqual([0, 10, 30]);
  });

  it('clamps DEM spikes so the surface never explodes', () => {
    const { relief } = normalizeElevations([100, 100 + MAX_RELIEF_M + 5000, 105]);
    expect(relief[1]).toBe(MAX_RELIEF_M);
    expect(relief[2]).toBe(5);
  });

  it('treats non-finite samples as the base level (no NaN holes)', () => {
    const { relief } = normalizeElevations([50, NaN, 60]);
    expect(relief[1]).toBe(0);
    expect(relief.every((v) => Number.isFinite(v))).toBe(true);
  });
});

describe('bboxForPlane', () => {
  const lat = -34.99019;
  const lng = -71.63774;

  it('is centered on the parcel centroid', () => {
    const b = bboxForPlane(lat, lng, 200);
    expect((b.minLng + b.maxLng) / 2).toBeCloseTo(lng, 6);
    expect((b.minLat + b.maxLat) / 2).toBeCloseTo(lat, 6);
  });

  it('spans the requested size in meters (≈ within 1%)', () => {
    const size = 300;
    const b = bboxForPlane(lat, lng, size);
    const metersPerDegLat = 110540;
    const metersPerDegLng = 111320 * Math.cos((lat * Math.PI) / 180);
    const spanLatM = (b.maxLat - b.minLat) * metersPerDegLat;
    const spanLngM = (b.maxLng - b.minLng) * metersPerDegLng;
    expect(spanLatM).toBeCloseTo(size, 0);
    expect(spanLngM).toBeCloseTo(size, 0);
  });

  it('grows the bbox as the plane grows', () => {
    const small = bboxForPlane(lat, lng, 100);
    const big = bboxForPlane(lat, lng, 500);
    expect(big.maxLng - big.minLng).toBeGreaterThan(small.maxLng - small.minLng);
  });
});

describe('staticSatelliteUrl', () => {
  it('builds a Mapbox Static Images bbox request with the token and no logo/attribution', () => {
    const url = staticSatelliteUrl(-34.99, -71.63, 200, 'pk.test-token');
    expect(url).toContain('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/');
    expect(url).toContain('@2x');
    expect(url).toContain('access_token=pk.test-token');
    expect(url).toContain('attribution=false');
    expect(url).toContain('logo=false');
    // bbox is [minLng,minLat,maxLng,maxLat] with escaped brackets (%5B/%5D)
    // but LITERAL commas — Mapbox 404s if the commas are percent-encoded.
    expect(url).toMatch(/static\/%5B-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+%5D\/1024x1024@2x/);
    expect(url).not.toContain('%2C'); // commas must stay literal
  });

  it('escapes the bbox brackets so the image request is not rejected', () => {
    const url = staticSatelliteUrl(-34.99, -71.63, 200, 'pk.test-token');
    expect(url).toContain('%5B');
    expect(url).toContain('%5D');
    expect(url).not.toMatch(/static\/\[/); // no raw bracket
  });
});

describe('subdivideRing (drape fidelity)', () => {
  const square: [number, number][] = [[-40, -40], [40, -40], [40, 40], [-40, 40]];

  it('inserta puntos para que ningún tramo supere maxLen', () => {
    const ring = subdivideRing(square, 4);
    for (let i = 0; i < ring.length; i++) {
      const [ax, ay] = ring[i];
      const [bx, by] = ring[(i + 1) % ring.length];
      expect(Math.hypot(bx - ax, by - ay)).toBeLessThanOrEqual(4 + 1e-9);
    }
  });

  it('conserva los vértices originales', () => {
    const ring = subdivideRing(square, 7);
    for (const corner of square) {
      expect(ring.some(([x, y]) => x === corner[0] && y === corner[1])).toBe(true);
    }
  });

  it('con maxLen grande devuelve el anillo original', () => {
    expect(subdivideRing(square, 1000)).toEqual(square);
  });
});

describe('gridFillPositions (relleno que sigue el terreno)', () => {
  const square: [number, number][] = [[-30, -30], [30, -30], [30, 30], [-30, 30]];
  // rampa: altura = x + 100 (fácil de verificar por vértice)
  const ramp = (x: number, _y: number) => x + 100;

  it('cada vértice toma la altura real del terreno + lift', () => {
    const pos = gridFillPositions(square, 200, 128, ramp, 0.3);
    expect(pos).not.toBeNull();
    for (let i = 0; i < pos!.length; i += 3) {
      const [x, h] = [pos![i], pos![i + 1]];
      expect(h).toBeCloseTo(x + 100 + 0.3, 5);
    }
  });

  it('los triángulos quedan dentro del bbox del lote (con media celda de margen)', () => {
    const pos = gridFillPositions(square, 200, 128, ramp, 0.3);
    const cell = 200 / 127;
    for (let i = 0; i < pos!.length; i += 3) {
      expect(Math.abs(pos![i])).toBeLessThanOrEqual(30 + cell);
      expect(Math.abs(pos![i + 2])).toBeLessThanOrEqual(30 + cell);
    }
  });

  it('devuelve null para anillos degenerados', () => {
    expect(gridFillPositions([[0, 0], [1, 1]], 200, 128, ramp, 0.3)).toBeNull();
  });
});

describe('vegetationScoreGrid', () => {
  const px = (r: number, g: number, b: number) => [r, g, b, 255];

  it('bosque oscuro puntúa alto; suelo claro y agua puntúan ~0', () => {
    const rgba = new Uint8ClampedArray([
      ...px(40, 80, 35),    // bosque
      ...px(200, 185, 150), // suelo desnudo claro
      ...px(30, 60, 110),   // agua
      ...px(235, 235, 235), // techo / nube
    ]);
    const s = vegetationScoreGrid(rgba, 2);
    expect(s[0]).toBeGreaterThan(0.3);
    expect(s[1]).toBeLessThan(0.05);
    expect(s[2]).toBeLessThan(0.1);
    expect(s[3]).toBe(0);
  });

  it('siempre queda en [0,1]', () => {
    const rgba = new Uint8ClampedArray(16 * 4).map((_, i) => (i * 37) % 256);
    for (const v of vegetationScoreGrid(rgba, 4)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('scatterTrees', () => {
  const lot: [number, number][] = [[-20, -20], [20, -20], [20, 20], [-20, 20]];

  it('nunca pone árboles dentro del lote', () => {
    const allForest = new Float32Array(32 * 32).fill(1);
    const trees = scatterTrees(allForest, 32, 200, lot, 80);
    expect(trees.length).toBeGreaterThan(0);
    for (const t of trees) expect(pointInRing(t.x, t.y, lot)).toBe(false);
  });

  it('sin vegetación en la imagen no hay árboles', () => {
    const bare = new Float32Array(32 * 32).fill(0);
    expect(scatterTrees(bare, 32, 200, lot, 80)).toEqual([]);
  });

  it('solo planta donde la imagen muestra bosque (mitad oeste)', () => {
    const res = 32;
    const westForest = new Float32Array(res * res);
    for (let r = 0; r < res; r++) for (let c = 0; c < res / 2; c++) westForest[r * res + c] = 1;
    const trees = scatterTrees(westForest, res, 200, lot, 60);
    expect(trees.length).toBeGreaterThan(0);
    for (const t of trees) expect(t.x).toBeLessThan(0);
  });

  it('es determinista y respeta el máximo', () => {
    const forest = new Float32Array(32 * 32).fill(0.8);
    const a = scatterTrees(forest, 32, 200, lot, 25);
    const b = scatterTrees(forest, 32, 200, lot, 25);
    expect(a).toEqual(b);
    expect(a.length).toBeLessThanOrEqual(25);
  });
});

describe('edgeLabels', () => {
  it('una cota por lado con el largo en metros', () => {
    const rect: [number, number][] = [[0, 0], [90, 0], [90, 100], [0, 100]];
    const labels = edgeLabels(rect);
    expect(labels.map((l) => Math.round(l.lengthM))).toEqual([90, 100, 90, 100]);
    expect(labels[0].mid).toEqual([45, 0]);
  });

  it('omite lados más cortos que el mínimo', () => {
    const ring: [number, number][] = [[0, 0], [50, 0], [50, 4], [0, 4]];
    expect(edgeLabels(ring, 10).map((l) => Math.round(l.lengthM))).toEqual([50, 50]);
  });

  it('anillo degenerado → sin cotas', () => {
    expect(edgeLabels([[0, 0], [10, 0]])).toEqual([]);
  });
});
