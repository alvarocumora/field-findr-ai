// KMZ Parser - Main entry point
// Enhanced with @mapbox/togeojson + @turf/turf for robust polygon detection

import JSZip from 'jszip';
import * as toGeoJSON from '@mapbox/togeojson';
import * as turf from '@turf/turf';
import type { Feature, Geometry, GeoJsonProperties, LineString, Polygon, Position } from 'geojson';
import { KMLPlacemark, ParsedKMZ, LotInfo } from './types';
import { calculatePolygonArea, closePolygon, distance, isAlmostClosed, truncateCoord, coordKey } from './geometry';
import { parseKML as parseKMLDirect } from './kmlParser';
import { generatePolygonsFromPoints } from './polygonBuilder';
import { buildPolygonsAdvanced, validatePolygon } from './advancedPolygonBuilder';
import { buildPolygonsFromMixedGeometry, convertLineStringsToPolygons } from './lineStringToPolygon';
import {
  validatePolygonShape,
  calculateCentroid as calcPolygonCentroid,
  simplifyPolygon,
  isReasonableLotShape,
  formatPolygonArea,
} from './polygonValidator';

// Re-export types and utilities
export type { KMLPlacemark, ParsedKMZ, LotInfo };
export {
  calculatePolygonArea,
  generatePolygonsFromPoints,
  buildPolygonsAdvanced,
  validatePolygon,
  buildPolygonsFromMixedGeometry,
  convertLineStringsToPolygons,
  validatePolygonShape,
  calcPolygonCentroid,
  simplifyPolygon,
  isReasonableLotShape,
  formatPolygonArea,
};

// ============= ENHANCED PARSING WITH toGeoJSON =============

/**
 * Parse KML content using @mapbox/togeojson for better geometry extraction
 */
const parseKMLWithToGeoJSON = (kmlContent: string) => {
  const parser = new DOMParser();
  const kmlDoc = parser.parseFromString(kmlContent, 'text/xml');

  const parseError = kmlDoc.querySelector('parsererror');
  if (parseError) {
    console.warn('⚠️ KML parse error, falling back to direct parser');
    return null;
  }

  try {
    const geojson = toGeoJSON.kml(kmlDoc);
    console.log(`✅ toGeoJSON extracted ${geojson.features.length} features`);
    return geojson;
  } catch (err) {
    console.warn('⚠️ toGeoJSON failed:', err);
    return null;
  }
};

/**
 * Flatten GeometryCollections into individual features
 */
const flattenGeometryCollections = (features: Feature<Geometry, GeoJsonProperties>[]): Feature<Geometry, GeoJsonProperties>[] => {
  const flattened: Feature<Geometry, GeoJsonProperties>[] = [];

  for (const feature of features) {
    if (!feature.geometry) continue;

    if (feature.geometry.type === 'GeometryCollection') {
      for (const geom of (feature.geometry as any).geometries) {
        flattened.push({
          type: 'Feature',
          properties: { ...feature.properties },
          geometry: geom,
        });
      }
    } else {
      flattened.push(feature);
    }
  }

  return flattened;
};

/**
 * Convert a closed or almost-closed LineString to a Polygon feature
 */
const lineStringToPolygon = (geometry: LineString): Polygon | null => {
  let coords = [...geometry.coordinates].map(c => truncateCoord(c as [number, number]));
  if (coords.length < 3) return null;

  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coords.push([...first] as [number, number]);
  }

  return {
    type: 'Polygon',
    coordinates: [coords],
  };
};

/**
 * Snap line endpoints to a vertex grid to create a connected network
 */
