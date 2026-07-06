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

/**
 * Relief above the parcel's lowest point, applied at real 1:1 scale (the plane
 * is sized in meters) but clamped so DEM decode/resample spikes can't explode
 * the surface into white noise — real parcels rarely exceed a few tens of
 * meters of relief across their extent.
 */
export const MAX_RELIEF_M = 45;
export function normalizeElevations(heights: Float32Array | number[]): { min: number; relief: Float32Array } {
  const arr = heights instanceof Float32Array ? heights : Float32Array.from(heights);
  let min = Infinity;
  for (let i = 0; i < arr.length; i++) if (arr[i] < min && Number.isFinite(arr[i])) min = arr[i];
  if (!Number.isFinite(min)) min = 0;
  const relief = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    const d = Number.isFinite(arr[i]) ? arr[i] - min : 0;
    relief[i] = Math.max(0, Math.min(MAX_RELIEF_M, d));
  }
  return { min, relief };
}

const ELEV_TILE_PX = 256; // terrain-rgb native tile size

/**
 * Crop-and-resample an elevation grid down to the parcel's actual extent.
 *
 * The previous code stretched a WHOLE zoom-15 tile (~1.2 km across) over the
 * parcel plane (~200-660 m), so ~1.2 km of relief was compressed onto a few
 * hundred metres → wildly exaggerated, unreal slopes. Cropping to the parcel
 * bbox means the plane only shows the relief that actually exists inside the
 * lot (near-flat for flat parcels). Pure + testable.
 */
export function cropResampleElevation(
  grid: Float32Array, gridPx: number,
  centerPxX: number, centerPxY: number, cropPx: number, outRes: number,
): Float32Array {
  const out = new Float32Array(outRes * outRes);
  const startX = centerPxX - cropPx / 2;
  const startY = centerPxY - cropPx / 2;
  for (let r = 0; r < outRes; r++) {
    for (let c = 0; c < outRes; c++) {
      const gx = Math.round(startX + (c / (outRes - 1)) * cropPx);
      const gy = Math.round(startY + (r / (outRes - 1)) * cropPx);
      const cx = Math.max(0, Math.min(gridPx - 1, gx));
      const cy = Math.max(0, Math.min(gridPx - 1, gy));
      out[r * outRes + c] = grid[cy * gridPx + cx];
    }
  }
  return out;
}

function decodeTileToElevations(img: HTMLImageElement): Float32Array {
  const c = document.createElement('canvas');
  c.width = ELEV_TILE_PX; c.height = ELEV_TILE_PX;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, ELEV_TILE_PX, ELEV_TILE_PX);
  const data = ctx.getImageData(0, 0, ELEV_TILE_PX, ELEV_TILE_PX).data;
  const h = new Float32Array(ELEV_TILE_PX * ELEV_TILE_PX);
  for (let i = 0; i < h.length; i++) h[i] = decodeRGBElevation(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
  return h;
}

function loadTerrainTile(tx: number, ty: number, token: string): Promise<Float32Array | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(decodeTileToElevations(img));
    img.onerror = () => resolve(null);
    img.src = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${ELEV_ZOOM}/${tx}/${ty}.pngraw?access_token=${token}`;
  });
}

/**
 * Loads a 3×3 grid of zoom-15 terrain tiles, stitches their decoded elevations,
 * then crops+resamples to the parcel extent so relief is true-to-the-lot.
 */
async function loadElevationTile(lat: number, lng: number, planeSize: number, token: string): Promise<Float32Array> {
  const zeros = new Float32Array(TERRAIN_RES * TERRAIN_RES);
  if (!token) return zeros;

  const { tileX, tileY, fracX, fracY } = lngLatToTileFraction(lng, lat, ELEV_ZOOM);
  const tileMeters = tileSizeMeters(lat, ELEV_ZOOM);

  const tiles = await Promise.all(
    [-1, 0, 1].flatMap((dy) => [-1, 0, 1].map((dx) =>
      loadTerrainTile(tileX + dx, tileY + dy, token).then((t) => ({ t, dx, dy })),
    )),
  );
  if (tiles.every((x) => x.t === null)) return zeros;

  // Stitch into a 3×256 grid (row 0 = north).
  const gridPx = ELEV_TILE_PX * 3;
  const grid = new Float32Array(gridPx * gridPx);
  for (const { t, dx, dy } of tiles) {
    if (!t) continue;
    const ox = (dx + 1) * ELEV_TILE_PX;
    const oy = (dy + 1) * ELEV_TILE_PX;
    for (let y = 0; y < ELEV_TILE_PX; y++) {
      for (let x = 0; x < ELEV_TILE_PX; x++) {
        grid[(oy + y) * gridPx + (ox + x)] = t[y * ELEV_TILE_PX + x];
      }
    }
  }

  const centerPxX = (1 + fracX) * ELEV_TILE_PX;
  const centerPxY = (1 + fracY) * ELEV_TILE_PX;
  const cropPx = planeSize * (ELEV_TILE_PX / tileMeters);
  return cropResampleElevation(grid, gridPx, centerPxX, centerPxY, cropPx, TERRAIN_RES);
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
  // Escape ONLY the brackets — Mapbox requires literal commas inside the bbox
  // segment and returns 404 if they are percent-encoded.
  const bbox = `%5B${minLng},${minLat},${maxLng},${maxLat}%5D`;
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
      loadElevationTile(lat, lng, size, mapboxToken).then((heights) => {
        const { min, relief } = normalizeElevations(heights);
        setBaseElevation(min);
        onElevationLoaded?.(min);
        // Real 1:1 relief (clamped so DEM spikes don't explode the surface).
        setHeightData(relief);
      }).catch(() => setHeightData(new Float32Array(TERRAIN_RES * TERRAIN_RES).fill(0)));
    }, [lat, lng, size, mapboxToken]);

    // Load satellite texture (cropped approach)
    useEffect(() => {
      // While the Mapbox token is still loading (empty string from the parent),
      // stay in the "loading" state instead of flashing the error banner.
      if (!mapboxToken) { onTextureLoading?.(true); return; }
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
            {/* The `key` forces React to REMOUNT the material when the texture
                arrives (null → texture). Without it R3F reuses the same
                material instance and only sets material.map, but the shader was
                already compiled without USE_MAP, so the map is ignored and the
                ground renders as the flat white base colour — the reported bug. */}
            <meshBasicMaterial
              key={texture ? texture.uuid : 'flat'}
              map={texture ?? undefined}
              color={texture ? '#ffffff' : '#5D8233'}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
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
