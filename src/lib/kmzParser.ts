import JSZip from 'jszip';

export interface KMLPlacemark {
  name: string;
  description?: string;
  coordinates: [number, number][];
  area?: number;
  isPolygon: boolean;
}

export interface ParsedKMZ {
  placemarks: KMLPlacemark[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: { lat: number; lng: number };
}

// Calculate polygon area using Shoelace formula (in square meters approximation)
const calculatePolygonArea = (coords: [number, number][]): number => {
  if (coords.length < 3) return 0;
  
  // Convert to approximate meters using average latitude
  const avgLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
  const latToMeters = 111320; // meters per degree latitude
  const lngToMeters = 111320 * Math.cos(avgLat * Math.PI / 180);
  
  // Convert coordinates to meters
  const metersCoords = coords.map(([lng, lat]) => [
    lng * lngToMeters,
    lat * latToMeters
  ]);
  
  // Shoelace formula
  let area = 0;
  for (let i = 0; i < metersCoords.length; i++) {
    const j = (i + 1) % metersCoords.length;
    area += metersCoords[i][0] * metersCoords[j][1];
    area -= metersCoords[j][0] * metersCoords[i][1];
  }
  
  return Math.abs(area / 2);
};

// Parse coordinates from KML string format
const parseCoordinates = (coordString: string): [number, number][] => {
  if (!coordString) return [];
  
  return coordString
    .trim()
    .split(/\s+/)
    .map(coord => {
      const parts = coord.split(',');
      if (parts.length >= 2) {
        const lng = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        if (!isNaN(lng) && !isNaN(lat)) {
          return [lng, lat] as [number, number];
        }
      }
      return null;
    })
    .filter((c): c is [number, number] => c !== null);
};

// Parse KML content and extract placemarks
const parseKML = (kmlContent: string): KMLPlacemark[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(kmlContent, 'text/xml');
  
  const placemarks: KMLPlacemark[] = [];
  const placemarkElements = doc.getElementsByTagName('Placemark');
  
  console.log('Total Placemark elements found:', placemarkElements.length);
  
  for (let i = 0; i < placemarkElements.length; i++) {
    const placemark = placemarkElements[i];
    
    // Get name
    const nameEl = placemark.getElementsByTagName('name')[0];
    const name = nameEl?.textContent?.trim() || `Lote ${i + 1}`;
    
    // Get description
    const descEl = placemark.getElementsByTagName('description')[0];
    const description = descEl?.textContent?.trim();
    
    // Try to get coordinates from Polygon first
    let coordinates: [number, number][] = [];
    let isPolygon = false;
    
    // Check for Polygon
    const polygonEl = placemark.getElementsByTagName('Polygon')[0];
    if (polygonEl) {
      const outerBoundary = polygonEl.getElementsByTagName('outerBoundaryIs')[0];
      if (outerBoundary) {
        const linearRing = outerBoundary.getElementsByTagName('LinearRing')[0];
        if (linearRing) {
          const coordsEl = linearRing.getElementsByTagName('coordinates')[0];
          if (coordsEl) {
            coordinates = parseCoordinates(coordsEl.textContent || '');
            isPolygon = coordinates.length >= 3;
          }
        }
      }
      // Fallback: try direct coordinates under Polygon
      if (coordinates.length === 0) {
        const coordsEl = polygonEl.getElementsByTagName('coordinates')[0];
        if (coordsEl) {
          coordinates = parseCoordinates(coordsEl.textContent || '');
          isPolygon = coordinates.length >= 3;
        }
      }
    }
    
    // Check for LineString (sometimes polygons are stored as closed LineStrings)
    if (coordinates.length < 3) {
      const lineStringEl = placemark.getElementsByTagName('LineString')[0];
      if (lineStringEl) {
        const coordsEl = lineStringEl.getElementsByTagName('coordinates')[0];
        if (coordsEl) {
          const lineCoords = parseCoordinates(coordsEl.textContent || '');
          // Check if it's a closed line (first == last point)
          if (lineCoords.length >= 3) {
            const first = lineCoords[0];
            const last = lineCoords[lineCoords.length - 1];
            if (first[0] === last[0] && first[1] === last[1]) {
              coordinates = lineCoords;
              isPolygon = true;
            }
          }
        }
      }
    }
    
    // Check for LinearRing directly
    if (coordinates.length < 3) {
      const ringEl = placemark.getElementsByTagName('LinearRing')[0];
      if (ringEl) {
        const coordsEl = ringEl.getElementsByTagName('coordinates')[0];
        if (coordsEl) {
          coordinates = parseCoordinates(coordsEl.textContent || '');
          isPolygon = coordinates.length >= 3;
        }
      }
    }
    
    // Check for MultiGeometry
    if (coordinates.length < 3) {
      const multiGeomEl = placemark.getElementsByTagName('MultiGeometry')[0];
      if (multiGeomEl) {
        const polygons = multiGeomEl.getElementsByTagName('Polygon');
        if (polygons.length > 0) {
          const firstPolygon = polygons[0];
          const outerBoundary = firstPolygon.getElementsByTagName('outerBoundaryIs')[0];
          if (outerBoundary) {
            const linearRing = outerBoundary.getElementsByTagName('LinearRing')[0];
            if (linearRing) {
              const coordsEl = linearRing.getElementsByTagName('coordinates')[0];
              if (coordsEl) {
                coordinates = parseCoordinates(coordsEl.textContent || '');
                isPolygon = coordinates.length >= 3;
              }
            }
          }
        }
      }
    }
    
    // Finally, try Point (only if nothing else found)
    if (coordinates.length === 0) {
      const pointEl = placemark.getElementsByTagName('Point')[0];
      if (pointEl) {
        const coordsEl = pointEl.getElementsByTagName('coordinates')[0];
        if (coordsEl) {
          coordinates = parseCoordinates(coordsEl.textContent || '');
          isPolygon = false;
        }
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
      });
    }
  }
  