const snapLinesToNetwork = (lineFeatures: Feature<LineString, GeoJsonProperties>[]): Feature<LineString, GeoJsonProperties>[] => {
  if (lineFeatures.length === 0) return [];

  const vertexGrid = new Map<string, Position>();

  for (const feature of lineFeatures) {
    if (!feature.geometry || feature.geometry.coordinates.length < 2) continue;
    for (const coord of feature.geometry.coordinates) {
      const key = coordKey(coord as [number, number]);
      if (!vertexGrid.has(key)) {
        vertexGrid.set(key, truncateCoord(coord as [number, number]));
      }
    }
  }

  return lineFeatures.map(f => {
    if (!f.geometry) return f;
    const newCoords = f.geometry.coordinates.map(coord => {
      const key = coordKey(coord as [number, number]);
      return vertexGrid.get(key) || truncateCoord(coord as [number, number]);
    });
    return { ...f, geometry: { ...f.geometry, coordinates: newCoords } };
  });
};

/**
 * Strategy: Close almost-closed LineStrings and convert to polygons
 */
const closeAlmostClosedLines = (lineFeatures: Feature<LineString, GeoJsonProperties>[]): Feature<Polygon, GeoJsonProperties>[] => {
  const polygons: Feature<Polygon, GeoJsonProperties>[] = [];

  for (let i = 0; i < lineFeatures.length; i++) {
    const feature = lineFeatures[i];
    if (!feature.geometry || feature.geometry.type !== 'LineString') continue;

    const coords = feature.geometry.coordinates;
    if (coords.length < 4) continue;

    const first = coords[0];
    const last = coords[coords.length - 1];
    const d = Math.sqrt(Math.pow(first[0] - last[0], 2) + Math.pow(first[1] - last[1], 2));

    // Check if closed or almost closed (within ~11m)
    if (d < 0.0001) {
      const polygon = lineStringToPolygon(feature.geometry);
      if (polygon) {
        try {
          const area = turf.area({ type: 'Feature', geometry: polygon, properties: {} });
          if (area > 1) {
            polygons.push({
              type: 'Feature',
              geometry: polygon,
              properties: {
                ...feature.properties,
                reconstructedFrom: 'closedLineString',
                lotNumber: feature.properties?.name || `Lote ${i + 1}`,
              },
            });
          }
        } catch {
          // Skip invalid geometries
        }
      }
    }
  }

  console.log(`✅ Closed ${polygons.length} almost-closed LineStrings into polygons`);
  return polygons;
};

/**
 * Strategy: turf.polygonize to create polygons from a line network
 */
const polygonizeLines = (lineFeatures: Feature<LineString, GeoJsonProperties>[]): Feature<Polygon, GeoJsonProperties>[] => {
  try {
    console.log(`🔧 Polygonizing ${lineFeatures.length} lines...`);
    const snapped = snapLinesToNetwork(lineFeatures);
    const lineCollection = turf.featureCollection(snapped);
    const polygonized = turf.polygonize(lineCollection as any);

    if (polygonized && polygonized.features && polygonized.features.length > 0) {
      const validPolygons = polygonized.features
        .filter(f => {
          try {
            const area = turf.area(f);
            return area > 10; // At least 10m²
          } catch {
            return false;
          }
        })
        .map((f, i) => ({
          ...f,
          properties: {
            ...f.properties,
            reconstructedFrom: 'polygonize',
            lotNumber: `Lote ${i + 1}`,
          },
        })) as Feature<Polygon, GeoJsonProperties>[];

      console.log(`✅ Polygonize created ${validPolygons.length} polygons`);
      return validPolygons;
    }
  } catch (err) {
    console.warn('⚠️ Polygonize failed:', err);
  }

  return [];
};

/**
 * Strategy: turf.lineToPolygon for individual lines
 */
const tryLineToPolygon = (lineFeatures: Feature<LineString, GeoJsonProperties>[]): Feature<Polygon, GeoJsonProperties>[] => {
  const polygons: Feature<Polygon, GeoJsonProperties>[] = [];

  for (let i = 0; i < lineFeatures.length; i++) {
    const feature = lineFeatures[i];
    try {
      const polygon = turf.lineToPolygon(feature, { autoComplete: true });
      if (polygon && polygon.geometry?.type === 'Polygon') {
        const area = turf.area(polygon);
        if (area > 1) {
          polygons.push({
            type: 'Feature',
            geometry: polygon.geometry,
            properties: {
              ...feature.properties,
              reconstructedFrom: 'lineToPolygon',
              lotNumber: feature.properties?.name || `Lote ${i + 1}`,
            },
          });
        }
      }
    } catch {
      // Skip lines that can't be converted
    }
  }

  console.log(`✅ lineToPolygon converted ${polygons.length} lines`);
  return polygons;
};

