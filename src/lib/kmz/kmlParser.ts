// KML Content Parser - extracts placemarks from KML XML
// Enhanced to properly extract all polygon formats from Google Earth KMZ files

import { KMLPlacemark } from './types';
import { parseCoordinates, calculatePolygonArea, closePolygon } from './geometry';

// Extract all LinearRing coordinates from an element
const extractLinearRings = (element: Element): [number, number][][] => {
  const rings: [number, number][][] = [];
  const linearRings = element.getElementsByTagName('LinearRing');
  
  for (let i = 0; i < linearRings.length; i++) {
    const coordsEl = linearRings[i].getElementsByTagName('coordinates')[0];
    if (coordsEl) {
      const coords = parseCoordinates(coordsEl.textContent || '');
      if (coords.length >= 3) {
        rings.push(coords);
      }
    }
  }
  
  return rings;
};

// Extract coordinates from a Polygon element
const extractPolygonCoordinates = (polygonEl: Element): [number, number][] | null => {
  // Method 1: outerBoundaryIs > LinearRing > coordinates (standard KML)
  const outerBoundary = polygonEl.getElementsByTagName('outerBoundaryIs')[0];
  if (outerBoundary) {
    const linearRing = outerBoundary.getElementsByTagName('LinearRing')[0];
    if (linearRing) {
      const coordsEl = linearRing.getElementsByTagName('coordinates')[0];
      if (coordsEl) {
        const coords = parseCoordinates(coordsEl.textContent || '');
        if (coords.length >= 3) {
          return closePolygon(coords);
        }
      }
    }
  }
  
  // Method 2: Direct LinearRing inside Polygon (some exporters)
  const linearRings = extractLinearRings(polygonEl);
  if (linearRings.length > 0 && linearRings[0].length >= 3) {
    return closePolygon(linearRings[0]);
  }
  
  // Method 3: Direct coordinates in Polygon (non-standard but common)
  const directCoords = polygonEl.getElementsByTagName('coordinates')[0];
  if (directCoords) {
    const coords = parseCoordinates(directCoords.textContent || '');
    if (coords.length >= 3) {
      return closePolygon(coords);
    }
  }
  
  return null;
};

