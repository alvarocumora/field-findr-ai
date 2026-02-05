// Polygon Builder - creates polygons from various geometry types

import { KMLPlacemark, Segment, LotInfo } from './types';
import { distance, calculatePolygonArea, generateRectFromPoint, closePolygon, calculateCentroid } from './geometry';

const TOLERANCE = 0.00005; // ~5 meters tolerance for connecting segments

// Join line segments into closed polygons
export const joinSegmentsToPolygons = (segments: Segment[]): KMLPlacemark[] => {
  console.log(`Attempting to join ${segments.length} segments into polygons...`);
  
  const polygons: KMLPlacemark[] = [];
  let polygonIndex = 0;
  
  // Mark all segments as unused
  segments.forEach(s => s.used = false);
  
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].used) continue;
    
    // Start a new polygon chain
    const chain: [number, number][] = [...segments[i].coords];
    segments[i].used = true;
    
    let currentEnd = segments[i].end;
    const chainStart = segments[i].coords[0];
    let found = true;
    let iterations = 0;
    const maxIterations = segments.length * 3;
    
    while (found && iterations < maxIterations) {
      found = false;
      iterations++;
      
      // Check if we can close the polygon
      if (chain.length >= 4 && distance(currentEnd, chainStart) < TOLERANCE) {
        break; // Polygon is closed
      }
      
      // Find a connecting segment
      for (let j = 0; j < segments.length; j++) {
        if (segments[j].used) continue;
        
        const distToStart = distance(currentEnd, segments[j].start);
        const distToEnd = distance(currentEnd, segments[j].end);
        
        if (distToStart < TOLERANCE) {
          // Connect at start
          chain.push(...segments[j].coords.slice(1));
          currentEnd = segments[j].end;
          segments[j].used = true;
          found = true;
          break;
        } else if (distToEnd < TOLERANCE) {
          // Connect at end (reversed)
          const reversed = [...segments[j].coords].reverse();
          chain.push(...reversed.slice(1));
          currentEnd = reversed[reversed.length - 1];
          segments[j].used = true;
          found = true;
          break;
        }
      }
    }
    
    // Check if polygon closed successfully
    if (chain.length >= 4 && distance(currentEnd, chainStart) < TOLERANCE) {
      const closedChain = closePolygon(chain);
      const area = calculatePolygonArea(closedChain);
      
      // Accept polygons with reasonable area (> 50 m²)
      if (area > 50) {
        polygons.push({
          name: `Lote ${polygonIndex + 1}`,
          coordinates: closedChain,
          area: Math.round(area),
          isPolygon: true,
          originalType: 'LineString',
        });
        polygonIndex++;
      }
    }
  }
  
  console.log(`Created ${polygons.length} closed polygons from segments`);
  return polygons;
};

// Build polygons from lot center points and nearby segments
export const buildPolygonsFromCentersAndSegments = (
  lotPoints: KMLPlacemark[],
  segments: KMLPlacemark[],
  lots: LotInfo[]
): KMLPlacemark[] => {
  console.log(`Building polygons from ${lotPoints.length} centers and ${segments.length} segments`);
  
  const polygons: KMLPlacemark[] = [];
  
  // Collect all segment endpoints
  const allPoints: { point: [number, number]; segmentIndex: number }[] = [];
  segments.forEach((seg, idx) => {
    seg.coordinates.forEach(coord => {
      allPoints.push({ point: coord, segmentIndex: idx });
    });
  });
  
  for (const lotPoint of lotPoints) {
    // Extract lot number
    const lotNumberMatch = lotPoint.name.match(/Lote[:\s]*(\d+)/i) || lotPoint.name.match(/(\d+)/);
    if (!lotNumberMatch) continue;
    
    const lotNumber = lotNumberMatch[1];
    const center = lotPoint.coordinates[0];
    
    // Find matching lot area
    const matchingLot = lots.find(l => l.lot_number === lotNumber);
    const expectedArea = matchingLot?.area || 5000;
    
    // Calculate search radius based on expected area
    const expectedRadius = Math.sqrt(expectedArea / Math.PI);
    const searchRadiusDegrees = (expectedRadius * 2.5) / 111320;
    
    // Find nearby points from segments
    const nearbyPoints: [number, number][] = [];
    const usedSegments = new Set<number>();
    
    for (const { point, segmentIndex } of allPoints) {
      const dist = distance(center, point);
      if (dist < searchRadiusDegrees && !usedSegments.has(segmentIndex)) {
        nearbyPoints.push(point);
        usedSegments.add(segmentIndex);
      }
    }
    
    if (nearbyPoints.length >= 4) {
      // Order points by angle to form convex polygon
      const orderedPoints = nearbyPoints
        .map(p => ({
          point: p,
          angle: Math.atan2(p[1] - center[1], p[0] - center[0])
        }))
        .sort((a, b) => a.angle - b.angle)
        .map(p => p.point);
      
      const closedPolygon = closePolygon(orderedPoints);
      const area = calculatePolygonArea(closedPolygon);
      
      polygons.push({
        name: `Lote ${lotNumber}`,
        coordinates: closedPolygon,
        area: Math.round(area),
        isPolygon: true,
        originalType: 'Point',
      });
    }
  }
  
  console.log(`Built ${polygons.length} polygons from centers`);
  return polygons;
};

