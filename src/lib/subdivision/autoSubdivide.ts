/**
 * Auto-Subdivision Engine
 * Takes a polygon and parameters, returns an array of lot polygons with area calculations.
 */

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
 * Clip a rectangle to the polygon boundary (simplified - returns rectangle if center is inside)
 */
function clipRectToPolygon(
  rect: [number, number][],
  polygon: [number, number][]
): [number, number][] | null {
  // Check if at least 3 corners are inside the polygon
  const insideCount = rect.filter(p => pointInPolygon(p, polygon)).length;
  if (insideCount >= 3) return rect;
  return null;
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
    const rows = Math.floor((secondaryLength / 2 - startOffset) / lotDepth);

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
            lots.push({
              id: lotId++,
              polygon: clipped,
              area,
              frontage: lotFrontage,
              depth: lotDepth,
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
