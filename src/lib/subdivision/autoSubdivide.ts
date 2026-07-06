/**
 * Auto-Subdivision Engine
 * Takes a polygon and parameters, returns an array of lot polygons with area calculations.
 */
import { polygon as turfPolygon, intersect, featureCollection } from '@turf/turf';

export interface SubdivisionParams {
  /** Minimum lot area in m² */
  minLotArea: number;
  /** Percentage of total area for roads (0-100) */
  roadPercentage: number;
  /** Percentage of total area for green spaces (0-100) */
  greenPercentage: number;
  /** Minimum lot frontage in meters */
  minFrontage: number;
  /** Road width in meters */
  roadWidth: number;
  /** Target number of lots (optional - if set, adjusts lot size) */
  targetLots?: number;
}

export interface SubdivisionResult {
  lots: LotPolygon[];
  roads: RoadPolygon[];
  greenAreas: GreenArea[];
  stats: SubdivisionStats;
}

export interface LotPolygon {
  id: number;
  polygon: [number, number][]; // [x, y] in local meters
  area: number;
  frontage: number;
  depth: number;
}

export interface RoadPolygon {
  id: string;
  polygon: [number, number][];
  area: number;
  type: 'primary' | 'secondary';
}

export interface GreenArea {
  id: string;
  polygon: [number, number][];
  area: number;
}

export interface SubdivisionStats {
  totalArea: number;
  usableArea: number;
  roadArea: number;
  greenArea: number;
  totalLots: number;
  avgLotArea: number;
  minLotArea: number;
  maxLotArea: number;
  efficiency: number; // usable % of total
}

/**
 * Calculate polygon area using Shoelace formula
 */
function polygonArea(points: [number, number][]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i][0] * points[j][1];
    area -= points[j][0] * points[i][1];
  }
  return Math.abs(area) / 2;
}

/**
 * Get bounding box of polygon
 */