// Generate polygons from points using rectangular approximation
export const generatePolygonsFromPoints = (
  placemarks: KMLPlacemark[],
  lots: LotInfo[]
): KMLPlacemark[] => {
  console.log('=== POLYGON GENERATION v2 ===');
  
  // Separate geometry types
  const existingPolygons = placemarks.filter(p => p.isPolygon && p.coordinates.length >= 4);
  const lineSegments = placemarks.filter(p => 
    !p.isPolygon && 
    p.coordinates.length >= 2 && 
    (p.originalType === 'LineString' || p.name.includes('SEGMENT') || p.name.includes('Polyline'))
  );
  const lotPoints = placemarks.filter(p => 
    p.coordinates.length === 1 && 
    (p.name.match(/Lote[:\s]*\d+/i) || p.name.match(/^\d+$/))
  );
  
  console.log(`Existing polygons: ${existingPolygons.length}, Segments: ${lineSegments.length}, Lot points: ${lotPoints.length}`);
  
  // If we already have good polygons, use them
  if (existingPolygons.length > 0) {
    console.log('Using existing polygons from KMZ');
    return existingPolygons;
  }
  
  // Strategy 1: Build from lot centers and segments
  if (lotPoints.length > 0 && lineSegments.length > 0) {
    const fromCenters = buildPolygonsFromCentersAndSegments(lotPoints, lineSegments, lots);
    if (fromCenters.length > 0) {
      return fromCenters;
    }
  }
  
  // Strategy 2: Join segments directly
  if (lineSegments.length >= 3) {
    const segments: Segment[] = lineSegments.map(p => ({
      start: p.coordinates[0],
      end: p.coordinates[p.coordinates.length - 1],
      coords: [...p.coordinates],
      used: false,
      name: p.name
    }));
    
    const joined = joinSegmentsToPolygons(segments);
    if (joined.length > 0) {
      return joined;
    }
  }
  
  // Strategy 3: Generate rectangles from points
  console.log('Fallback: generating rectangular approximations');
  const rectangles: KMLPlacemark[] = [];
  
  for (const placemark of placemarks) {
    if (placemark.isPolygon && placemark.coordinates.length >= 4) {
      rectangles.push(placemark);
      continue;
    }
    
    // Skip non-lot points
    if (placemark.coordinates.length > 1 && !placemark.name.match(/Lote/i)) {
      continue;
    }
    
    // Extract lot number and find area
    const lotNumberMatch = placemark.name.match(/(\d+)/);
    const lotNumber = lotNumberMatch ? lotNumberMatch[1] : placemark.name;
    const matchingLot = lots.find(l => l.lot_number === lotNumber);
    const area = matchingLot?.area || 5000;
    
    // Generate rectangle
    const center = placemark.coordinates[0];
    const rectCoords = generateRectFromPoint(center, area);
    
    rectangles.push({
      ...placemark,
      coordinates: rectCoords,
      area,
      isPolygon: true,
      originalType: 'Point',
    });
  }
  
  return rectangles;
};