/**
 * Extract lot number from name/description
 */
const extractLotNumber = (name: string, description?: string): string | null => {
  const patterns = [/Lote[:\s]*(\d+)/i, /Lot[:\s]*(\d+)/i, /^(\d+)$/, /^\s*(\d+)\s*$/];

  for (const pattern of patterns) {
    const match = name.match(pattern) || description?.match(pattern);
    if (match) return `Lote ${match[1]}`;
  }

  if (name && name.toLowerCase().includes('lote')) return name;
  return null;
};

/**
 * Convert GeoJSON polygon features to KMLPlacemark format (for backwards compatibility)
 */
const geojsonToPlacemarks = (features: Feature<Polygon, GeoJsonProperties>[]): KMLPlacemark[] => {
  return features.map((f, i) => {
    const coords = f.geometry.coordinates[0].map(c => [c[0], c[1]] as [number, number]);
    const name = f.properties?.lotNumber || f.properties?.name || `Lote ${i + 1}`;
    let area = 0;
    try {
      area = Math.round(turf.area(f));
    } catch {
      area = calculatePolygonArea(coords);
    }

    return {
      name,
      description: f.properties?.description,
      coordinates: coords,
      area,
      isPolygon: true,
      originalType: 'Polygon' as const,
    };
  });
};

// Calculate bounds and center from placemarks
const calculateBoundsAndCenter = (placemarks: KMLPlacemark[]) => {
  let north = -90, south = 90, east = -180, west = 180;

  placemarks.forEach(p => {
    p.coordinates.forEach(([lng, lat]) => {
      if (lat > north) north = lat;
      if (lat < south) south = lat;
      if (lng > east) east = lng;
      if (lng < west) west = lng;
    });
  });

  return {
    bounds: { north, south, east, west },
    center: { lat: (north + south) / 2, lng: (east + west) / 2 },
  };
};

/**
 * Enhanced KMZ/KML parser - multi-strategy polygon detection
 */
