// KML Content Parser - extracts placemarks from KML XML

import { KMLPlacemark } from './types';
import { parseCoordinates, calculatePolygonArea } from './geometry';

// Extract coordinates from a geometry element
const extractCoordinatesFromGeometry = (geomElement: Element): {
  coordinates: [number, number][];
  type: 'Polygon' | 'LineString' | 'LinearRing' | 'Point' | 'MultiGeometry';
} | null => {
  // Try Polygon first
  const polygonEl = geomElement.getElementsByTagName('Polygon')[0];
  if (polygonEl) {
    // Try outerBoundaryIs > LinearRing > coordinates
    const outerBoundary = polygonEl.getElementsByTagName('outerBoundaryIs')[0];
    if (outerBoundary) {
      const linearRing = outerBoundary.getElementsByTagName('LinearRing')[0];
      if (linearRing) {
        const coordsEl = linearRing.getElementsByTagName('coordinates')[0];
        if (coordsEl) {
          const coords = parseCoordinates(coordsEl.textContent || '');
          if (coords.length >= 3) {
            return { coordinates: coords, type: 'Polygon' };
          }
        }
      }
    }
    // Fallback: direct coordinates in Polygon
    const directCoords = polygonEl.getElementsByTagName('coordinates')[0];
    if (directCoords) {
      const coords = parseCoordinates(directCoords.textContent || '');
      if (coords.length >= 3) {
        return { coordinates: coords, type: 'Polygon' };
      }
    }
  }

  // Try LineString
  const lineStringEl = geomElement.getElementsByTagName('LineString')[0];
  if (lineStringEl) {
    const coordsEl = lineStringEl.getElementsByTagName('coordinates')[0];
    if (coordsEl) {
      const coords = parseCoordinates(coordsEl.textContent || '');
      if (coords.length >= 2) {
        return { coordinates: coords, type: 'LineString' };
      }
    }
  }

  // Try LinearRing directly
  const ringEl = geomElement.getElementsByTagName('LinearRing')[0];
  if (ringEl) {
    const coordsEl = ringEl.getElementsByTagName('coordinates')[0];
    if (coordsEl) {
      const coords = parseCoordinates(coordsEl.textContent || '');
      if (coords.length >= 3) {
        return { coordinates: coords, type: 'LinearRing' };
      }
    }
  }

  // Try Point
  const pointEl = geomElement.getElementsByTagName('Point')[0];
  if (pointEl) {
    const coordsEl = pointEl.getElementsByTagName('coordinates')[0];
    if (coordsEl) {
      const coords = parseCoordinates(coordsEl.textContent || '');
      if (coords.length >= 1) {
        return { coordinates: coords, type: 'Point' };
      }
    }
  }

  return null;
};

// Parse MultiGeometry - extracts all geometries and returns the best one
const parseMultiGeometry = (multiGeomEl: Element): {
  coordinates: [number, number][];
  type: 'Polygon' | 'LineString' | 'LinearRing' | 'Point' | 'MultiGeometry';
} | null => {
  // Collect all Polygons
  const polygons = Array.from(multiGeomEl.getElementsByTagName('Polygon'));
  if (polygons.length > 0) {
    // Use the first polygon's coordinates
    for (const polygon of polygons) {
      const result = extractCoordinatesFromGeometry(polygon);
      if (result && result.coordinates.length >= 3) {
        return { coordinates: result.coordinates, type: 'MultiGeometry' };
      }
    }
  }

  // Try LineStrings
  const lineStrings = Array.from(multiGeomEl.getElementsByTagName('LineString'));
  if (lineStrings.length > 0) {
    // Collect all line coordinates
    const allCoords: [number, number][] = [];
    for (const ls of lineStrings) {
      const coordsEl = ls.getElementsByTagName('coordinates')[0];
      if (coordsEl) {
        const coords = parseCoordinates(coordsEl.textContent || '');
        allCoords.push(...coords);
      }
    }
    if (allCoords.length >= 3) {
      return { coordinates: allCoords, type: 'MultiGeometry' };
    }
  }

  return null;
};

// Parse KML content and extract placemarks
export const parseKML = (kmlContent: string): KMLPlacemark[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(kmlContent, 'text/xml');
  
  const placemarks: KMLPlacemark[] = [];
  const placemarkElements = doc.getElementsByTagName('Placemark');
  
  console.log('=== KMZ PARSER v2 ===');
  console.log('Total Placemark elements:', placemarkElements.length);
  
  for (let i = 0; i < placemarkElements.length; i++) {
    const placemark = placemarkElements[i];
    
    // Get name
    const nameEl = placemark.getElementsByTagName('name')[0];
    const name = nameEl?.textContent?.trim() || `Element ${i + 1}`;
    
    // Get description
    const descEl = placemark.getElementsByTagName('description')[0];
    const description = descEl?.textContent?.trim();
    
    let coordinates: [number, number][] = [];
    let originalType: KMLPlacemark['originalType'] = 'Point';
    let isPolygon = false;

    // Check for MultiGeometry first
    const multiGeomEl = placemark.getElementsByTagName('MultiGeometry')[0];
    if (multiGeomEl) {
      const result = parseMultiGeometry(multiGeomEl);
      if (result) {
        coordinates = result.coordinates;
        originalType = 'MultiGeometry';
        isPolygon = coordinates.length >= 3;
      }
    }

    // Try direct geometry extraction if no MultiGeometry found
    if (coordinates.length === 0) {
      const result = extractCoordinatesFromGeometry(placemark);
      if (result) {
        coordinates = result.coordinates;
        originalType = result.type;
        isPolygon = coordinates.length >= 3 && result.type !== 'Point';
      }
    }
    
    if (coordinates.length > 0) {
      const area = isPolygon ? calculatePolygonArea(coordinates) : 0;
      
      placemarks.push({
        name,
        description,
        coordinates,
        area: Math.round(area),
        isPolygon,
        originalType,
      });
    }
  }
  
  // Log summary
  const stats = {
    total: placemarks.length,
    polygons: placemarks.filter(p => p.isPolygon && p.originalType === 'Polygon').length,
    lineStrings: placemarks.filter(p => p.originalType === 'LineString').length,
    multiGeom: placemarks.filter(p => p.originalType === 'MultiGeometry').length,
    points: placemarks.filter(p => p.originalType === 'Point').length,
  };
  
  console.log('=== PARSER SUMMARY v2 ===');
  console.log(`Total: ${stats.total}, Polygons: ${stats.polygons}, LineStrings: ${stats.lineStrings}, MultiGeom: ${stats.multiGeom}, Points: ${stats.points}`);
  
  return placemarks;
};
