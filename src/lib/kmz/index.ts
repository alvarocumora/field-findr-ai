// KMZ Parser - Main entry point
// Enhanced with @mapbox/togeojson + @turf/turf for robust polygon detection
// v5: Improved with buffer/unbuffer hole extraction from Land Plotter Pro

import JSZip from 'jszip';
import * as toGeoJSON from '@mapbox/togeojson';
import * as turf from '@turf/turf';
import type { Feature, Geometry, GeoJsonProperties, LineString, Polygon, MultiLineString, Position } from 'geojson';
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

// ============= CONSTANTS =============
const COORD_PRECISION = 7;
const SNAP_TOLERANCE = 0.0001; // ~10m for endpoint snapping

// ============= COORDINATE HELPERS =============

function snapLinesToNetwork(lineFeatures: Feature<LineString, GeoJsonProperties>[]): Feature<LineString, GeoJsonProperties>[] {
  if (lineFeatures.length === 0) return [];

  // Build vertex grid
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

  // Snap all vertices to grid
  const snapped = lineFeatures.map(f => {
    if (!f.geometry) return f;
    const newCoords = f.geometry.coordinates.map(coord => {
      const key = coordKey(coord as [number, number]);
      return vertexGrid.get(key) || truncateCoord(coord as [number, number]);
    });
    return { ...f, geometry: { ...f.geometry, coordinates: newCoords } };
  });

  // Snap nearby endpoints together
  const endpoints: { coord: Position; featureIndex: number; isStart: boolean }[] = [];
  snapped.forEach((f, idx) => {
    if (!f.geometry || f.geometry.coordinates.length < 2) return;
    const coords = f.geometry.coordinates;
    endpoints.push({ coord: coords[0], featureIndex: idx, isStart: true });
    endpoints.push({ coord: coords[coords.length - 1], featureIndex: idx, isStart: false });
  });

  for (let i = 0; i < endpoints.length; i++) {
    for (let j = i + 1; j < endpoints.length; j++) {
      const p1 = endpoints[i].coord;
      const p2 = endpoints[j].coord;
      const dist = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));

      if (dist < SNAP_TOLERANCE && dist > 0) {
        const midpoint = truncateCoord([(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2] as [number, number]);

        const f1 = snapped[endpoints[i].featureIndex];
        const f2 = snapped[endpoints[j].featureIndex];

        if (endpoints[i].isStart) {
          f1.geometry.coordinates[0] = midpoint;
        } else {
          f1.geometry.coordinates[f1.geometry.coordinates.length - 1] = midpoint;
        }

        if (endpoints[j].isStart) {
          f2.geometry.coordinates[0] = midpoint;
        } else {
          f2.geometry.coordinates[f2.geometry.coordinates.length - 1] = midpoint;
        }

        endpoints[i].coord = midpoint;
        endpoints[j].coord = midpoint;
      }
    }
  }

  return snapped as Feature<LineString, GeoJsonProperties>[];
}

// ============= ENHANCED PARSING WITH toGeoJSON =============

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