function getBounds(points: [number, number][]): {
  minX: number; maxX: number; minY: number; maxY: number; width: number; height: number;
} {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Check if a point is inside a polygon (ray casting)
 */
function pointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  let inside = false;
  const [px, py] = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Clip a rectangle to the polygon boundary via a real polygon intersection
 * (turf). Coordinates are local planar meters, which turf treats as a
 * cartesian plane — exactly what we want for a site-level layout. Returns the
 * clipped ring (following the parcel edge for boundary lots) or null when the
 * rectangle lies entirely outside. Falls back to the ray-cast heuristic if the
 * intersection fails for degenerate input.
 */
function clipRectToPolygon(
  rect: [number, number][],
  polygon: [number, number][]
): [number, number][] | null {
  const closeRing = (r: [number, number][]): [number, number][] => {
    const first = r[0];
    const last = r[r.length - 1];
    return first[0] === last[0] && first[1] === last[1] ? r : [...r, first];
  };

  try {
    const clipped = intersect(
      featureCollection([
        turfPolygon([closeRing(rect)]),
        turfPolygon([closeRing(polygon)]),
      ])
    );
    if (!clipped) return null;

    const geom = clipped.geometry;
    // Take the largest ring when the intersection is a MultiPolygon.
    let ring: number[][];
    if (geom.type === 'MultiPolygon') {
      let best: number[][] = [];
      let bestArea = 0;
      for (const poly of geom.coordinates) {
        const outer = poly[0] as [number, number][];
        const a = polygonArea(outer);
        if (a > bestArea) { bestArea = a; best = outer; }
      }
      ring = best;
    } else {
      ring = geom.coordinates[0];
    }

    // Drop the duplicate closing vertex turf adds.
    const out = ring.map((p) => [p[0], p[1]] as [number, number]);
    if (out.length > 1 && out[0][0] === out[out.length - 1][0] && out[0][1] === out[out.length - 1][1]) {
      out.pop();
    }
    return out.length >= 3 ? out : null;
  } catch {
    // Degenerate geometry — fall back to the corner heuristic.
    const insideCount = rect.filter((p) => pointInPolygon(p, polygon)).length;
    return insideCount >= 3 ? rect : null;
  }
}

/**
 * Main subdivision algorithm - grid-based adaptive subdivision
 */
export function autoSubdivide(
  polygon: [number, number][],
  params: SubdivisionParams
): SubdivisionResult {
  const totalArea = polygonArea(polygon);
  const bounds = getBounds(polygon);
  
  // Calculate areas
  const roadAreaTarget = totalArea * (params.roadPercentage / 100);
  const greenAreaTarget = totalArea * (params.greenPercentage / 100);
  const usableArea = totalArea - roadAreaTarget - greenAreaTarget;

  // Determine lot dimensions
  let numLots = params.targetLots || Math.floor(usableArea / params.minLotArea);
  if (numLots < 1) numLots = 1;

  const lotArea = usableArea / numLots;
  const lotFrontage = Math.max(params.minFrontage, Math.sqrt(lotArea * 0.6));
  const lotDepth = lotArea / lotFrontage;

  // Determine primary axis (along longest dimension)
  const isHorizontal = bounds.width >= bounds.height;
  const primaryLength = isHorizontal ? bounds.width : bounds.height;
  const secondaryLength = isHorizontal ? bounds.height : bounds.width;

  // Road layout
  const roads: RoadPolygon[] = [];
  const halfRoad = params.roadWidth / 2;

  // Primary road along center
  const primaryRoadY = isHorizontal
    ? (bounds.minY + bounds.maxY) / 2
    : (bounds.minX + bounds.maxX) / 2;

  if (isHorizontal) {
    roads.push({
      id: 'road_primary',
      polygon: [
        [bounds.minX, primaryRoadY - halfRoad],
        [bounds.maxX, primaryRoadY - halfRoad],
        [bounds.maxX, primaryRoadY + halfRoad],
        [bounds.minX, primaryRoadY + halfRoad],
      ],
      area: bounds.width * params.roadWidth,
      type: 'primary',
    });
  } else {
    roads.push({
      id: 'road_primary',
      polygon: [
        [primaryRoadY - halfRoad, bounds.minY],
        [primaryRoadY + halfRoad, bounds.minY],
        [primaryRoadY + halfRoad, bounds.maxY],
        [primaryRoadY - halfRoad, bounds.maxY],
      ],
      area: bounds.height * params.roadWidth,
      type: 'primary',
    });
  }

  // Generate lot grid
  const lots: LotPolygon[] = [];
  let lotId = 1;

  // Place lots on both sides of the primary road
  const sides = isHorizontal ? [-1, 1] : [-1, 1];

  for (const side of sides) {
    const startOffset = halfRoad + 1; // 1m setback from road
    const cols = Math.floor(primaryLength / lotFrontage);
    // Try at least one row: when a full-depth lot overflows the available
    // depth, real clipping + the minimum-area filter keep only lots that still
    // qualify, instead of silently yielding zero lots on modest parcels.
    const rows = Math.max(1, Math.floor((secondaryLength / 2 - startOffset) / lotDepth));

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        let x1: number, y1: number, x2: number, y2: number;

        if (isHorizontal) {
          x1 = bounds.minX + col * lotFrontage;
          x2 = x1 + lotFrontage;
          if (side === 1) {
            y1 = primaryRoadY + startOffset + row * lotDepth;
            y2 = y1 + lotDepth;
          } else {
            y2 = primaryRoadY - startOffset - row * lotDepth;
            y1 = y2 - lotDepth;
          }
        } else {
          y1 = bounds.minY + col * lotFrontage;
          y2 = y1 + lotFrontage;
          if (side === 1) {
            x1 = primaryRoadY + startOffset + row * lotDepth;
            x2 = x1 + lotDepth;
          } else {
            x2 = primaryRoadY - startOffset - row * lotDepth;
            x1 = x2 - lotDepth;
          }
        }

        const rect: [number, number][] = [
          [x1, y1], [x2, y1], [x2, y2], [x1, y2],
        ];

        const clipped = clipRectToPolygon(rect, polygon);
        if (clipped) {
          const area = polygonArea(clipped);
          if (area >= params.minLotArea * 0.8) { // Allow 20% tolerance
            // Recompute frontage/depth from the actual clipped footprint —
            // boundary lots are no longer full rectangles.
            const cb = getBounds(clipped);
            const frontage = isHorizontal ? cb.width : cb.height;
            const depth = frontage > 0 ? area / frontage : lotDepth;
            lots.push({
              id: lotId++,
              polygon: clipped,
              area,
              frontage,
              depth,
            });
          }
        }

        if (params.targetLots && lots.length >= params.targetLots) break;
      }
      if (params.targetLots && lots.length >= params.targetLots) break;
    }
    if (params.targetLots && lots.length >= params.targetLots) break;
  }

  // Green areas - place in remaining spaces
  const greenAreas: GreenArea[] = [];
  if (greenAreaTarget > 0 && lots.length > 0) {
    // Place a green area at the entrance
    const gw = Math.sqrt(greenAreaTarget);
    const gh = greenAreaTarget / gw;
    greenAreas.push({
      id: 'green_1',
      polygon: [
        [bounds.minX + 1, bounds.minY + 1],
        [bounds.minX + 1 + gw, bounds.minY + 1],
        [bounds.minX + 1 + gw, bounds.minY + 1 + gh],
        [bounds.minX + 1, bounds.minY + 1 + gh],
      ],
      area: greenAreaTarget,
    });
  }

  // Calculate stats
  const lotAreas = lots.map(l => l.area);
  const stats: SubdivisionStats = {
    totalArea,
    usableArea: lotAreas.reduce((s, a) => s + a, 0),
    roadArea: roads.reduce((s, r) => s + r.area, 0),
    greenArea: greenAreas.reduce((s, g) => s + g.area, 0),
    totalLots: lots.length,
    avgLotArea: lotAreas.length > 0 ? lotAreas.reduce((s, a) => s + a, 0) / lotAreas.length : 0,
    minLotArea: lotAreas.length > 0 ? Math.min(...lotAreas) : 0,
    maxLotArea: lotAreas.length > 0 ? Math.max(...lotAreas) : 0,
    efficiency: totalArea > 0 ? (lotAreas.reduce((s, a) => s + a, 0) / totalArea) * 100 : 0,
  };

  return { lots, roads, greenAreas, stats };
}

/**
 * Convert local meter coordinates back to geo coordinates
 */
export function localToGeo(
  localPolygon: [number, number][],
  centerLng: number,
  centerLat: number
): [number, number][] {
  const metersPerDegLng = 111320 * Math.cos((centerLat * Math.PI) / 180);
  const metersPerDegLat = 110540;
  return localPolygon.map(([x, y]) => [
    centerLng + x / metersPerDegLng,
    centerLat + y / metersPerDegLat,
  ]);
}
