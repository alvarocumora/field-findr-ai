import { describe, expect, it } from 'vitest';
import { parseTourHotspots, parsePolygonOverlays } from './sceneData';

describe('persisted angular tour annotations', () => {
  it('keeps valid scene links and rejects malformed positions', () => {
    const hotspot = { id: 'h1', yaw: 1, pitch: 0.2, target_scene_id: 'scene-2', tooltip: 'Siguiente' };
    expect(parseTourHotspots([hotspot, null, {}, { ...hotspot, yaw: NaN }, { ...hotspot, pitch: '0' }])).toEqual([hotspot]);
    expect(parseTourHotspots({})).toEqual([]);
  });
  it('preserves live lot IDs and angular points without interpreting them as geography', () => {
    const overlay = { id: 'o1', name: 'Lote', lot_id: 'live-lot', color: 'green', opacity: 0.4, points: [{ yaw: 1, pitch: 0.1 }] };
    expect(parsePolygonOverlays([overlay, { ...overlay, points: [null] }, { ...overlay, opacity: Infinity }, { ...overlay, lot_id: 7 }])).toEqual([overlay]);
    expect(parsePolygonOverlays(null)).toEqual([]);
  });
});
