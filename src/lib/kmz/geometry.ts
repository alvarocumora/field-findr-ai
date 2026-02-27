// Geometry utility functions for KMZ parsing
// Enhanced with turf.js for accurate calculations

import * as turf from '@turf/turf';

// Calculate polygon area using turf.js (accurate geodesic calculation)
export const calculatePolygonArea = (coords: [number, number][]): number => {
  if (coords.length < 3) return 0;

  try {
    // Ensure polygon is closed
    const closed = closePolygon(coords);
    // turf expects [lng, lat] which is what we already have
    const polygon = turf.polygon([closed]);
    return turf.area(polygon); // Returns area in square meters
  } catch {
    // Fallback to shoelace if turf fails
    return calculatePolygonAreaShoelace(coords);
  }
};

// Shoelace formula fallback
const calculatePolygonAreaShoelace = (coords: [number, number][]): number => {
  if (coords.length < 3) return 0;

  const avgLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
  const latToMeters = 111320;
  const lngToMeters = 111320 * Math.cos(avgLat * Math.PI / 180);

  const metersCoords = coords.map(([lng, lat]) => [lng * lngToMeters, lat * latToMeters]);

  let area = 0;
  for (let i = 0; i < metersCoords.length; i++) {
    const j = (i + 1) % metersCoords.length;
    area += metersCoords[i][0] * metersCoords[j][1];
    area -= metersCoords[j][0] * metersCoords[i][1];
  }

  return Math.abs(area / 2);
};

// Distance between two points in degrees
export const distance = (p1: [number, number], p2: [number, number]): number => {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy);
};

// Parse coordinates from KML string format
export const parseCoordinates = (coordString: string): [number, number][] => {
  if (!coordString) return [];

  return coordString
    .trim()
    .split(/\s+/)
    .map(coord => {
      const parts = coord.split(',');
      if (parts.length >= 2) {
        const lng = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        if (!isNaN(lng) && !isNaN(lat) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          return [lng, lat] as [number, number];
        }
      }
      return null;
    })
    .filter((c): c is [number, number] => c !== null);
};

// Calculate centroid of a polygon
export const calculateCentroid = (coords: [number, number][]): [number, number] => {
  if (coords.length === 0) return [0, 0];
  const sumLng = coords.reduce((sum, c) => sum + c[0], 0);
  const sumLat = coords.reduce((sum, c) => sum + c[1], 0);
  return [sumLng / coords.length, sumLat / coords.length];
};

// Check if a polygon is closed
export const isClosedPolygon = (coords: [number, number][]): boolean => {
  if (coords.length < 3) return false;
  const first = coords[0];
  const last = coords[coords.length - 1];
  return distance(first, last) < 0.0000001;
};

// Close a polygon if it's not already closed
export const closePolygon = (coords: [number, number][]): [number, number][] => {
  if (coords.length < 3) return coords;
  if (!isClosedPolygon(coords)) {
    return [...coords, coords[0]];
  }
  return coords;
};

// Check if a LineString is almost closed (within tolerance)
export const isAlmostClosed = (coords: [number, number][], tolerance = 0.0001): boolean => {
  if (coords.length < 3) return false;
  const d = distance(coords[0], coords[coords.length - 1]);
  return d < tolerance && d > 0;
};

// Generate a rectangular polygon from a center point and area
export const generateRectFromPoint = (
  center: [number, number],
  areaM2: number
): [number, number][] => {
  const [lng, lat] = center;
  const sideLength = Math.sqrt(areaM2);
  const latOffset = (sideLength / 2) / 111320;
  const lngOffset = (sideLength / 2) / (111320 * Math.cos(lat * Math.PI / 180));

  return [
    [lng - lngOffset, lat + latOffset],
    [lng + lngOffset, lat + latOffset],
    [lng + lngOffset, lat - latOffset],
    [lng - lngOffset, lat - latOffset],
    [lng - lngOffset, lat + latOffset],
  ];
};

// Coordinate precision helpers
const COORD_PRECISION = 7;

export const truncateCoord = (coord: [number, number]): [number, number] => [
  Math.round(coord[0] * Math.pow(10, COORD_PRECISION)) / Math.pow(10, COORD_PRECISION),
  Math.round(coord[1] * Math.pow(10, COORD_PRECISION)) / Math.pow(10, COORD_PRECISION),
];

export const coordKey = (coord: [number, number]): string => {
  const t = truncateCoord(coord);
  return `${t[0]},${t[1]}`;
};
