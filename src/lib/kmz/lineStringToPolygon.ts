// LineString to Polygon Converter
// Connects adjacent LineStrings to form closed polygons

import { KMLPlacemark, LotInfo, Segment } from './types';
import { calculatePolygonArea, closePolygon, distance } from './geometry';

interface EndpointConnection {
  segmentIndex: number;
  endType: 'start' | 'end';
  point: [number, number];
}

// Maximum distance (in degrees) to consider two endpoints as connected
// ~11 meters at equator (0.0001 deg ≈ 11m)
const CONNECTION_THRESHOLD = 0.0001;

/**
 * Find the closest endpoint to a given point
 */
const findClosestEndpoint = (
  point: [number, number],
  endpoints: EndpointConnection[],
  excludeSegmentIndex: number
): EndpointConnection | null => {
  let closest: EndpointConnection | null = null;
  let minDist = CONNECTION_THRESHOLD;

  for (const ep of endpoints) {
    if (ep.segmentIndex === excludeSegmentIndex) continue;
    
    const d = distance(point, ep.point);
    if (d < minDist) {
      minDist = d;
      closest = ep;
    }
  }

  return closest;
};

/**
 * Build a chain of connected LineStrings starting from a segment
 */
const buildChain = (
  startIndex: number,
  segments: Segment[],
  usedSegments: Set<number>
): [number, number][] | null => {
  if (usedSegments.has(startIndex)) return null;

  const chain: [number, number][] = [];
  const segment = segments[startIndex];
  
  // Add all points from first segment
  chain.push(...segment.coords);
  usedSegments.add(startIndex);

  // Build endpoints map for remaining segments
  const buildEndpoints = (): EndpointConnection[] => {
    const eps: EndpointConnection[] = [];
    segments.forEach((seg, idx) => {
      if (usedSegments.has(idx) || seg.coords.length < 2) return;
      eps.push({ segmentIndex: idx, endType: 'start', point: seg.coords[0] });
      eps.push({ segmentIndex: idx, endType: 'end', point: seg.coords[seg.coords.length - 1] });
    });
    return eps;
  };

  // Extend chain forward (from the end)
  let extendingForward = true;
  while (extendingForward) {
    const endpoints = buildEndpoints();
    const currentEnd = chain[chain.length - 1];
    const match = findClosestEndpoint(currentEnd, endpoints, -1);

    if (match) {
      const matchSeg = segments[match.segmentIndex];
      usedSegments.add(match.segmentIndex);

      // Add segment's coords in correct order
      if (match.endType === 'start') {
        // Connect start to our end, add in forward order (skip first point - it's the connection)
        chain.push(...matchSeg.coords.slice(1));
      } else {
        // Connect end to our end, add in reverse order (skip last point - it's the connection)
        const reversed = [...matchSeg.coords].reverse();
        chain.push(...reversed.slice(1));
      }
    } else {
      extendingForward = false;
    }
  }

  // Extend chain backward (from the start)
  let extendingBackward = true;
  while (extendingBackward) {
    const endpoints = buildEndpoints();
    const currentStart = chain[0];
    const match = findClosestEndpoint(currentStart, endpoints, -1);

    if (match) {
      const matchSeg = segments[match.segmentIndex];
      usedSegments.add(match.segmentIndex);

      // Add segment's coords in correct order at the beginning
      if (match.endType === 'end') {
        // Connect end to our start, prepend in forward order (skip last point - it's the connection)
        chain.unshift(...matchSeg.coords.slice(0, -1));
      } else {
        // Connect start to our start, prepend in reverse order (skip first point - it's the connection)
        const reversed = [...matchSeg.coords].reverse();
        chain.unshift(...reversed.slice(0, -1));
      }
    } else {
      extendingBackward = false;
    }
  }

  // Check if chain is closed (forms a polygon)
  if (chain.length >= 4) {
    const first = chain[0];
    const last = chain[chain.length - 1];
    const d = distance(first, last);
    
    if (d < CONNECTION_THRESHOLD * 10) {
      // Close the polygon
      return closePolygon(chain);
    }
  }

  return chain.length >= 3 ? chain : null;
};

/**
 * Convert LineStrings to Polygons by connecting adjacent segments
 */
