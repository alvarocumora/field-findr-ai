/**
 * Shared polygon normalization utilities for the 3D designer and map components.
 */

export interface PolygonBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  spanX: number;
  spanY: number;
  span: number;
}

export interface NormalizedPolygon {
  /** Raw [lng, lat] coordinates (no duplicate closing point) */
  coords: number[][];
  /** Centroid longitude */
  centroidLng: number;
  /** Centroid latitude */
  centroidLat: number;
  /** Local XZ coordinates in meters (centered on centroid) */
  localCoords: [number, number][];
  /** Bounds of localCoords in meters */
  bounds: PolygonBounds;
  /** Terrain plane size (2.5x the max dimension, min 60m) */
  terrainSize: number;
  /** Whether polygon data is valid and usable */
  valid: boolean;
}

/**
 * Normalize a polygon from various input formats:
 * - number[][] (array of [lng, lat])
 * - GeoJSON-style with closing duplicate removed
 */
export function normalizePolygon(
  polygon: unknown,
  fallbackLat?: number,
  fallbackLng?: number
): NormalizedPolygon {
  const empty: NormalizedPolygon = {
    coords: [],
    centroidLng: fallbackLng ?? -70.6,
    centroidLat: fallbackLat ?? -33.4,
    localCoords: [],
    bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, spanX: 0, spanY: 0, span: 0 },
    terrainSize: 60,
    valid: false,
  };

  if (!Array.isArray(polygon) || polygon.length < 3) return empty;
  if (!polygon.every((point): point is number[] =>
    Array.isArray(point) && point.length >= 2 &&
    typeof point[0] === 'number' && Number.isFinite(point[0]) &&
    typeof point[1] === 'number' && Number.isFinite(point[1])
  )) return empty;

  // Remove duplicate closing point
  let coords = [...polygon];
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (
    coords.length > 3 &&
    Math.abs(first[0] - last[0]) < 1e-9 &&
    Math.abs(first[1] - last[1]) < 1e-9
  ) {
    coords = coords.slice(0, -1);
  }

  if (coords.length < 3) return empty;

  // Centroid
  const centroidLng = coords.reduce((s, p) => s + p[0], 0) / coords.length;
  const centroidLat = coords.reduce((s, p) => s + p[1], 0) / coords.length;

  // To local meters
  const metersPerDegLng = 111320 * Math.cos((centroidLat * Math.PI) / 180);
  const metersPerDegLat = 110540;

  const localCoords: [number, number][] = coords.map(([lng, lat]) => [
    (lng - centroidLng) * metersPerDegLng,
    (lat - centroidLat) * metersPerDegLat,
  ]);

  // Bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of localCoords) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const span = Math.max(spanX, spanY);
  const terrainSize = Math.max(60, span * 2.5);

  return {
    coords,
    centroidLng,
    centroidLat,
    localCoords,
    bounds: { minX, maxX, minY, maxY, spanX, spanY, span },
    terrainSize,
    valid: true,
  };
}
