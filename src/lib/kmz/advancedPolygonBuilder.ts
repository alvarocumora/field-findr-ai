// Advanced Polygon Builder - uses computational geometry to reconstruct polygons
// from scattered points and line segments

import { KMLPlacemark, LotInfo } from './types';
import { calculatePolygonArea, closePolygon, distance } from './geometry';

interface Point {
  x: number;
  y: number;
  originalIndex?: number;
}

interface Edge {
  from: Point;
  to: Point;
  segment?: KMLPlacemark;
}

// Convex Hull using Graham Scan algorithm
const convexHull = (points: Point[]): Point[] => {
  if (points.length < 3) return points;

  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  
  const cross = (o: Point, a: Point, b: Point): number => {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  };

  const lower: Point[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
};

// Order points by angle from centroid (for concave polygon approximation)
const orderPointsByAngle = (points: Point[]): Point[] => {
  if (points.length < 3) return points;

  const centroid = {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  };

  return [...points].sort((a, b) => {
    const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
    const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
    return angleA - angleB;
  });
};

// Alpha shape approximation for concave boundaries
const alphaConcaveHull = (points: Point[], alpha: number = 0.00005): Point[] => {
  if (points.length < 3) return points;
  
  // Start with convex hull
  const hull = convexHull(points);
  if (points.length <= 4) return hull;
  
  // For small alpha, use angle-ordered approach which works better for lot shapes
  const ordered = orderPointsByAngle(points);
  
  // Remove points that create inward spikes (concave but not too much)
  const filtered: Point[] = [];
  for (let i = 0; i < ordered.length; i++) {
    const prev = ordered[(i - 1 + ordered.length) % ordered.length];
    const curr = ordered[i];
    const next = ordered[(i + 1) % ordered.length];
    
    // Calculate cross product to detect sharp inward angles
    const cross = (curr.x - prev.x) * (next.y - prev.y) - (curr.y - prev.y) * (next.x - prev.x);
    
    // Keep point if it doesn't create too sharp an angle
    if (cross >= -alpha * 1e8) {
      filtered.push(curr);
    }
  }
  
  return filtered.length >= 3 ? filtered : ordered;
};

// Cluster nearby points to identify lot centers
const clusterPoints = (points: Point[], radius: number): Point[][] => {
  const clusters: Point[][] = [];
  const used = new Set<number>();

  for (let i = 0; i < points.length; i++) {
    if (used.has(i)) continue;

    const cluster: Point[] = [points[i]];
    used.add(i);

    for (let j = i + 1; j < points.length; j++) {
      if (used.has(j)) continue;
      
      const d = Math.sqrt(
        Math.pow(points[i].x - points[j].x, 2) + 
        Math.pow(points[i].y - points[j].y, 2)
      );
      
      if (d < radius) {
        cluster.push(points[j]);
        used.add(j);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
};

// Find edge intersections to define boundaries
const findEdgeIntersections = (edges: Edge[], bounds: { minX: number; maxX: number; minY: number; maxY: number }): Point[] => {
  const intersections: Point[] = [];
  
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const e1 = edges[i];
      const e2 = edges[j];
      
      const x1 = e1.from.x, y1 = e1.from.y;
      const x2 = e1.to.x, y2 = e1.to.y;
      const x3 = e2.from.x, y3 = e2.from.y;
      const x4 = e2.to.x, y4 = e2.to.y;
      
      const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      if (Math.abs(denom) < 1e-10) continue;
      
      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
      const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
      
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        const x = x1 + t * (x2 - x1);
        const y = y1 + t * (y2 - y1);
        
        if (x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY) {
          intersections.push({ x, y });
        }
      }
    }
  }
  
  return intersections;
};

// Main function: Build polygons from mixed geometry
export const buildPolygonsAdvanced = (
  placemarks: KMLPlacemark[],
  lots: LotInfo[]
): KMLPlacemark[] => {
  console.log('=== ADVANCED POLYGON BUILDER ===');
  console.log(`Input: ${placemarks.length} placemarks, ${lots.length} lots`);
  
  // Separate by geometry type
  const existingPolygons = placemarks.filter(p => 
    p.isPolygon && 
    p.coordinates.length >= 4 && 
    p.originalType === 'Polygon'
  );
  
  const lineSegments = placemarks.filter(p => 
    p.originalType === 'LineString' || 
    p.originalType === 'LinearRing' ||
    (p.originalType === 'MultiGeometry' && p.coordinates.length >= 2)
  );
  
  const points = placemarks.filter(p => 
    p.originalType === 'Point' || 
    p.coordinates.length === 1
  );
  
  console.log(`Existing polygons: ${existingPolygons.length}`);
  console.log(`Line segments: ${lineSegments.length}`);
  console.log(`Points: ${points.length}`);
  
  // If we have real polygons, use them
  if (existingPolygons.length >= lots.length * 0.5) {
    console.log('Using existing polygons');
    return existingPolygons;
  }
  
  // Collect all vertices from segments
  const allVertices: Point[] = [];
  const edges: Edge[] = [];
  
  lineSegments.forEach(seg => {
    for (let i = 0; i < seg.coordinates.length; i++) {
      const [x, y] = seg.coordinates[i];
      allVertices.push({ x, y, originalIndex: allVertices.length });
      
      if (i > 0) {
        const [px, py] = seg.coordinates[i - 1];
        edges.push({
          from: { x: px, y: py },
          to: { x, y },
          segment: seg,
        });
      }
    }
  });
  
  // Add point placemarks
  points.forEach(pt => {
    if (pt.coordinates.length > 0) {
      const [x, y] = pt.coordinates[0];
      allVertices.push({ x, y, originalIndex: allVertices.length });
    }
  });
  
  console.log(`Total vertices: ${allVertices.length}, Edges: ${edges.length}`);
  
  if (allVertices.length < 4) {
    console.log('Not enough vertices to build polygons');
    return existingPolygons;
  }
  
  // Calculate bounds
  const bounds = {
    minX: Math.min(...allVertices.map(v => v.x)),
    maxX: Math.max(...allVertices.map(v => v.x)),
    minY: Math.min(...allVertices.map(v => v.y)),
    maxY: Math.max(...allVertices.map(v => v.y)),
  };
  
  // Add edge intersections
  const intersections = findEdgeIntersections(edges, bounds);
  allVertices.push(...intersections);
  console.log(`Added ${intersections.length} edge intersections`);
  
  // Estimate expected lot size from database
  const avgLotArea = lots.reduce((sum, l) => sum + l.area, 0) / lots.length || 5000;
  const expectedRadius = Math.sqrt(avgLotArea) / 111320; // Convert m² to degrees
  
  // Cluster vertices by proximity
  const clusters = clusterPoints(allVertices, expectedRadius * 0.3);
  console.log(`Found ${clusters.length} vertex clusters`);
  
  // For each lot, find nearby vertices and build polygon
  const polygons: KMLPlacemark[] = [];
  
  // Sort lots by lot number
  const sortedLots = [...lots].sort((a, b) => {
    const numA = parseInt(a.lot_number) || 0;
    const numB = parseInt(b.lot_number) || 0;
    return numA - numB;
  });
  
  // Try to match named placemarks first
  const namedPoints = points.filter(p => p.name.match(/Lote[:\s]*\d+/i) || p.name.match(/^\d+$/));
  
  for (const lot of sortedLots) {
    // Find named point that matches this lot
    const namedPoint = namedPoints.find(p => {
      const match = p.name.match(/(\d+)/);
      return match && match[1] === lot.lot_number;
    });
    
    let center: Point | null = null;
    
    if (namedPoint && namedPoint.coordinates.length > 0) {
      center = { x: namedPoint.coordinates[0][0], y: namedPoint.coordinates[0][1] };
    } else {
      // Use cluster centroid
      const clusterIndex = polygons.length % clusters.length;
      if (clusters[clusterIndex] && clusters[clusterIndex].length > 0) {
        const cluster = clusters[clusterIndex];
        center = {
          x: cluster.reduce((sum, p) => sum + p.x, 0) / cluster.length,
          y: cluster.reduce((sum, p) => sum + p.y, 0) / cluster.length,
        };
      }
    }
    
    if (!center) continue;
    
    // Find vertices within expected radius
    const searchRadius = Math.sqrt(lot.area) / 111320 * 1.5;
    const nearbyVertices = allVertices.filter(v => {
      const d = Math.sqrt(Math.pow(v.x - center!.x, 2) + Math.pow(v.y - center!.y, 2));
      return d < searchRadius;
    });
    
    if (nearbyVertices.length >= 4) {
      // Build polygon from nearby vertices
      const hull = alphaConcaveHull(nearbyVertices, expectedRadius * 0.1);
      
      if (hull.length >= 3) {
        const coords: [number, number][] = hull.map(p => [p.x, p.y]);
        const closedCoords = closePolygon(coords);
        const area = calculatePolygonArea(closedCoords);
        
        // Only accept if area is reasonable
        if (area >= lot.area * 0.3 && area <= lot.area * 3) {
          polygons.push({
            name: `Lote ${lot.lot_number}`,
            coordinates: closedCoords,
            area: Math.round(area),
            isPolygon: true,
            originalType: 'LineString',
          });
          continue;
        }
      }
    }
    
    // Fallback: generate simple polygon from center
    const sideLength = Math.sqrt(lot.area) / 111320;
    const rect: [number, number][] = [
      [center.x - sideLength/2, center.y + sideLength/2],
      [center.x + sideLength/2, center.y + sideLength/2],
      [center.x + sideLength/2, center.y - sideLength/2],
      [center.x - sideLength/2, center.y - sideLength/2],
      [center.x - sideLength/2, center.y + sideLength/2],
    ];
    
    polygons.push({
      name: `Lote ${lot.lot_number}`,
      coordinates: rect,
      area: lot.area,
      isPolygon: true,
      originalType: 'Point',
    });
  }
  
  console.log(`Built ${polygons.length} polygons using advanced algorithms`);
  return polygons;
};

// Validate and repair polygon coordinates
export const validatePolygon = (coords: [number, number][]): [number, number][] | null => {
  if (!coords || coords.length < 3) return null;
  
  // Remove duplicate consecutive points
  const cleaned: [number, number][] = [coords[0]];
  for (let i = 1; i < coords.length; i++) {
    const prev = cleaned[cleaned.length - 1];
    const curr = coords[i];
    if (Math.abs(prev[0] - curr[0]) > 1e-9 || Math.abs(prev[1] - curr[1]) > 1e-9) {
      cleaned.push(curr);
    }
  }
  
  if (cleaned.length < 3) return null;
  
  // Ensure closed
  const first = cleaned[0];
  const last = cleaned[cleaned.length - 1];
  if (Math.abs(first[0] - last[0]) > 1e-9 || Math.abs(first[1] - last[1]) > 1e-9) {
    cleaned.push([...first]);
  }
  
  return cleaned;
};