export const convertLineStringsToPolygons = (placemarks: KMLPlacemark[]): KMLPlacemark[] => {
  console.log('=== LINESTRING TO POLYGON CONVERTER ===');
  
  // Extract all LineStrings as segments (including from MultiGeometry)
  const segments: Segment[] = [];
  
  placemarks.forEach(p => {
    // Include LineStrings, LinearRings, and MultiGeometry
    if ((p.originalType === 'LineString' || p.originalType === 'LinearRing' || p.originalType === 'MultiGeometry') && 
        p.coordinates.length >= 2) {
      segments.push({
        start: p.coordinates[0],
        end: p.coordinates[p.coordinates.length - 1],
        coords: p.coordinates,
        used: false,
        name: p.name
      });
    }
  });

  console.log(`Found ${segments.length} LineString/MultiGeometry segments to process`);

  // Already closed polygons
  const existingPolygons = placemarks.filter(p => 
    p.originalType === 'Polygon' && 
    p.isPolygon && 
    p.coordinates.length >= 4
  );

  console.log(`Found ${existingPolygons.length} existing closed polygons`);
  
  // Check for segments that are already closed (form a polygon on their own)
  const selfClosedPolygons: KMLPlacemark[] = [];
  for (const seg of segments) {
    if (seg.coords.length >= 4) {
      const first = seg.coords[0];
      const last = seg.coords[seg.coords.length - 1];
      const d = distance(first, last);
      
      if (d < CONNECTION_THRESHOLD * 10) {
        const closedCoords = closePolygon(seg.coords);
        const area = calculatePolygonArea(closedCoords);
        
        if (area >= 100 && area <= 1000000) {
          const lotMatch = seg.name.match(/(\d+)/);
          selfClosedPolygons.push({
            name: lotMatch ? `Lote ${lotMatch[1]}` : seg.name,
            coordinates: closedCoords,
            area: Math.round(area),
            isPolygon: true,
            originalType: 'Polygon'
          });
          seg.used = true;
          console.log(`Self-closed segment: ${seg.name}, ${closedCoords.length} vertices, ${Math.round(area)}m²`);
        }
      }
    }
  }
  
  console.log(`Found ${selfClosedPolygons.length} self-closed segments`);

  // Track used segments
  const usedSegments = new Set<number>();
  
  // Mark self-closed segments as used
  segments.forEach((seg, idx) => {
    if (seg.used) usedSegments.add(idx);
  });

  // Build polygons by connecting segments
  const builtPolygons: KMLPlacemark[] = [];

  // Sort segments by name to try to group related ones
  const sortedIndices = segments.map((_, i) => i).sort((a, b) => {
    const nameA = segments[a].name;
    const nameB = segments[b].name;
    return nameA.localeCompare(nameB, undefined, { numeric: true });
  });

  for (const startIdx of sortedIndices) {
    if (usedSegments.has(startIdx)) continue;

    const chain = buildChain(startIdx, segments, usedSegments);
    
    if (chain && chain.length >= 4) {
      const area = calculatePolygonArea(chain);
      
      // Only accept reasonable polygon sizes (between 100m² and 100ha)
      if (area >= 100 && area <= 1000000) {
        const baseName = segments[startIdx].name;
        const lotMatch = baseName.match(/(\d+)/);
        
        builtPolygons.push({
          name: lotMatch ? `Lote ${lotMatch[1]}` : baseName,
          coordinates: chain,
          area: Math.round(area),
          isPolygon: true,
          originalType: 'Polygon' // Mark as real polygon now
        });
        
        console.log(`Built polygon from chain: ${baseName}, ${chain.length} vertices, ${Math.round(area)}m²`);
      }
    }
  }

  const totalPolygons = [...existingPolygons, ...selfClosedPolygons, ...builtPolygons];
  console.log(`Total converted: ${totalPolygons.length} (existing: ${existingPolygons.length}, self-closed: ${selfClosedPolygons.length}, chains: ${builtPolygons.length})`);

  return totalPolygons;
};

/**
 * Smart polygon builder that tries multiple strategies
 */
export const buildPolygonsFromMixedGeometry = (
  placemarks: KMLPlacemark[],
  lots: LotInfo[]
): KMLPlacemark[] => {
  console.log('=== SMART POLYGON BUILDER ===');
  console.log(`Input: ${placemarks.length} placemarks, ${lots.length} lots expected`);

  // Strategy 1: Use existing real polygons
  const realPolygons = placemarks.filter(p => 
    p.originalType === 'Polygon' && 
    p.isPolygon && 
    p.coordinates.length >= 4
  );

  if (realPolygons.length >= lots.length * 0.7) {
    console.log(`Strategy 1: Using ${realPolygons.length} real polygons`);
    return realPolygons;
  }

  // Strategy 2: Connect LineStrings to form polygons
  const convertedPolygons = convertLineStringsToPolygons(placemarks);
  
  if (convertedPolygons.length >= lots.length * 0.5) {
    console.log(`Strategy 2: Converted LineStrings to ${convertedPolygons.length} polygons`);
    return convertedPolygons;
  }

  // Strategy 3: Check for closed LineStrings (polygon in disguise)
  const closedLineStrings = placemarks.filter(p => {
    if (p.originalType !== 'LineString' || p.coordinates.length < 4) return false;
    const first = p.coordinates[0];
    const last = p.coordinates[p.coordinates.length - 1];
    return distance(first, last) < CONNECTION_THRESHOLD * 10;
  }).map(p => ({
    ...p,
    coordinates: closePolygon(p.coordinates),
    isPolygon: true,
    originalType: 'Polygon' as const
  }));

  if (closedLineStrings.length > convertedPolygons.length) {
    console.log(`Strategy 3: Found ${closedLineStrings.length} closed LineStrings (hidden polygons)`);
    return closedLineStrings;
  }

  console.log(`Returning best result: ${convertedPolygons.length} polygons`);
  return convertedPolygons.length > 0 ? convertedPolygons : realPolygons;
};
