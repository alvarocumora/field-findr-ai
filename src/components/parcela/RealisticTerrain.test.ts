import { describe, it, expect } from 'vitest';
import { bboxForPlane, staticSatelliteUrl, normalizeElevations, MAX_RELIEF_M, cropResampleElevation, sampleGridBilinear } from './RealisticTerrain';

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
