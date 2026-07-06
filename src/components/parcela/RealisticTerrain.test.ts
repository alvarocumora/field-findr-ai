import { describe, it, expect } from 'vitest';
import { bboxForPlane, staticSatelliteUrl } from './RealisticTerrain';

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
    // bbox is [minLng,minLat,maxLng,maxLat]
    expect(url).toMatch(/static\/\[-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+\]\/1024x1024@2x/);
  });
});
