// Polygon Validator - validates and normalizes lot polygon shapes

import { calculatePolygonArea, closePolygon, distance } from './geometry';

export interface PolygonValidationResult {
  isValid: boolean;
  area: number;
  vertexCount: number;
  errors: string[];
  warnings: string[];
  normalized?: [number, number][];
}

export interface LotPolygonShape {
  coordinates: [number, number][];
  area: number;
  centroid: [number, number];
  isReasonable: boolean;
}

// Validate polygon has reasonable shape for a lot
export const validatePolygonShape = (
  coords: [number, number][],
  expectedAreaM2?: number
): PolygonValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum vertices
  if (coords.length < 3) {
    errors.push('El polígono debe tener al menos 3 vértices');
    return { isValid: false, area: 0, vertexCount: coords.length, errors, warnings };
  }

  // Check maximum vertices (lots shouldn't have 100+ vertices)
  if (coords.length > 100) {
    warnings.push(`El polígono tiene demasiados vértices (${coords.length}). Considere simplificarlo.`);
  }

  // Close polygon if needed
  const closed = closePolygon(coords);

  // Calculate area
  const area = calculatePolygonArea(closed);

  // Check minimum area (10 m² minimum)
  if (area < 10) {
    errors.push(`El área calculada (${area.toFixed(1)} m²) es demasiado pequeña`);
  }

  // Check maximum area (1 km² maximum for a lot)
  if (area > 1000000) {
    errors.push(`El área calculada (${area.toFixed(0)} m²) es demasiado grande para un lote`);
  }

  // Check if area matches expected (if provided)
  if (expectedAreaM2 && expectedAreaM2 > 0) {
    const tolerance = 0.5; // 50% tolerance
    const ratio = area / expectedAreaM2;
    if (ratio < 1 - tolerance || ratio > 1 + tolerance) {
      warnings.push(
        `El área calculada (${area.toFixed(0)} m²) difiere significativamente del área esperada (${expectedAreaM2} m²)`
      );
    }
  }

  // Check for self-intersections (simplified check)
  const hasSelfIntersection = checkSelfIntersection(closed);
  if (hasSelfIntersection) {
    errors.push('El polígono parece tener auto-intersecciones');
  }

  return {
    isValid: errors.length === 0,
    area: Math.round(area),
    vertexCount: closed.length - 1, // Exclude closing point
    errors,
    warnings,
    normalized: closed,
  };
};

// Check if polygon self-intersects (simplified algorithm)
const checkSelfIntersection = (coords: [number, number][]): boolean => {
  if (coords.length < 4) return false;

  // Check each pair of non-adjacent edges
  for (let i = 0; i < coords.length - 1; i++) {
    for (let j = i + 2; j < coords.length - 1; j++) {
      // Skip if edges are adjacent
      if (j === i + 1 || (i === 0 && j === coords.length - 2)) continue;

      if (
        segmentsIntersect(
          coords[i],
          coords[i + 1],
          coords[j],
          coords[j + 1]
        )
      ) {
        return true;
      }
    }
  }
  return false;
};

// Check if two line segments intersect
const segmentsIntersect = (
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number]
): boolean => {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  return false;
};

const direction = (
  p1: [number, number],
  p2: [number, number],
  p3: [number, number]
): number => {
  return (p3[0] - p1[0]) * (p2[1] - p1[1]) - (p2[0] - p1[0]) * (p3[1] - p1[1]);
};

// Calculate centroid of polygon
export const calculateCentroid = (coords: [number, number][]): [number, number] => {
  if (coords.length === 0) return [0, 0];
  
  let sumLng = 0;
  let sumLat = 0;
  const n = coords.length;

  for (const [lng, lat] of coords) {
    sumLng += lng;
    sumLat += lat;
  }

  return [sumLng / n, sumLat / n];
};

// Simplify polygon by removing redundant vertices
export const simplifyPolygon = (
  coords: [number, number][],
  tolerance: number = 0.00001
): [number, number][] => {
  if (coords.length <= 4) return coords;

  const result: [number, number][] = [coords[0]];

  for (let i = 1; i < coords.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = coords[i];
    const next = coords[i + 1];

    // Check if point is significant (not collinear with neighbors)
    const dist = pointToLineDistance(curr, prev, next);
    if (dist > tolerance) {
      result.push(curr);
    }
  }

  // Close polygon
  if (coords.length > 0) {
    result.push(coords[coords.length - 1]);
  }

  return result;
};

// Distance from point to line
const pointToLineDistance = (
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number => {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) return distance(point, lineStart);

  let param = dot / lenSq;
  param = Math.max(0, Math.min(1, param));

  const xx = x1 + param * C;
  const yy = y1 + param * D;

  return distance(point, [xx, yy]);
};

// Check if polygon shape is reasonable for a lot
export const isReasonableLotShape = (
  coords: [number, number][],
  minArea: number = 100,
  maxArea: number = 100000,
  maxVertices: number = 50
): { reasonable: boolean; reason?: string } => {
  if (coords.length < 3) {
    return { reasonable: false, reason: 'Menos de 3 vértices' };
  }

  if (coords.length > maxVertices) {
    return { reasonable: false, reason: `Demasiados vértices (${coords.length} > ${maxVertices})` };
  }

  const area = calculatePolygonArea(coords);

  if (area < minArea) {
    return { reasonable: false, reason: `Área muy pequeña (${area.toFixed(0)} m² < ${minArea} m²)` };
  }

  if (area > maxArea) {
    return { reasonable: false, reason: `Área muy grande (${area.toFixed(0)} m² > ${maxArea} m²)` };
  }

  // Check aspect ratio (shouldn't be too elongated)
  const bounds = getBounds(coords);
  const width = bounds.maxLng - bounds.minLng;
  const height = bounds.maxLat - bounds.minLat;
  const aspectRatio = Math.max(width, height) / Math.min(width, height);

  if (aspectRatio > 20) {
    return { reasonable: false, reason: `Forma demasiado alargada (ratio ${aspectRatio.toFixed(1)})` };
  }

  return { reasonable: true };
};

// Get bounding box of polygon
const getBounds = (coords: [number, number][]) => {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  return { minLng, maxLng, minLat, maxLat };
};

// Format area for display
export const formatPolygonArea = (areaM2: number): string => {
  if (areaM2 >= 10000) {
    const hectares = areaM2 / 10000;
    return `${hectares.toFixed(2)} há`;
  }
  return `${areaM2.toLocaleString()} m²`;
};
