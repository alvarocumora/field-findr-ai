import JSZip from 'jszip';

export interface KMLPlacemark {
  name: string;
  description?: string;
  coordinates: [number, number][];
  area?: number;
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
  
  for (let i = 0; i < placemarkElements.length; i++) {
    const placemark = placemarkElements[i];
    
    // Get name
    const nameEl = placemark.getElementsByTagName('name')[0];
    const name = nameEl?.textContent?.trim() || `Lote ${i + 1}`;
    
    // Get description
    const descEl = placemark.getElementsByTagName('description')[0];
    const description = descEl?.textContent?.trim();
    
    // Try to get coordinates from Polygon
    let coordinates: [number, number][] = [];
    
    const polygonEl = placemark.getElementsByTagName('Polygon')[0];
    if (polygonEl) {
      const coordsEl = polygonEl.getElementsByTagName('coordinates')[0];
      if (coordsEl) {
        coordinates = parseCoordinates(coordsEl.textContent || '');
      }
    }
    
    // If no polygon, try LinearRing
    if (coordinates.length === 0) {
      const ringEl = placemark.getElementsByTagName('LinearRing')[0];
      if (ringEl) {
        const coordsEl = ringEl.getElementsByTagName('coordinates')[0];
        if (coordsEl) {
          coordinates = parseCoordinates(coordsEl.textContent || '');
        }
      }
    }
    
    // If still no coordinates, try Point
    if (coordinates.length === 0) {
      const pointEl = placemark.getElementsByTagName('Point')[0];
      if (pointEl) {
        const coordsEl = pointEl.getElementsByTagName('coordinates')[0];
        if (coordsEl) {
          coordinates = parseCoordinates(coordsEl.textContent || '');
        }
      }
    }
    
    if (coordinates.length > 0) {
      const area = coordinates.length >= 3 ? calculatePolygonArea(coordinates) : 0;
      placemarks.push({
        name,
        description,
        coordinates,
        area: Math.round(area),
      });
    }
  }
  
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
  
  for (const [filename, zipEntry] of Object.entries(zip.files)) {
    if (filename.endsWith('.kml')) {
      kmlContent = await zipEntry.async('string');
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
