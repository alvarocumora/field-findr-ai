import { useEffect, useState, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import * as THREE from 'three';
import { normalizePolygon, type NormalizedPolygon } from '@/lib/polygonUtils';

interface RealisticTerrainProps {
  polygon: number[][] | null;
  /** Sibling lot rings ([lng,lat]) drawn dimmed for context. */
  neighbors?: number[][][];
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
/**
 * Project a [lng,lat] ring into the LOCAL metre frame of the parcel — centred
 * on the parcel centroid, x=east, y=north. Used to place sibling lots in the
 * same coordinate system as the main lot (they share one centroid, unlike
 * normalizePolygon which re-centres each ring on its own centroid).
 */
export function projectRingToLocal(
  ring: number[][], centroidLng: number, centroidLat: number,
): [number, number][] {
  const mLng = 111320 * Math.cos((centroidLat * Math.PI) / 180);
  const mLat = 110540;
  return ring.map(([lng, lat]) => [(lng - centroidLng) * mLng, (lat - centroidLat) * mLat]);
}

/** Ray-cast point-in-ring test on local [x,y] coordinates. */
export function pointInRing(x: number, y: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Deterministic pseudo-random in [0,1) from an integer seed (stable across renders). */
export function hashRand(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Subdivide a ring so no edge is longer than maxLen metres. Long straight
 * chords between polygon corners are what made the draped lot float above (or
 * sink into) curved hillsides: with only corner samples, an 80 m edge renders
 * as one straight line regardless of the relief under it.
 */
export function subdivideRing(ring: [number, number][], maxLen: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < ring.length; i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[(i + 1) % ring.length];
    const len = Math.hypot(bx - ax, by - ay);
    const steps = Math.max(1, Math.ceil(len / maxLen));
    for (let s = 0; s < steps; s++) {
      out.push([ax + ((bx - ax) * s) / steps, ay + ((by - ay) * s) / steps]);
    }
  }
  return out;
}

/**
 * Terrain-hugging fill for the lot: tessellate the polygon at the resolution
 * of the elevation grid (cells whose centre falls inside the ring) so the
 * translucent surface follows the real relief instead of being a flat fan.
 * Returns interleaved xyz world positions (y up, z = -north).
 */
export function gridFillPositions(
  ring: [number, number][], size: number, res: number,
  heightAt: (x: number, y: number) => number, lift: number,
): Float32Array | null {
  if (ring.length < 3) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const cell = size / (res - 1);
  const half = size / 2;
  const c0 = Math.max(0, Math.floor((minX + half) / cell) - 1);
  const c1 = Math.min(res - 2, Math.ceil((maxX + half) / cell));
  const r0 = Math.max(0, Math.floor((minY + half) / cell) - 1);
  const r1 = Math.min(res - 2, Math.ceil((maxY + half) / cell));
  const pts: number[] = [];
  const push = (x: number, y: number) => pts.push(x, heightAt(x, y) + lift, -y);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const x0 = -half + c * cell, y0 = -half + r * cell;
      const x1 = x0 + cell, y1 = y0 + cell;
      if (!pointInRing((x0 + x1) / 2, (y0 + y1) / 2, ring)) continue;
      push(x0, y0); push(x1, y0); push(x1, y1);
      push(x0, y0); push(x1, y1); push(x0, y1);
    }
  }
  return pts.length ? new Float32Array(pts) : null;
}

/** Bilinear sample of a square grid at fractional pixel (fx, fy), edge-clamped. */
export function sampleGridBilinear(grid: Float32Array, gridPx: number, fx: number, fy: number): number {
  const clamp = (v: number) => Math.max(0, Math.min(gridPx - 1, v));
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const tx = fx - x0, ty = fy - y0;
  const cx0 = clamp(x0), cy0 = clamp(y0), cx1 = clamp(x0 + 1), cy1 = clamp(y0 + 1);
  const v00 = grid[cy0 * gridPx + cx0], v10 = grid[cy0 * gridPx + cx1];
  const v01 = grid[cy1 * gridPx + cx0], v11 = grid[cy1 * gridPx + cx1];
  return v00 * (1 - tx) * (1 - ty) + v10 * tx * (1 - ty) + v01 * (1 - tx) * ty + v11 * tx * ty;
}

export function cropResampleElevation(
  grid: Float32Array, gridPx: number,
  centerPxX: number, centerPxY: number, cropPx: number, outRes: number,
): Float32Array {
  const out = new Float32Array(outRes * outRes);
  const startX = centerPxX - cropPx / 2;
  const startY = centerPxY - cropPx / 2;
  for (let r = 0; r < outRes; r++) {
    for (let c = 0; c < outRes; c++) {
      // Bilinear sampling smooths the low-resolution DEM crop, so the surface
      // (and object snapping) is no longer stair-stepped/nearest.
      const fx = startX + (c / (outRes - 1)) * cropPx;
      const fy = startY + (r / (outRes - 1)) * cropPx;
      out[r * outRes + c] = sampleGridBilinear(grid, gridPx, fx, fy);
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

/**
 * Esri World Imagery export — a single satellite image for the exact bbox, no
 * API key, CORS-enabled. Used as a fallback when Mapbox has no token or fails.
 */
export function esriSatelliteUrl(lat: number, lng: number, planeSize: number): string {
  const { minLng, minLat, maxLng, maxLat } = bboxForPlane(lat, lng, planeSize);
  const px = 1024;
  return (
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export' +
    `?bbox=${minLng},${minLat},${maxLng},${maxLat}&bboxSR=4326&imageSR=4326` +
    `&size=${px},${px}&format=jpg&f=image`
  );
}

/** Ordered satellite providers: Mapbox first (if token), Esri as key-less fallback. */
export function satelliteProviders(lat: number, lng: number, planeSize: number, token: string) {
  const providers: { name: string; url: string }[] = [];
  if (token) providers.push({ name: 'mapbox', url: staticSatelliteUrl(lat, lng, planeSize, token) });
  providers.push({ name: 'esri', url: esriSatelliteUrl(lat, lng, planeSize) });
  return providers;
}

const loadImage = (url: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });

async function loadStaticSatelliteTexture(
  lat: number, lng: number, planeSize: number, token: string
): Promise<{ texture: THREE.Texture; tilesLoaded: number; canvasDataUrl: string; provider: string } | null> {
  const providers = satelliteProviders(lat, lng, planeSize, token);

  let img: HTMLImageElement | null = null;
  let provider = '';
  for (const p of providers) {
    img = await loadImage(p.url);
    if (img) { provider = p.name; break; }
    console.warn(`❌ Satellite provider failed: ${p.name}`);
  }
  if (!img) return null;

  // Draw onto a canvas so we can build a debug preview and control filtering.
  const fallbackPx = 2048;
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

  console.log('🛰️ Static satellite loaded:', { planeSize: Math.round(planeSize), provider });
  return { texture: tex, tilesLoaded: 1, canvasDataUrl, provider };
}

export const RealisticTerrain = forwardRef<TerrainHandle, RealisticTerrainProps>(
  ({ polygon, neighbors, latitude, longitude, mapboxToken, onElevationLoaded, onTextureLoading, onTextureError, onDebugInfo }, ref) => {
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

    // Load satellite texture (multi-provider: Mapbox → Esri fallback). Works
    // even without a Mapbox token (Esri needs no key), so the ground still gets
    // real imagery — only the elevation relief requires the Mapbox DEM.
    useEffect(() => {
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

    // Bilinear terrain height at a LOCAL (x=east, y=north) point in meters.
    const heightAtLocal = useCallback((x: number, y: number): number => {
      if (!heightData) return 0;
      const halfSize = size / 2;
      const fx = ((x + halfSize) / size) * (TERRAIN_RES - 1);
      const fy = ((halfSize - y) / size) * (TERRAIN_RES - 1);
      return sampleGridBilinear(heightData, TERRAIN_RES, fx, fy);
    }, [heightData, size]);

    // Polygon contour draped on the terrain (local coords → world x, h, -y).
    // Edges are subdivided every few metres so the line follows the relief —
    // corner-only sampling drew straight chords that floated over valleys and
    // cut through hills on sloped parcels.
    const DRAPE_STEP = 4; // metres between terrain samples along lot edges
    const contourPositions = useMemo(() => {
      if (norm.localCoords.length === 0) return null;
      const pts: number[] = [];
      for (const [x, y] of subdivideRing(norm.localCoords, DRAPE_STEP)) {
        pts.push(x, heightAtLocal(x, y) + 0.4, -y);
      }
      return new Float32Array(pts);
    }, [norm.localCoords, heightAtLocal]);

    // Translucent fill that hugs the relief (tessellated at the elevation-grid
    // resolution) + a vertical skirt so the lot reads as a 3D volume.
    const { fillPositions, wallPositions } = useMemo(() => {
      const lc = norm.localCoords;
      if (lc.length < 3) return { fillPositions: null, wallPositions: null };
      const fill = gridFillPositions(lc, size, TERRAIN_RES, heightAtLocal, 0.3);
      const wall: number[] = [];
      const SKIRT = 3; // metres the wall drops below the boundary
      const ring = subdivideRing(lc, DRAPE_STEP);
      for (let i = 0; i < ring.length; i++) {
        const [ax, ay] = ring[i];
        const [bx, by] = ring[(i + 1) % ring.length];
        const aH = heightAtLocal(ax, ay) + 0.3;
        const bH = heightAtLocal(bx, by) + 0.3;
        wall.push(
          ax, aH, -ay, bx, bH, -by, bx, bH - SKIRT, -by,
          ax, aH, -ay, bx, bH - SKIRT, -by, ax, aH - SKIRT, -ay,
        );
      }
      return { fillPositions: fill, wallPositions: new Float32Array(wall) };
    }, [norm.localCoords, size, heightAtLocal]);

    // Neighbouring lots (dimmed outlines) projected into this lot's local frame
    // and draped on the terrain — the surrounding loteo context.
    const neighborSegments = useMemo(() => {
      if (!neighbors?.length || !heightData) return null;
      const half = size / 2;
      const seg: number[] = [];
      for (const ring of neighbors) {
        if (!Array.isArray(ring) || ring.length < 3) continue;
        const raw = projectRingToLocal(ring, lng, lat);
        // Skip rings entirely outside the terrain plane.
        if (!raw.some(([x, y]) => Math.abs(x) <= half && Math.abs(y) <= half)) continue;
        const local = subdivideRing(raw, 6);
        for (let i = 0; i < local.length; i++) {
          const [ax, ay] = local[i];
          const [bx, by] = local[(i + 1) % local.length];
          seg.push(ax, heightAtLocal(ax, ay) + 0.25, -ay, bx, heightAtLocal(bx, by) + 0.25, -by);
        }
      }
      return seg.length ? new Float32Array(seg) : null;
    }, [neighbors, heightData, size, lat, lng, heightAtLocal]);

    // Basic vegetation: deterministic scatter of low-poly trees on the terrain
    // OUTSIDE the lot, for environmental context (not inside the buildable lot).
    const vegetation = useMemo(() => {
      if (!heightData || norm.localCoords.length < 3) return [];
      const half = size / 2;
      const out: { pos: [number, number, number]; scale: number }[] = [];
      for (let i = 0; i < 600 && out.length < 26; i++) {
        const x = (hashRand(i * 2 + 1) * 2 - 1) * half * 0.92;
        const y = (hashRand(i * 2 + 2) * 2 - 1) * half * 0.92;
        if (pointInRing(x, y, norm.localCoords)) continue; // keep the lot clear
        out.push({ pos: [x, heightAtLocal(x, y), -y], scale: 0.7 + hashRand(i * 3 + 5) * 0.8 });
      }
      return out;
    }, [heightData, size, norm.localCoords, heightAtLocal]);

    // World getHeightAt(x, z): local y = -z.
    const getHeightAt = useCallback((x: number, z: number): number => heightAtLocal(x, -z), [heightAtLocal]);

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

        {/* Neighbouring lots — dimmed outlines draped on the terrain. */}
        {neighborSegments && neighborSegments.length >= 6 && (
          <lineSegments renderOrder={0}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" count={neighborSegments.length / 3} array={neighborSegments} itemSize={3} />
            </bufferGeometry>
            <lineBasicMaterial color="#dbeafe" transparent opacity={0.35} toneMapped={false} />
          </lineSegments>
        )}

        {/* Basic vegetation scatter outside the lot (low-poly conifers). */}
        {vegetation.map((t, i) => (
          <group key={`veg-${i}`} position={t.pos} scale={t.scale}>
            <mesh position={[0, 1.1, 0]}>
              <coneGeometry args={[0.9, 2.4, 6]} />
              <meshBasicMaterial color="#2f6b34" toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.14, 0.18, 0.5, 5]} />
              <meshBasicMaterial color="#5b3d24" toneMapped={false} />
            </mesh>
          </group>
        ))}

        {/* Lot as a 3D volume: translucent draped fill + vertical skirt walls. */}
        {fillPositions && fillPositions.length >= 9 && (
          <mesh renderOrder={1}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" count={fillPositions.length / 3} array={fillPositions} itemSize={3} />
            </bufferGeometry>
            <meshBasicMaterial color="#00FF88" transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
          </mesh>
        )}
        {wallPositions && wallPositions.length >= 9 && (
          <mesh renderOrder={2}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" count={wallPositions.length / 3} array={wallPositions} itemSize={3} />
            </bufferGeometry>
            <meshBasicMaterial color="#00E57A" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
          </mesh>
        )}

        {/* Lot polygon contour — neon green. depthTest is disabled so the lot
            boundary always draws on top of the relief (a cadastral overlay),
            instead of being hidden behind hills once the terrain has real 3D
            elevation — the reason the outline vanished after cropping the DEM. */}
        {contourPositions && contourPositions.length >= 9 && (
          <lineLoop renderOrder={999}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" count={contourPositions.length / 3} array={contourPositions} itemSize={3} />
            </bufferGeometry>
            <lineBasicMaterial color="#00FF88" depthTest={false} transparent toneMapped={false} />
          </lineLoop>
        )}
      </>
    );
  }
);

RealisticTerrain.displayName = 'RealisticTerrain';
