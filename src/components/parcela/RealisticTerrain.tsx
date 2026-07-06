import { useEffect, useState, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import * as THREE from 'three';
import { normalizePolygon, type NormalizedPolygon } from '@/lib/polygonUtils';

interface RealisticTerrainProps {
  polygon: number[][] | null;
  latitude?: number;
  longitude?: number;
  mapboxToken: string;
  onElevationLoaded?: (baseElevation: number) => void;
  onTextureLoading?: (loading: boolean) => void;
  onTextureError?: (error: boolean) => void;
  onDebugInfo?: (info: TerrainDebugInfo) => void;
}

export interface TerrainHandle {
  getHeightAt: (x: number, z: number) => number;
}

export interface TerrainDebugInfo {
  lat: number;
  lng: number;
  zoom: number;
  tileMeters: number;
  planeSize: number;
  tilesLoaded: number;
  tilesTotal: number;
  textureApplied: boolean;
  canvasDataUrl?: string;
}

const TERRAIN_RES = 128;
const ELEV_ZOOM = 15;
const SAT_ZOOM = 18;

function lngLatToTileFraction(lng: number, lat: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const xFull = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const yFull = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { tileX: Math.floor(xFull), tileY: Math.floor(yFull), fracX: xFull - Math.floor(xFull), fracY: yFull - Math.floor(yFull) };
}

function tileSizeMeters(lat: number, zoom: number): number {
  return (40075016.7 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
}

function decodeRGBElevation(r: number, g: number, b: number): number {
  return -10000 + (r * 256 * 256 + g * 256 + b) * 0.1;
}

async function loadElevationTile(lat: number, lng: number, token: string): Promise<Float32Array> {
  const { tileX, tileY } = lngLatToTileFraction(lng, lat, ELEV_ZOOM);
  if (!token) return new Float32Array(TERRAIN_RES * TERRAIN_RES);
  const url = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${ELEV_ZOOM}/${tileX}/${tileY}.pngraw?access_token=${token}`;
  return new Promise<Float32Array>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = TERRAIN_RES; c.height = TERRAIN_RES;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0, TERRAIN_RES, TERRAIN_RES);
      const data = ctx.getImageData(0, 0, TERRAIN_RES, TERRAIN_RES).data;
      const h = new Float32Array(TERRAIN_RES * TERRAIN_RES);
      for (let i = 0; i < h.length; i++) h[i] = decodeRGBElevation(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
      resolve(h);
    };
    img.onerror = () => resolve(new Float32Array(TERRAIN_RES * TERRAIN_RES));
    img.src = url;
  });
}

/**
 * Meters → degrees deltas at a given latitude (local flat-earth approximation,
 * accurate at parcel scale).
 */
export function bboxForPlane(lat: number, lng: number, planeSize: number) {
  const half = planeSize / 2;
  const metersPerDegLat = 110540;
  const metersPerDegLng = 111320 * Math.cos((lat * Math.PI) / 180);
  const dLat = half / metersPerDegLat;
  const dLng = half / metersPerDegLng;
  return { minLng: lng - dLng, minLat: lat - dLat, maxLng: lng + dLng, maxLat: lat + dLat };
}

/**
 * Loads the satellite ground as a SINGLE Mapbox Static Images request for the
 * parcel's exact bounding box. This replaces the old 3×3 tile stitch + crop,
 * whose @2x/256-vs-512px math cropped off-canvas in production and left the
 * ground blank (white). One bbox image maps 1:1 to the plane, north-up, with
 * default UVs — no stitching, no zoom offsets.
 */
export function staticSatelliteUrl(lat: number, lng: number, planeSize: number, token: string): string {
  const { minLng, minLat, maxLng, maxLat } = bboxForPlane(lat, lng, planeSize);
  const px = 1024; // logical; @2x → 2048 actual, Mapbox max
  // URL-encode the bbox brackets so strict URL parsers (some CDNs/browsers)
  // do not reject the request; raw `[` `]` are reserved characters.
  const bbox = encodeURIComponent(`[${minLng},${minLat},${maxLng},${maxLat}]`);
  return (
    `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${bbox}/${px}x${px}@2x` +
    `?access_token=${token}&attribution=false&logo=false`
  );
}

async function loadStaticSatelliteTexture(
  lat: number, lng: number, planeSize: number, token: string
): Promise<{ texture: THREE.Texture; tilesLoaded: number; canvasDataUrl: string } | null> {
  if (!token) return null;

  const url = staticSatelliteUrl(lat, lng, planeSize, token);

  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => { console.warn('❌ Static satellite image failed'); resolve(null); };
    image.src = url;
  });
  if (!img) return null;

  // Draw onto a canvas so we can build a debug preview and control filtering.
  const fallbackPx = 2048; // matches @2x of 1024 logical px
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || fallbackPx;
  canvas.height = img.naturalHeight || fallbackPx;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const prev = document.createElement('canvas');
  prev.width = 128; prev.height = 128;
  prev.getContext('2d')!.drawImage(canvas, 0, 0, 128, 128);
  const canvasDataUrl = prev.toDataURL('image/jpeg', 0.6);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;

  console.log('🛰️ Static satellite loaded:', { planeSize: Math.round(planeSize), url });
  return { texture: tex, tilesLoaded: 1, canvasDataUrl };
}

export const RealisticTerrain = forwardRef<TerrainHandle, RealisticTerrainProps>(
  ({ polygon, latitude, longitude, mapboxToken, onElevationLoaded, onTextureLoading, onTextureError, onDebugInfo }, ref) => {
    const [heightData, setHeightData] = useState<Float32Array | null>(null);
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    const [baseElevation, setBaseElevation] = useState(0);

    // Use normalizePolygon as single source of truth
    const norm: NormalizedPolygon = useMemo(
      () => normalizePolygon(polygon, latitude, longitude),
      [polygon, latitude, longitude]
    );

    const lat = norm.centroidLat;
    const lng = norm.centroidLng;
    const size = norm.terrainSize;

    // Load elevation
    useEffect(() => {
      if (!mapboxToken) { setHeightData(new Float32Array(TERRAIN_RES * TERRAIN_RES).fill(0)); return; }
      loadElevationTile(lat, lng, mapboxToken).then((heights) => {
        const min = Math.min(...Array.from(heights));
        setBaseElevation(min);
        onElevationLoaded?.(min);
        // Real vertical scale: the plane is sized in meters (1 three.js unit =
        // 1 m), so elevation is applied 1:1 — "Relieve Real" now shows true
        // relief instead of the old ×0.005 that flattened everything.
        const normalized = new Float32Array(heights.length);
        for (let i = 0; i < heights.length; i++) normalized[i] = heights[i] - min;
        setHeightData(normalized);
      }).catch(() => setHeightData(new Float32Array(TERRAIN_RES * TERRAIN_RES).fill(0)));
    }, [lat, lng, mapboxToken]);

    // Load satellite texture (cropped approach)
    useEffect(() => {
      if (!mapboxToken) { onTextureError?.(true); return; }
      onTextureLoading?.(true);
      onTextureError?.(false);
      setTexture(null);

      loadStaticSatelliteTexture(lat, lng, size, mapboxToken).then((result) => {
        if (result) {
          setTexture(result.texture);
          onTextureError?.(false);
          onDebugInfo?.({
            lat, lng, zoom: SAT_ZOOM, tileMeters: Math.round(tileSizeMeters(lat, SAT_ZOOM)),
            planeSize: Math.round(size), tilesLoaded: result.tilesLoaded, tilesTotal: 1,
            textureApplied: true, canvasDataUrl: result.canvasDataUrl,
          });
        } else {
          onTextureError?.(true);
          onDebugInfo?.({
            lat, lng, zoom: SAT_ZOOM, tileMeters: Math.round(tileSizeMeters(lat, SAT_ZOOM)),
            planeSize: Math.round(size), tilesLoaded: 0, tilesTotal: 1, textureApplied: false,
          });
        }
        onTextureLoading?.(false);
      }).catch(() => { onTextureError?.(true); onTextureLoading?.(false); });

      return () => { texture?.dispose(); };
    }, [lat, lng, mapboxToken, size]);

    const geometry = useMemo(() => {
      const geo = new THREE.PlaneGeometry(size, size, TERRAIN_RES - 1, TERRAIN_RES - 1);
      if (heightData && heightData.length === TERRAIN_RES * TERRAIN_RES) {
        const positions = geo.attributes.position;
        for (let i = 0; i < positions.count; i++) positions.setZ(i, heightData[i]);
        positions.needsUpdate = true;
        geo.computeVertexNormals();
      }
      return geo;
    }, [heightData, size]);

    // Polygon contour using normalized local coords
    const contourPositions = useMemo(() => {
      if (norm.localCoords.length === 0) return null;
      const pts: number[] = [];
      for (const [x, y] of norm.localCoords) {
        const terrainY = (() => {
          if (!heightData) return 0.2;
          const halfSize = size / 2;
          const gx = ((x + halfSize) / size) * (TERRAIN_RES - 1);
          const gz = ((-y + halfSize) / size) * (TERRAIN_RES - 1);
          const ix = Math.max(0, Math.min(TERRAIN_RES - 1, Math.round(gx)));
          const iz = Math.max(0, Math.min(TERRAIN_RES - 1, Math.round(gz)));
          return (heightData[iz * TERRAIN_RES + ix] || 0) + 0.3;
        })();
        pts.push(x, terrainY, -y);
      }
      return new Float32Array(pts);
    }, [norm.localCoords, heightData, size]);

    const getHeightAt = useCallback((x: number, z: number): number => {
      if (!heightData) return 0;
      const halfSize = size / 2;
      const gx = ((x + halfSize) / size) * (TERRAIN_RES - 1);
      const gz = ((-z + halfSize) / size) * (TERRAIN_RES - 1);
      const ix = Math.max(0, Math.min(TERRAIN_RES - 1, Math.round(gx)));
      const iz = Math.max(0, Math.min(TERRAIN_RES - 1, Math.round(gz)));
      return heightData[iz * TERRAIN_RES + ix] || 0;
    }, [heightData, size]);

    useImperativeHandle(ref, () => ({ getHeightAt }), [getHeightAt]);

    return (
      <>
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <mesh geometry={geometry} receiveShadow>
            {texture ? (
              <meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} />
            ) : (
              <meshBasicMaterial color="#5D8233" side={THREE.DoubleSide} toneMapped={false} />
            )}
          </mesh>
        </group>

        {/* Lot polygon contour — neon green */}
        {contourPositions && contourPositions.length >= 9 && (
          <>
            <lineLoop>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={contourPositions.length / 3} array={contourPositions} itemSize={3} />
              </bufferGeometry>
              <lineBasicMaterial color="#00FF88" linewidth={3} transparent opacity={0.4} />
            </lineLoop>
            <lineLoop>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={contourPositions.length / 3} array={contourPositions} itemSize={3} />
              </bufferGeometry>
              <lineBasicMaterial color="#00FF88" linewidth={2} />
            </lineLoop>
          </>
        )}
      </>
    );
  }
);

RealisticTerrain.displayName = 'RealisticTerrain';