export const parseKMZFile = async (file: File): Promise<ParsedKMZ> => {
  console.log('=== ENHANCED KMZ PARSER v4 ===');
  console.log('File name:', file.name, 'Size:', file.size);

  try {
    let kmlContent: string;

    if (file.name.toLowerCase().endsWith('.kmz')) {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const kmlFile = Object.keys(zip.files).find(name => name.toLowerCase().endsWith('.kml'));

      if (!kmlFile) {
        console.log('No KML found in archive, trying as plain text');
        kmlContent = await file.text();
      } else {
        kmlContent = await zip.files[kmlFile].async('string');
        console.log('Found KML:', kmlFile, 'Length:', kmlContent.length);
      }
    } else {
      kmlContent = await file.text();
    }

    // ===== STRATEGY 1: Parse with toGeoJSON =====
    const geojson = parseKMLWithToGeoJSON(kmlContent);

    if (geojson && geojson.features.length > 0) {
      const flatFeatures = flattenGeometryCollections(geojson.features);

      // Analyze geometry types
      const byType: Record<string, number> = {};
      flatFeatures.forEach(f => {
        const t = f.geometry?.type || 'null';
        byType[t] = (byType[t] || 0) + 1;
      });
      console.log('📊 Geometry breakdown:', byType);

      // Extract direct polygons and MultiPolygons
      const rawPolygonFeatures = flatFeatures.filter(
        f => f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'
      );

      // Handle MultiPolygons - split them into individual Polygons
      const expanded: Feature<Polygon, GeoJsonProperties>[] = [];
      for (const f of rawPolygonFeatures) {
        if (f.geometry!.type === 'MultiPolygon') {
          const mp = f.geometry as any;
          mp.coordinates.forEach((coords: Position[][], idx: number) => {
            expanded.push({
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: coords },
              properties: { ...f.properties, name: `${f.properties?.name || 'Poly'} (${idx + 1})` },
            });
          });
        } else if (f.geometry!.type === 'Polygon') {
          expanded.push(f as Feature<Polygon, GeoJsonProperties>);
        }
      }
      let polygonFeatures = expanded;

      let reconstructionMethod = 'direct';

      // If no direct polygons, try reconstruction from LineStrings
      if (polygonFeatures.length === 0) {
        const lineFeatures = flatFeatures.filter(
          f => f.geometry?.type === 'LineString'
        ) as Feature<LineString, GeoJsonProperties>[];

        console.log(`⚠️ No direct polygons. ${lineFeatures.length} LineStrings found. Trying reconstruction...`);

        // Strategy 2: Close almost-closed LineStrings
        polygonFeatures = closeAlmostClosedLines(lineFeatures);
        if (polygonFeatures.length > 0) {
          reconstructionMethod = 'closedLineString';
        }

        // Strategy 3: turf.polygonize (best for line networks forming lot grids)
        if (polygonFeatures.length === 0 && lineFeatures.length > 3) {
          polygonFeatures = polygonizeLines(lineFeatures);
          if (polygonFeatures.length > 0) {
            reconstructionMethod = 'polygonize';
          }
        }

        // Strategy 4: turf.lineToPolygon (individual line conversion)
        if (polygonFeatures.length === 0 && lineFeatures.length > 0) {
          polygonFeatures = tryLineToPolygon(lineFeatures);
          if (polygonFeatures.length > 0) {
            reconstructionMethod = 'lineToPolygon';
          }
        }
      }

      console.log(`✅ Reconstruction method: ${reconstructionMethod}, polygons: ${polygonFeatures.length}`);

      // Convert to placemarks (backwards compatible)
      if (polygonFeatures.length > 0) {
        const placemarks = geojsonToPlacemarks(polygonFeatures);
        const { bounds, center } = calculateBoundsAndCenter(placemarks);

        return {
          placemarks,
          bounds,
          center,
          metadata: {
            totalPlacemarks: placemarks.length,
            polygons: placemarks.filter(p => p.isPolygon).length,
            lineStrings: byType['LineString'] || 0,
            points: byType['Point'] || 0,
          },
        };
      }

      // If toGeoJSON found features but no polygons were reconstructed,
      // still return them as raw placemarks for the legacy system
      console.log('⚠️ toGeoJSON features found but no polygons reconstructed. Falling back to direct parser...');
    }

    // ===== FALLBACK: Use direct KML parser (legacy) =====
    console.log('🔄 Using direct KML parser as fallback...');
    const placemarks = parseKMLDirect(kmlContent);
    const { bounds, center } = calculateBoundsAndCenter(placemarks);

    const metadata = {
      totalPlacemarks: placemarks.length,
      polygons: placemarks.filter(p => p.isPolygon).length,
      lineStrings: placemarks.filter(p => p.originalType === 'LineString').length,
      points: placemarks.filter(p => p.originalType === 'Point').length,
    };

    console.log('=== KMZ PARSE COMPLETE (fallback) ===');
    console.log('Metadata:', metadata);

    return { placemarks, bounds, center, metadata };
  } catch (error) {
    console.error('Error parsing KMZ:', error);
    throw new Error(`Failed to parse KMZ file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Parse a plain KML file
export const parseKMLFile = async (file: File): Promise<ParsedKMZ> => {
  // Reuse enhanced parser
  return parseKMZFile(file);
};

// Parse KMZ from URL
export const parseKMZFromUrl = async (url: string): Promise<ParsedKMZ> => {
  console.log('=== PARSING KMZ FROM URL ===');

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch KMZ: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const ext = url.toLowerCase().endsWith('.kml') ? '.kml' : '.kmz';
    const file = new File([blob], `imported${ext}`, { type: 'application/vnd.google-earth.kmz' });

    return parseKMZFile(file);
  } catch (error) {
    console.error('Error fetching/parsing KMZ from URL:', error);
    throw error;
  }
};
