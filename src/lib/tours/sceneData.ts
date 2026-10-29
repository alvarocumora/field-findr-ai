import type { TourHotspot, PolygonOverlay } from '@/hooks/useTourScenes';
import { jsonObject } from '@/lib/jsonData';

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export function parseTourHotspots(value: unknown): TourHotspot[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is TourHotspot => {
    const row = jsonObject(item);
    return typeof row.id === 'string' && finite(row.yaw) && finite(row.pitch) &&
      typeof row.target_scene_id === 'string' && typeof row.tooltip === 'string';
  });
}

export function parsePolygonOverlays(value: unknown): PolygonOverlay[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is PolygonOverlay => {
    const row = jsonObject(item);
    return typeof row.id === 'string' && typeof row.name === 'string' &&
      typeof row.color === 'string' && finite(row.opacity) &&
      (row.lot_id === undefined || typeof row.lot_id === 'string') &&
      Array.isArray(row.points) && row.points.every(point => {
        const coordinates = jsonObject(point);
        return finite(coordinates.yaw) && finite(coordinates.pitch);
      });
  });
}