  // Log summary
  const polygonCount = placemarks.filter(p => p.isPolygon).length;
  const pointCount = placemarks.filter(p => !p.isPolygon).length;
  console.log(`Parsed: ${polygonCount} polygons, ${pointCount} points`);
  
  return placemarks;
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
    center: {
      lat: (north + south) / 2,
      lng: (east + west) / 2,
    },
  };
};

// Main function to parse KMZ file
export const parseKMZFile = async (file: File): Promise<ParsedKMZ> => {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  // Find KML file in the zip
  let kmlContent: string | null = null;
  
  // Log all files in the KMZ
  console.log('Files in KMZ:', Object.keys(zip.files));
  
  for (const [filename, zipEntry] of Object.entries(zip.files)) {
    if (filename.endsWith('.kml')) {
      kmlContent = await zipEntry.async('string');
      console.log('Found KML file:', filename, 'Length:', kmlContent.length);
      break;
    }
  }
  
  if (!kmlContent) {
    // Maybe it's just a KML file renamed as KMZ
    kmlContent = await file.text();
  }
  
  const placemarks = parseKML(kmlContent);
  const { bounds, center } = calculateBoundsAndCenter(placemarks);
  
  return {
    placemarks,
    bounds,
    center,
  };
};

// Parse a plain KML file
export const parseKMLFile = async (file: File): Promise<ParsedKMZ> => {
  const kmlContent = await file.text();
  const placemarks = parseKML(kmlContent);
  const { bounds, center } = calculateBoundsAndCenter(placemarks);
  
  return {
    placemarks,
    bounds,
    center,
  };
};

// Generate polygon from point markers using Delaunay triangulation approximation
// This creates approximate polygons from point data based on lot groupings
export const generatePolygonsFromPoints = (
  placemarks: KMLPlacemark[], 
  lots: { lot_number: string; area: number }[]
): KMLPlacemark[] => {
  // If we only have points, we can generate approximate square/rectangular polygons
  // based on the lot area and centered on the point
  const polygonPlacemarks: KMLPlacemark[] = [];
  
  for (const placemark of placemarks) {
    if (placemark.isPolygon) {
      polygonPlacemarks.push(placemark);
      continue;
    }
    
    // For points, generate a rectangle based on lot area
    const lotNumberMatch = placemark.name.match(/(\d+)/);
    const lotNumber = lotNumberMatch ? lotNumberMatch[1] : placemark.name;
    
    const matchingLot = lots.find(l => l.lot_number === lotNumber);
    const area = matchingLot?.area || 5000; // Default 5000 m²
    
    // Assume roughly square lot
    const sideLength = Math.sqrt(area); // in meters
    
    // Convert to degrees (approximate)
    const [lng, lat] = placemark.coordinates[0];
    const latOffset = (sideLength / 2) / 111320;
    const lngOffset = (sideLength / 2) / (111320 * Math.cos(lat * Math.PI / 180));
    
    // Create rectangle coordinates
    const rectCoords: [number, number][] = [
      [lng - lngOffset, lat + latOffset],
      [lng + lngOffset, lat + latOffset],
      [lng + lngOffset, lat - latOffset],
      [lng - lngOffset, lat - latOffset],
      [lng - lngOffset, lat + latOffset], // Close the polygon
    ];
    
    polygonPlacemarks.push({
      ...placemark,
      coordinates: rectCoords,
      area,
      isPolygon: true,
    });
  }
  
  return polygonPlacemarks;
};