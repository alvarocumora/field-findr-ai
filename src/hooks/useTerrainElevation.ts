import { useState, useCallback, useRef } from 'react';

interface ElevationData {
  elevationAvg: number;
  elevationMin: number;
  elevationMax: number;
  slopeCategory: 'flat' | 'slight' | 'steep';
  slopeDegrees: number;
}

const cache = new Map<string, ElevationData>();

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * Decode Mapbox Terrain-RGB tile pixel to elevation in meters.
 * Formula: height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
 */
function decodeRGBElevation(r: number, g: number, b: number): number {
  return -10000 + (r * 256 * 256 + g * 256 + b) * 0.1;
}

function lngLatToTile(lng: number, lat: number, zoom: number): { x: number; y: number; px: number; py: number } {
  const n = Math.pow(2, zoom);
  const xTile = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const yTile = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  
  const xFrac = (((lng + 180) / 360) * n) - xTile;
  const yFrac = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n) - yTile;
  
  return { x: xTile, y: yTile, px: Math.floor(xFrac * 256), py: Math.floor(yFrac * 256) };
}

async function getElevationAtPoint(lat: number, lng: number, zoom = 14): Promise<number> {
  const { x, y, px, py } = lngLatToTile(lng, lat, zoom);
  const url = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${zoom}/${x}/${y}.pngraw?access_token=${MAPBOX_TOKEN}`;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const pixel = ctx.getImageData(px, py, 1, 1).data;
      resolve(decodeRGBElevation(pixel[0], pixel[1], pixel[2]));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function classifySlope(degrees: number): 'flat' | 'slight' | 'steep' {
  if (degrees < 5) return 'flat';
  if (degrees < 15) return 'slight';
  return 'steep';
}

export const useTerrainElevation = () => {
  const [data, setData] = useState<ElevationData | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(false);

  const getElevation = useCallback(async (polygon: number[][] | null, lotId?: string) => {
    if (!polygon || polygon.length < 3 || !MAPBOX_TOKEN) return null;

    const cacheKey = lotId || polygon.map(p => `${p[0].toFixed(6)},${p[1].toFixed(6)}`).join('|');
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!;
      setData(cached);
      return cached;
    }

    setLoading(true);
    abortRef.current = false;

    try {
      // Sample points from polygon (corners + centroid)
      const samplePoints = polygon.slice(0, Math.min(polygon.length, 8));
      const cx = polygon.reduce((s, p) => s + p[0], 0) / polygon.length;
      const cy = polygon.reduce((s, p) => s + p[1], 0) / polygon.length;
      samplePoints.push([cx, cy]);

      const elevations = await Promise.all(
        samplePoints.map(([lng, lat]) => getElevationAtPoint(lat, lng))
      );

      if (abortRef.current) return null;

      const elevationAvg = elevations.reduce((a, b) => a + b, 0) / elevations.length;
      const elevationMin = Math.min(...elevations);
      const elevationMax = Math.max(...elevations);

      // Calculate approximate slope from elevation range and polygon extent
      const lngs = polygon.map(p => p[0]);
      const lats = polygon.map(p => p[1]);
      const dLng = (Math.max(...lngs) - Math.min(...lngs)) * 111320 * Math.cos((cy * Math.PI) / 180);
      const dLat = (Math.max(...lats) - Math.min(...lats)) * 110540;
      const horizontalDist = Math.sqrt(dLng * dLng + dLat * dLat);
      const slopeDegrees = horizontalDist > 0
        ? Math.atan((elevationMax - elevationMin) / horizontalDist) * (180 / Math.PI)
        : 0;

      const result: ElevationData = {
        elevationAvg: Math.round(elevationAvg),
        elevationMin: Math.round(elevationMin),
        elevationMax: Math.round(elevationMax),
        slopeCategory: classifySlope(slopeDegrees),
        slopeDegrees: Math.round(slopeDegrees * 10) / 10,
      };

      cache.set(cacheKey, result);
      setData(result);
      return result;
    } catch (err) {
      console.error('Terrain elevation error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, getElevation };
};

export const SLOPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  flat: { label: 'Plano', color: 'text-green-500', icon: '⬜' },
  slight: { label: 'Pendiente suave', color: 'text-yellow-500', icon: '⬔' },
  steep: { label: 'Pendiente fuerte', color: 'text-red-500', icon: '▲' },
};