const lineStringToPolygonGeom = (geometry: LineString): Polygon | null => {
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

// ============= STRATEGY: Close almost-closed LineStrings =============

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

    // Increased tolerance: ~11m for closing
    if (d < 0.0001) {
      const polygon = lineStringToPolygonGeom(feature.geometry);
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

// ============= STRATEGY: turf.polygonize =============

const polygonizeLines = (lineFeatures: Feature<LineString, GeoJsonProperties>[]): Feature<Polygon, GeoJsonProperties>[] => {
  try {
    console.log(`🔧 Polygonizing ${lineFeatures.length} lines...`);
    const snapped = snapLinesToNetwork(lineFeatures);
    const lineCollection = turf.featureCollection(snapped);

    try {
      const polygonized = turf.polygonize(lineCollection as any);

      if (polygonized && polygonized.features && polygonized.features.length > 0) {
        const validPolygons = polygonized.features
          .filter(f => {
            try {
              const area = turf.area(f);
              return area > 10;
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

        if (validPolygons.length > 0) {
          console.log(`✅ Polygonize created ${validPolygons.length} polygons`);
          return validPolygons;
        }
      }
    } catch (e) {
      console.log('⚠️ Direct polygonize failed, trying buffer/hole extraction...');
    }

    // Buffer/hole extraction technique (from Land Plotter Pro)
    return tryBufferHoleExtraction(snapped);
  } catch (err) {
    console.warn('⚠️ Polygonize failed:', err);
    return [];
  }
};

// ============= STRATEGY: Buffer/Unbuffer hole extraction =============

const tryBufferHoleExtraction = (lineFeatures: Feature<LineString, GeoJsonProperties>[]): Feature<Polygon, GeoJsonProperties>[] => {
  try {
    console.log('🔧 Trying buffer/hole extraction technique...');

    const allCoords: Position[][] = [];
    lineFeatures.forEach(f => {
      if (f.geometry && f.geometry.coordinates.length >= 2) {
        allCoords.push(f.geometry.coordinates);
      }
    });

    if (allCoords.length === 0) return [];

    const multiLine = turf.multiLineString(allCoords);

    // Try multiple buffer sizes (5m, 10m, 20m)
    const bufferSizes = [0.005, 0.01, 0.02]; // in kilometers

    for (const bufferSize of bufferSizes) {
      console.log(`🔧 Trying buffer of ${bufferSize * 1000}m...`);

      const buffered = turf.buffer(multiLine, bufferSize, { units: 'kilometers' });
      if (!buffered || !buffered.geometry) continue;

      const polygons: Feature<Polygon, GeoJsonProperties>[] = [];

      // Extract holes from the buffered polygon as lots
      const extractHoles = (coords: Position[][][]) => {
        for (const polyCoords of coords) {
          if (polyCoords.length > 1) {
            // Each hole (index > 0) is a potential lot
            for (let i = 1; i < polyCoords.length; i++) {
              const holeCoords = polyCoords[i];
              if (holeCoords.length < 4) continue;

              // Reverse to get clockwise orientation for polygon
              const reversedCoords = [...holeCoords].reverse();
              const holePoly: Feature<Polygon, GeoJsonProperties> = {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [reversedCoords]
                },
                properties: {
                  reconstructedFrom: 'buffer-holes',
                  lotNumber: `Lote ${polygons.length + 1}`
                }
              };

              // Validate area (at least 50m² to filter noise)
              try {
                const area = turf.area(holePoly);
                if (area > 50) {
                  polygons.push(holePoly);
                }
              } catch {
                // skip invalid
              }
            }
          }
        }
      };

      if (buffered.geometry.type === 'Polygon') {
        extractHoles([buffered.geometry.coordinates]);
      } else if (buffered.geometry.type === 'MultiPolygon') {
        extractHoles(buffered.geometry.coordinates);
      }

      if (polygons.length > 0) {
        console.log(`✅ Buffer ${bufferSize * 1000}m extracted ${polygons.length} polygons from holes`);
        return polygons;
      }
    }

    console.log('❌ No valid holes found with any buffer size');
    return [];
  } catch (err) {
    console.warn('⚠️ Buffer hole extraction failed:', err);
    return [];
  }
};

// ============= STRATEGY: turf.lineToPolygon =============

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

// ============= POST-PROCESSING =============

function cleanPolygon(polygon: Feature<Polygon, GeoJsonProperties>): Feature<Polygon, GeoJsonProperties> {
  if (!polygon.geometry) return polygon;

  const newCoords = polygon.geometry.coordinates.map(ring => {
    let cleaned = ring.map(c => truncateCoord(c as [number, number]));

    // Remove consecutive duplicates
    cleaned = cleaned.filter((coord, i) => {
      if (i === 0) return true;
      const prev = cleaned[i - 1];
      return coord[0] !== prev[0] || coord[1] !== prev[1];
    });

    // Ensure closed
    if (cleaned.length >= 3) {
      const first = cleaned[0];
      const last = cleaned[cleaned.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        cleaned.push([...first]);
      }
    }

    return cleaned;
  });

  return { ...polygon, geometry: { ...polygon.geometry, coordinates: newCoords } };
}

function postProcessPolygons(features: Feature<Polygon, GeoJsonProperties>[]): Feature<Polygon, GeoJsonProperties>[] {
  console.log('🔧 Post-processing polygons...');

  // Clean coordinates
  let processed = features.map(cleanPolygon);

  // Simplify slightly to remove micro-jitter
  processed = processed.map(feature => {
    if (!feature.geometry) return feature;
    try {
      const simplified = turf.simplify(feature, { tolerance: 0.000001, highQuality: true });
      if (simplified && simplified.geometry && simplified.geometry.type === 'Polygon') {
        return { ...feature, geometry: simplified.geometry };
      }
    } catch { /* keep original */ }
    return feature;
  });

  // Final clean
  processed = processed.map(cleanPolygon);

  console.log(`✅ Post-processing complete: ${processed.length} polygons`);
  return processed;
}

// ============= LOT NUMBER EXTRACTION =============

const extractLotNumber = (name: string, description?: string): string | null => {
  const patterns = [/Lote[:\s]*(\d+)/i, /Lot[:\s]*(\d+)/i, /^(\d+)$/, /^\s*(\d+)\s*$/];

  for (const pattern of patterns) {
    const match = name.match(pattern) || description?.match(pattern);
    if (match) return `Lote ${match[1]}`;
  }

  if (name && name.toLowerCase().includes('lote')) return name;
  return null;
};

// ============= CONVERT TO PLACEMARKS =============

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

// ============= DIRECT KML PARSING =============

function parseKMLDirectlyForPolygons(kmlContent: string): Feature<Polygon, GeoJsonProperties>[] {
  const parser = new DOMParser();
  const kmlDoc = parser.parseFromString(kmlContent, 'text/xml');
  const polygons: Feature<Polygon, GeoJsonProperties>[] = [];

  const placemarks = kmlDoc.getElementsByTagName('Placemark');
  console.log(`🔍 Direct KML: ${placemarks.length} Placemarks found`);

  for (let index = 0; index < placemarks.length; index++) {
    const placemark = placemarks[index];
    try {
      const nameEl = placemark.getElementsByTagName('name')[0];
      const descEl = placemark.getElementsByTagName('description')[0];
      const name = nameEl?.textContent?.trim() || '';
      const description = descEl?.textContent?.trim() || '';

      // Check for Polygon
      const polygonEl = placemark.getElementsByTagName('Polygon')[0];
      if (polygonEl) {
        let coordsText = '';

        const outerBoundaryEl = polygonEl.getElementsByTagName('outerBoundaryIs')[0];
        if (outerBoundaryEl) {
          const linearRingEl = outerBoundaryEl.getElementsByTagName('LinearRing')[0];
          if (linearRingEl) {
            const coordsEl = linearRingEl.getElementsByTagName('coordinates')[0];
            if (coordsEl) coordsText = coordsEl.textContent?.trim() || '';
          }
        }

        if (!coordsText) {
          const directCoords = polygonEl.getElementsByTagName('coordinates')[0];
          if (directCoords) coordsText = directCoords.textContent?.trim() || '';
        }

        if (coordsText) {
          const coords = parseKMLCoordinateString(coordsText);
          if (coords.length >= 4) {
            polygons.push({
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: [coords] },
              properties: {
                name,
                description,
                lotNumber: extractLotNumber(name, description) || `Lote ${index + 1}`,
              }
            });
          }
        }
      }

      // Check for closed LineString
      if (!polygonEl) {
        const lsEl = placemark.getElementsByTagName('LineString')[0];
        if (lsEl) {
          const coordsEl = lsEl.getElementsByTagName('coordinates')[0];
          if (coordsEl) {
            const coords = parseKMLCoordinateString(coordsEl.textContent?.trim() || '');
            if (coords.length >= 4) {
              const first = coords[0];
              const last = coords[coords.length - 1];
              const d = Math.sqrt(Math.pow(first[0] - last[0], 2) + Math.pow(first[1] - last[1], 2));
              if (d < 0.00001 || d === 0) {
                if (d > 0) coords.push([...first]);
                polygons.push({
                  type: 'Feature',
                  geometry: { type: 'Polygon', coordinates: [coords] },
                  properties: {
                    name,
                    description,
                    lotNumber: extractLotNumber(name, description) || `Lote ${index + 1}`,
                    reconstructedFrom: 'closedLineString'
                  }
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn(`⚠️ Error processing Placemark ${index}:`, err);
    }
  }

  console.log(`✅ Direct KML parsing: ${polygons.length} polygons extracted`);
  return polygons;
}

function parseKMLCoordinateString(coordsText: string): Position[] {
  const coords: Position[] = [];
  const parts = coordsText.split(/\s+/).filter(p => p.trim());

  for (const part of parts) {
    const [lng, lat] = part.split(',').map(Number);
    if (!isNaN(lng) && !isNaN(lat)) {
      coords.push([lng, lat]);
    }
  }

  return coords;
}

// ============= MAIN PARSER =============

export const parseKMZFile = async (file: File): Promise<ParsedKMZ> => {
  console.log('=== ENHANCED KMZ PARSER v5 ===');
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

    // ===== STRATEGY 0: Direct KML parsing (most reliable for Google Earth) =====
    console.log('🔍 Trying direct KML parsing first...');
    let polygonFeatures = parseKMLDirectlyForPolygons(kmlContent);
    let reconstructionMethod = 'direct';

    if (polygonFeatures.length > 0) {
      console.log(`✅ Direct parsing found ${polygonFeatures.length} polygons`);
    } else {
      // ===== STRATEGY 1: Parse with toGeoJSON =====
      console.log('⚠️ Direct parsing found no polygons. Using toGeoJSON...');
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

        // Handle MultiPolygons
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
        polygonFeatures = expanded;

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

          // Strategy 3: turf.polygonize + buffer/hole extraction
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
      }
    }

    console.log(`✅ Reconstruction method: ${reconstructionMethod}, polygons: ${polygonFeatures.length}`);

    // Post-process polygons
    if (polygonFeatures.length > 0) {
      polygonFeatures = postProcessPolygons(polygonFeatures);
      const placemarks = geojsonToPlacemarks(polygonFeatures);
      const { bounds, center } = calculateBoundsAndCenter(placemarks);

      return {
        placemarks,
        bounds,
        center,
        metadata: {
          totalPlacemarks: placemarks.length,
          polygons: placemarks.filter(p => p.isPolygon).length,
          lineStrings: 0,
          points: 0,
        },
      };
    }

    // ===== FALLBACK: Use direct KML parser (legacy) =====
    console.log('🔄 Using legacy KML parser as fallback...');
    const placemarks = parseKMLDirect(kmlContent);
    const { bounds, center } = calculateBoundsAndCenter(placemarks);

    return {
      placemarks,
      bounds,
      center,
      metadata: {
        totalPlacemarks: placemarks.length,
        polygons: placemarks.filter(p => p.isPolygon).length,
        lineStrings: placemarks.filter(p => p.originalType === 'LineString').length,
        points: placemarks.filter(p => p.originalType === 'Point').length,
      },
    };
  } catch (error) {
    console.error('Error parsing KMZ:', error);
    throw new Error(`Failed to parse KMZ file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Parse a plain KML file
export const parseKMLFile = async (file: File): Promise<ParsedKMZ> => {
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
