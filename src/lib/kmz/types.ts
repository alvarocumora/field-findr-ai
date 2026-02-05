// KMZ Parser Types

export interface KMLPlacemark {
  name: string;
  description?: string;
  coordinates: [number, number][];
  area?: number;
  isPolygon: boolean;
  originalType?: 'Polygon' | 'LineString' | 'LinearRing' | 'Point' | 'MultiGeometry';
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
  metadata?: {
    totalPlacemarks: number;
    polygons: number;
    lineStrings: number;
    points: number;
  };
}

export interface Segment {
  start: [number, number];
  end: [number, number];
  coords: [number, number][];
  used: boolean;
  name: string;
}

export interface LotInfo {
  lot_number: string;
  area: number;
}
