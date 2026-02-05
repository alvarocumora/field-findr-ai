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
  
  console.log('=== KMZ PARSER DEBUG ===');
  console.log('Total Placemark elements found:', placemarkElements.length);
  
  // First, log the raw KML structure for debugging
  console.log('KML Structure sample (first 2000 chars):', kmlContent.substring(0, 2000));
  
  for (let i = 0; i < placemarkElements.length; i++) {
    const placemark = placemarkElements[i];
    
    // Get name
    const nameEl = placemark.getElementsByTagName('name')[0];
    const name = nameEl?.textContent?.trim() || `Lote ${i + 1}`;
    
    // Get description
    const descEl = placemark.getElementsByTagName('description')[0];
    const description = descEl?.textContent?.trim();
    
    // Log the placemark XML for debugging
    if (i < 3) {
      console.log(`Placemark ${i} (${name}) XML:`, placemark.outerHTML?.substring(0, 500));
    }
    
    // Try to get coordinates from various geometry types
    let coordinates: [number, number][] = [];
    let isPolygon = false;
    
    // Check for Polygon
    const polygonEl = placemark.getElementsByTagName('Polygon')[0];
    if (polygonEl) {
      console.log(`Found Polygon in placemark ${name}`);
      const outerBoundary = polygonEl.getElementsByTagName('outerBoundaryIs')[0];
      if (outerBoundary) {
        const linearRing = outerBoundary.getElementsByTagName('LinearRing')[0];
        if (linearRing) {
          const coordsEl = linearRing.getElementsByTagName('coordinates')[0];
          if (coordsEl) {
            coordinates = parseCoordinates(coordsEl.textContent || '');
            isPolygon = coordinates.length >= 3;
            console.log(`  -> Parsed ${coordinates.length} coordinates from outerBoundaryIs`);
          }
        }
      }
      // Fallback: try direct coordinates under Polygon
      if (coordinates.length === 0) {
        const coordsEl = polygonEl.getElementsByTagName('coordinates')[0];
        if (coordsEl) {
          coordinates = parseCoordinates(coordsEl.textContent || '');
          isPolygon = coordinates.length >= 3;
          console.log(`  -> Parsed ${coordinates.length} coordinates from direct Polygon`);
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
          console.log(`Found LineString in ${name} with ${lineCoords.length} coords`);
          // Check if it's a closed line (first == last point) or treat any 3+ point line as polygon
          if (lineCoords.length >= 3) {
            coordinates = lineCoords;
            isPolygon = true;
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
          console.log(`Found LinearRing in ${name} with ${coordinates.length} coords`);
        }
      }
    }
    
    // Check for MultiGeometry
    if (coordinates.length < 3) {
      const multiGeomEl = placemark.getElementsByTagName('MultiGeometry')[0];
      if (multiGeomEl) {
        console.log(`Found MultiGeometry in ${name}`);
        // Try Polygon inside MultiGeometry
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
        // Try LineString inside MultiGeometry
        if (coordinates.length < 3) {
          const lineStrings = multiGeomEl.getElementsByTagName('LineString');
          if (lineStrings.length > 0) {
            const coordsEl = lineStrings[0].getElementsByTagName('coordinates')[0];
            if (coordsEl) {
              coordinates = parseCoordinates(coordsEl.textContent || '');
              isPolygon = coordinates.length >= 3;
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
          console.log(`Found Point in ${name}`);
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
  console.log('=== PARSER SUMMARY ===');
  console.log(`Total parsed: ${placemarks.length} placemarks`);
  console.log(`  - Polygons: ${polygonCount}`);
  console.log(`  - Points: ${pointCount}`);
  if (placemarks.length > 0) {
    console.log('First placemark sample:', JSON.stringify(placemarks[0], null, 2));
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
  // Separate line segments from lot points
  const lineSegments = placemarks.filter(p => 
    !p.isPolygon && 
    p.coordinates.length >= 2 && 
    (p.name.includes('SEGMENT') || p.name.includes('Polyline'))
  );
  
  // Find lot label points (markers that represent lot centers)
  const lotPoints = placemarks.filter(p => 
    p.coordinates.length === 1 && 
    p.name.startsWith('Lote:')
  );
  
  console.log(`Found ${lineSegments.length} line segments and ${lotPoints.length} lot center points`);
  
  // If we have lot center points and line segments, build polygons around each lot center
  if (lotPoints.length > 0 && lineSegments.length > 0) {
    console.log('Building polygons from lot centers and nearby segments...');
    const polygons = buildPolygonsFromCentersAndSegments(lotPoints, lineSegments, lots);
    if (polygons.length > 0) {
      console.log(`Built ${polygons.length} polygons using lot centers`);
      return polygons;
    }
  }
  
  // Try joining segments directly if no lot points
  if (lineSegments.length > 0) {
    console.log(`Attempting to join ${lineSegments.length} line segments into polygons...`);
    const joinedPolygons = joinPolylinesToPolygons(placemarks.filter(p => 
      !p.isPolygon && p.coordinates.length >= 2
    ));
    if (joinedPolygons.length > 0) {
      console.log(`Successfully created ${joinedPolygons.length} polygons from segments`);
      return joinedPolygons;
    }
  }
  
  // Fallback: generate approximate rectangles from points
  console.log('Fallback: generating rectangular polygons from lot areas');
  const polygonPlacemarks: KMLPlacemark[] = [];
  
  for (const placemark of placemarks) {
    if (placemark.isPolygon) {
      polygonPlacemarks.push(placemark);
      continue;
    }
    
    // Skip segments - only process actual lot points
    if (!placemark.name.startsWith('Lote') && placemark.coordinates.length > 1) {
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

// Build polygons by finding segments near each lot center
const buildPolygonsFromCentersAndSegments = (
  lotPoints: KMLPlacemark[],
  segments: KMLPlacemark[],
  lots: { lot_number: string; area: number }[]
): KMLPlacemark[] => {
  const polygons: KMLPlacemark[] = [];
  
  // Collect all segment points into a pool
  const allSegmentPoints: { point: [number, number]; segmentIndex: number }[] = [];
  segments.forEach((seg, idx) => {
    seg.coordinates.forEach(coord => {
      allSegmentPoints.push({ point: coord, segmentIndex: idx });
    });
  });
  
  for (const lotPoint of lotPoints) {
    const lotNumberMatch = lotPoint.name.match(/Lote:(\d+)/);
    if (!lotNumberMatch) continue;
    
    const lotNumber = lotNumberMatch[1];
    const center = lotPoint.coordinates[0];
    
    // Find matching lot to get area
    const matchingLot = lots.find(l => l.lot_number === lotNumber);
    const expectedArea = matchingLot?.area || 5000;
    
    // Expected radius based on area (assuming roughly circular/square)
    const expectedRadius = Math.sqrt(expectedArea / Math.PI);
    const searchRadiusDegrees = (expectedRadius * 2) / 111320; // Convert to degrees
    
    // Find all segment points within search radius
    const nearbyPoints: [number, number][] = [];
    const usedSegments = new Set<number>();
    
    for (const { point, segmentIndex } of allSegmentPoints) {
      const dist = distance(center, point);
      if (dist < searchRadiusDegrees && !usedSegments.has(segmentIndex)) {
        nearbyPoints.push(point);
        usedSegments.add(segmentIndex);
      }
    }
    
    if (nearbyPoints.length >= 4) {
      // Order points by angle from center to form a polygon
      const orderedPoints = nearbyPoints
        .map(p => ({
          point: p,
          angle: Math.atan2(p[1] - center[1], p[0] - center[0])
        }))
        .sort((a, b) => a.angle - b.angle)
        .map(p => p.point);
      
      // Close the polygon
      orderedPoints.push(orderedPoints[0]);
      
      const area = calculatePolygonArea(orderedPoints);
      
      polygons.push({
        name: `Lote ${lotNumber}`,
        coordinates: orderedPoints,
        area: Math.round(area),
        isPolygon: true
      });
    }
  }
  
  return polygons;
};

// Distance between two points in degrees (approximate)
const distance = (p1: [number, number], p2: [number, number]): number => {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy);
};

// Join polyline segments into closed polygons
const joinPolylinesToPolygons = (polylines: KMLPlacemark[]): KMLPlacemark[] => {
  const TOLERANCE = 0.0001; // About 10 meters tolerance for connecting points
  
  // Filter only actual line segments (2+ points, not just labels)
  const lineSegments = polylines.filter(p => 
    p.coordinates.length >= 2 && 
    !p.name.startsWith('Lote') && 
    !p.name.match(/^\d+\.\d+ha$/)
  );
  
  console.log(`Filtering: ${polylines.length} polylines -> ${lineSegments.length} actual line segments`);
  
  if (lineSegments.length === 0) {
    console.log('No line segments found to join');
    return [];
  }
  
  const segments = lineSegments.map(p => ({
    start: p.coordinates[0],
    end: p.coordinates[p.coordinates.length - 1],
    coords: [...p.coordinates],
    used: false,
    name: p.name
  }));
  
  const polygons: KMLPlacemark[] = [];
  let polygonIndex = 0;
  
  // Try to form closed polygons by connecting segments
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].used) continue;
    
    // Start a new polygon with this segment
    const polygonCoords: [number, number][] = [...segments[i].coords];
    segments[i].used = true;
    
    let currentEnd = segments[i].end;
    const polygonStart = segments[i].coords[0];
    let found = true;
    let iterations = 0;
    const maxIterations = segments.length * 2;
    
    while (found && iterations < maxIterations) {
      found = false;
      iterations++;
      
      // First check if we can close the polygon
      if (polygonCoords.length >= 4 && distance(currentEnd, polygonStart) < TOLERANCE) {
        // Polygon is closed!
        break;
      }
      
      for (let j = 0; j < segments.length; j++) {
        if (segments[j].used) continue;
        
        // Check if this segment connects to current end
        const distToStart = distance(currentEnd, segments[j].start);
        const distToEnd = distance(currentEnd, segments[j].end);
        
        if (distToStart < TOLERANCE) {
          // Segment connects at start
          polygonCoords.push(...segments[j].coords.slice(1));
          currentEnd = segments[j].end;
          segments[j].used = true;
          found = true;
          break;
        } else if (distToEnd < TOLERANCE) {
          // Segment connects at end (reversed)
          const reversed = [...segments[j].coords].reverse();
          polygonCoords.push(...reversed.slice(1));
          currentEnd = reversed[reversed.length - 1];
          segments[j].used = true;
          found = true;
          break;
        }
      }
    }
    
    // Check if polygon is closed (end connects to start)
    if (polygonCoords.length >= 4 && distance(currentEnd, polygonStart) < TOLERANCE) {
      // Ensure it's closed by adding start point
      if (distance(polygonCoords[polygonCoords.length - 1], polygonStart) > 0.0000001) {
        polygonCoords.push(polygonStart);
      }
      
      const area = calculatePolygonArea(polygonCoords);
      
      // Only add polygons with reasonable area (> 100 m²)
      if (area > 100) {
        polygons.push({
          name: `Lote ${polygonIndex + 1}`,
          coordinates: polygonCoords,
          area: Math.round(area),
          isPolygon: true
        });
        polygonIndex++;
      }
    }
  }
  
  console.log(`Joined segments into ${polygons.length} closed polygons`);
  
  // Log first polygon for debugging
  if (polygons.length > 0) {
    console.log(`First joined polygon: ${polygons[0].coordinates.length} vertices, ${polygons[0].area} m²`);
  }
  
  return polygons;
};