import { describe, it, expect } from 'vitest';
import { tourLotState, tourPolygonCenter } from './tourLotMarkers';

describe('panorama lot state', () => {
  it('keeps sold lots sold', () => expect(tourLotState('sold').label).toBe('Vendido'));
  it('keeps reserved lots reserved', () => expect(tourLotState('reserved').label).toBe('Reservado'));
  it('keeps available lots available', () => expect(tourLotState('available').label).toBe('Disponible'));
  it('does not invent availability for unknown states', () => expect(tourLotState(null).label).toBe('Consultar'));
  it('centers a label across the panorama seam', () => {
    const center = tourPolygonCenter([{ yaw: 3.1, pitch: -0.4 }, { yaw: -3.1, pitch: -0.6 }]);
    expect(Math.abs(center?.yaw ?? 0)).toBeCloseTo(Math.PI);
    expect(center?.pitch).toBeCloseTo(-0.5);
  });
});