// Extract coordinates from a geometry element
const extractCoordinatesFromGeometry = (geomElement: Element): {
  coordinates: [number, number][];
  type: 'Polygon' | 'LineString' | 'LinearRing' | 'Point' | 'MultiGeometry';
} | null => {
  // Try Polygon first (highest priority for lot boundaries)
  const polygonEls = geomElement.getElementsByTagName('Polygon');
  if (polygonEls.length > 0) {
    const coords = extractPolygonCoordinates(polygonEls[0]);
    if (coords && coords.length >= 3) {
      console.log(`  Found Polygon with ${coords.length} vertices`);
      return { coordinates: coords, type: 'Polygon' };
    }
  }

  // Try LinearRing directly (used by some exporters for closed shapes)
  const ringEls = geomElement.getElementsByTagName('LinearRing');
  if (ringEls.length > 0) {
    const coordsEl = ringEls[0].getElementsByTagName('coordinates')[0];
    if (coordsEl) {
      const coords = parseCoordinates(coordsEl.textContent || '');
      if (coords.length >= 3) {
        console.log(`  Found LinearRing with ${coords.length} vertices`);
        return { coordinates: closePolygon(coords), type: 'LinearRing' };
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
        // Check if it's actually a closed polygon disguised as LineString
        const isClosed = coords.length >= 3 && 
          Math.abs(coords[0][0] - coords[coords.length-1][0]) < 0.00001 &&
          Math.abs(coords[0][1] - coords[coords.length-1][1]) < 0.00001;
        
        if (isClosed) {
          console.log(`  Found closed LineString (polygon) with ${coords.length} vertices`);
          return { coordinates: coords, type: 'Polygon' };
        }
        return { coordinates: coords, type: 'LineString' };
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

// Parse MultiGeometry - extracts all polygons and combines them
const parseMultiGeometry = (multiGeomEl: Element): {
  coordinates: [number, number][];
  allPolygons: [number, number][][];
  type: 'Polygon' | 'LineString' | 'LinearRing' | 'Point' | 'MultiGeometry';
} | null => {
  const allPolygons: [number, number][][] = [];
  
  // Collect all Polygons
  const polygons = Array.from(multiGeomEl.getElementsByTagName('Polygon'));
  for (const polygon of polygons) {
    const coords = extractPolygonCoordinates(polygon);
    if (coords && coords.length >= 3) {
      allPolygons.push(coords);
    }
  }
  
  // Also check for LinearRings used as polygons
  const rings = extractLinearRings(multiGeomEl);
  for (const ring of rings) {
    if (ring.length >= 3) {
      allPolygons.push(closePolygon(ring));
    }
  }
  
  if (allPolygons.length > 0) {
    console.log(`  MultiGeometry contains ${allPolygons.length} polygon(s)`);
    // Return the largest polygon as main, but keep all
    const sortedByArea = [...allPolygons].sort((a, b) => 
      calculatePolygonArea(b) - calculatePolygonArea(a)
    );
    return { 
      coordinates: sortedByArea[0], 
      allPolygons,
      type: 'MultiGeometry' 
    };
  }

  // Try LineStrings and check if they form closed shapes
  const lineStrings = Array.from(multiGeomEl.getElementsByTagName('LineString'));
  const allCoords: [number, number][] = [];
  
  for (const ls of lineStrings) {
    const coordsEl = ls.getElementsByTagName('coordinates')[0];
    if (coordsEl) {
      const coords = parseCoordinates(coordsEl.textContent || '');
      allCoords.push(...coords);
    }
  }
  
  if (allCoords.length >= 3) {
    return { 
      coordinates: allCoords, 
      allPolygons: [allCoords],
      type: 'MultiGeometry' 
    };
  }

  return null;
};

// Extract lot number and area from name/description
const extractLotInfo = (name: string, description?: string): { lotNumber?: string; areaHa?: number } => {
  let lotNumber: string | undefined;
  let areaHa: number | undefined;
  
  // Try to extract lot number: "Lote:70" or "Lote 70" or just "70"
  const lotMatch = name.match(/Lote[:\s]*(\d+)/i) || name.match(/^(\d+)$/);
  if (lotMatch) {
    lotNumber = lotMatch[1];
  }
  
  // Try to extract area in hectares from name: "0.65ha"
  const areaMatch = name.match(/([\d.]+)\s*ha/i);
  if (areaMatch) {
    areaHa = parseFloat(areaMatch[1]);
  }
  
  // Also check description
  if (description) {
    if (!lotNumber) {
      const descLotMatch = description.match(/Lote[:\s]*(\d+)/i);
      if (descLotMatch) lotNumber = descLotMatch[1];
    }
    if (!areaHa) {
      const descAreaMatch = description.match(/([\d.]+)\s*ha/i);
      if (descAreaMatch) areaHa = parseFloat(descAreaMatch[1]);
    }
  }
  
  return { lotNumber, areaHa };
};

// Parse KML content and extract placemarks
export const parseKML = (kmlContent: string): KMLPlacemark[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(kmlContent, 'text/xml');
  
  const placemarks: KMLPlacemark[] = [];
  const placemarkElements = doc.getElementsByTagName('Placemark');
  
  console.log('=== KMZ PARSER v3 (Enhanced Polygon Detection) ===');
  console.log('Total Placemark elements:', placemarkElements.length);
  
  let polygonCount = 0;
  let lineStringCount = 0;
  let pointCount = 0;
  let multiGeomCount = 0;
  
  for (let i = 0; i < placemarkElements.length; i++) {
    const placemark = placemarkElements[i];
    
    // Get name
    const nameEl = placemark.getElementsByTagName('name')[0];
    const name = nameEl?.textContent?.trim() || `Element ${i + 1}`;
    
    // Get description
    const descEl = placemark.getElementsByTagName('description')[0];
    const description = descEl?.textContent?.trim();
    
    // Extract lot info from name/description
    const { lotNumber, areaHa } = extractLotInfo(name, description);
    
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
        multiGeomCount++;
        
        // If MultiGeometry contains multiple polygons, create separate placemarks
        if (result.allPolygons.length > 1) {
          for (let p = 1; p < result.allPolygons.length; p++) {
            const polyCoords = result.allPolygons[p];
            const area = calculatePolygonArea(polyCoords);
            placemarks.push({
              name: `${name} (Poly ${p + 1})`,
              description,
              coordinates: polyCoords,
              area: Math.round(area),
              isPolygon: true,
              originalType: 'MultiGeometry',
            });
          }
        }
      }
    }

    // Try direct geometry extraction if no MultiGeometry found
    if (coordinates.length === 0) {
      const result = extractCoordinatesFromGeometry(placemark);
      if (result) {
        coordinates = result.coordinates;
        originalType = result.type;
        isPolygon = result.type === 'Polygon' || result.type === 'LinearRing' || 
                    (coordinates.length >= 3 && result.type !== 'Point');
        
        if (result.type === 'Polygon' || result.type === 'LinearRing') {
          polygonCount++;
        } else if (result.type === 'LineString') {
          lineStringCount++;
        } else if (result.type === 'Point') {
          pointCount++;
        }
      }
    }
    
    if (coordinates.length > 0) {
      // Calculate area - prefer extracted area from name, else calculate
      let area = isPolygon ? calculatePolygonArea(coordinates) : 0;
      if (areaHa && areaHa > 0) {
        area = areaHa * 10000; // Convert hectares to m²
      }
      
      placemarks.push({
        name: lotNumber ? `Lote ${lotNumber}` : name,
        description,
        coordinates,
        area: Math.round(area),
        isPolygon,
        originalType,
      });
    }
  }
  
  // Log detailed summary
  console.log('=== PARSER SUMMARY v3 ===');
  console.log(`Extracted: ${placemarks.length} placemarks`);
  console.log(`  - Real Polygons: ${polygonCount}`);
  console.log(`  - LineStrings: ${lineStringCount}`);
  console.log(`  - MultiGeometry: ${multiGeomCount}`);
  console.log(`  - Points: ${pointCount}`);
  
  const realPolygons = placemarks.filter(p => 
    (p.originalType === 'Polygon' || p.originalType === 'LinearRing') && 
    p.isPolygon && 
    p.coordinates.length >= 4
  );
  console.log(`  - REAL CLOSED POLYGONS: ${realPolygons.length}`);
  
  if (realPolygons.length > 0) {
    console.log('Sample polygon:', realPolygons[0].name, 
      `${realPolygons[0].coordinates.length} vertices,`, 
      `${realPolygons[0].area} m²`
    );
  }
  
  return placemarks;
};
