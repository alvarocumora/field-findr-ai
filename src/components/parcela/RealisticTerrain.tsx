import { useEffect, useLayoutEffect, useState, useCallback, forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
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
export const MAX_RELIEF_M = 80;
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
 * "Tree-likeness" score per cell from satellite RGBA pixels: forest reads as
 * green-dominant AND dark. Returns a res×res grid in [0,1] (row 0 = north).
 * Pure so tree placement can be tested against synthetic imagery.
 */
export function vegetationScoreGrid(rgba: Uint8ClampedArray, res: number): Float32Array {
  const out = new Float32Array(res * res);
  for (let i = 0; i < res * res; i++) {
    const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2];
    const lum = (r + g + b) / (3 * 255);
    const greenDom = (g - Math.max(r, b)) / 255; // >0 when green dominates
    const darkness = Math.max(0, 0.62 - lum) / 0.62;
    out[i] = Math.max(0, Math.min(1, greenDom * 3 + 0.15)) * darkness;
  }
  return out;
}

export interface ScatteredTree {
  x: number;
  y: number; // local north coordinate (world z = -y)
  scale: number;
  tint: number; // 0..1 foliage colour variation
}

/**
 * Deterministic tree scatter driven by the vegetation score of the imagery:
 * candidates are hash-jittered, kept only where the satellite shows vegetation
 * and OUTSIDE the lot ring (the buildable lot stays clear). Pure + testable.
 */
export function scatterTrees(
  score: Float32Array, scoreRes: number, size: number,
  ring: [number, number][], maxCount: number, minScore = 0.18,
): ScatteredTree[] {
  const half = size / 2;
  const out: ScatteredTree[] = [];
  const attempts = maxCount * 14;
  for (let i = 0; i < attempts && out.length < maxCount; i++) {
    const x = (hashRand(i * 2 + 1) * 2 - 1) * half * 0.94;
    const y = (hashRand(i * 2 + 2) * 2 - 1) * half * 0.94;
    if (ring.length >= 3 && pointInRing(x, y, ring)) continue;
    // Grid lookup: col from x (west→east), row from y (north at row 0).
    const c = Math.max(0, Math.min(scoreRes - 1, Math.floor(((x + half) / size) * scoreRes)));
    const r = Math.max(0, Math.min(scoreRes - 1, Math.floor(((half - y) / size) * scoreRes)));
    const s = score[r * scoreRes + c];
    if (s < minScore) continue;
    // Denser forest → higher keep probability.
    if (hashRand(i * 5 + 7) > Math.min(1, s * 2.2)) continue;
    out.push({
      x, y,
      scale: 0.8 + hashRand(i * 3 + 5) * 1.1,
      tint: hashRand(i * 7 + 11),
    });
  }
  return out;
}

export interface EdgeLabel {
  mid: [number, number]; // local x,y at edge midpoint
  lengthM: number;
}

/**
 * One label per polygon edge (original corners, not the subdivided drape ring)
 * with the edge length in metres — the deslinde measurements a buyer actually
 * asks about. Edges shorter than minLen are skipped to avoid clutter.
 */
export function edgeLabels(ring: [number, number][], minLen = 10): EdgeLabel[] {
  if (ring.length < 3) return [];
  const out: EdgeLabel[] = [];
  for (let i = 0; i < ring.length; i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[(i + 1) % ring.length];
    const len = Math.hypot(bx - ax, by - ay);
    if (len < minLen) continue;
    out.push({ mid: [(ax + bx) / 2, (ay + by) / 2], lengthM: len });
  }
  return out;
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

const VEG_MASK_RES = 96;

async function loadStaticSatelliteTexture(
  lat: number, lng: number, planeSize: number, token: string
): Promise<{
  texture: THREE.Texture; tilesLoaded: number; canvasDataUrl: string; provider: string;
  vegScore: Float32Array;
} | null> {
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

  // Downsampled pixel grid → vegetation score, so context trees grow where
  // the imagery actually shows forest instead of at random.
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = VEG_MASK_RES; maskCanvas.height = VEG_MASK_RES;
  const maskCtx = maskCanvas.getContext('2d')!;
  maskCtx.drawImage(canvas, 0, 0, VEG_MASK_RES, VEG_MASK_RES);
  const vegScore = vegetationScoreGrid(
    maskCtx.getImageData(0, 0, VEG_MASK_RES, VEG_MASK_RES).data, VEG_MASK_RES,
  );

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  // Mipmaps + trilinear filtering: without them the 2048px image shimmers and
  // blurs at oblique camera angles (the most common view in the tour).
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;

  console.log('🛰️ Static satellite loaded:', { planeSize: Math.round(planeSize), provider });
  return { texture: tex, tilesLoaded: 1, canvasDataUrl, provider, vegScore };
}

/** Instanced low-poly conifers (one draw call per part) with colour variation. */
function InstancedTrees({ trees, heightAt }: {
  trees: ScatteredTree[];
  heightAt: (x: number, y: number) => number;
}) {
  const foliageRef = useRef<THREE.InstancedMesh>(null);
  const trunkRef = useRef<THREE.InstancedMesh>(null);

  const foliageGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(1.15, 3.4, 7);
    g.translate(0, 2.1, 0);
    return g;
  }, []);
  const trunkGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.12, 0.2, 1.1, 5);
    g.translate(0, 0.55, 0);
    return g;
  }, []);
  useEffect(() => () => { foliageGeo.dispose(); trunkGeo.dispose(); }, [foliageGeo, trunkGeo]);

  useLayoutEffect(() => {
    const foliage = foliageRef.current;
    const trunk = trunkRef.current;
    if (!foliage || !trunk) return;
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const color = new THREE.Color();
    trees.forEach((t, i) => {
      p.set(t.x, heightAt(t.x, t.y), -t.y);
      s.set(t.scale, t.scale * (0.85 + t.tint * 0.35), t.scale);
      m.compose(p, q, s);
      foliage.setMatrixAt(i, m);
      trunk.setMatrixAt(i, m);
      color.set('#3a7a3f').offsetHSL(t.tint * 0.03 - 0.015, 0.05, t.tint * 0.08 - 0.04);
      foliage.setColorAt(i, color);
    });
    foliage.instanceMatrix.needsUpdate = true;
    trunk.instanceMatrix.needsUpdate = true;
    if (foliage.instanceColor) foliage.instanceColor.needsUpdate = true;
  }, [trees, heightAt]);

  if (!trees.length) return null;
  return (
    <group key={trees.length}>
      <instancedMesh ref={foliageRef} args={[foliageGeo, undefined, trees.length]} castShadow frustumCulled={false}>
        <meshStandardMaterial color="#3a7a3f" roughness={0.9} flatShading />
      </instancedMesh>
      <instancedMesh ref={trunkRef} args={[trunkGeo, undefined, trees.length]} frustumCulled={false}>
        <meshStandardMaterial color="#5b3d24" roughness={1} />
      </instancedMesh>
    </group>
  );
}

export const RealisticTerrain = forwardRef<TerrainHandle, RealisticTerrainProps>(
  ({ polygon, neighbors, latitude, longitude, mapboxToken, onElevationLoaded, onTextureLoading, onTextureError, onDebugInfo }, ref) => {
    const [heightData, setHeightData] = useState<Float32Array | null>(null);
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    const [vegScore, setVegScore] = useState<Float32Array | null>(null);
    const { gl } = useThree();

    // Use normalizePolygon as single source of truth
    const norm: NormalizedPolygon = useMemo(
      () => normalizePolygon(polygon, latitude, longitude),
      [polygon, latitude, longitude]
    );

    const lat = norm.centroidLat;
    const lng = norm.centroidLng;
    const size = norm.terrainSize;

    // Load elevation. `cancelled` guards against a slow request for a previous
    // lot resolving after this one changed (stale DEM raced the fresh one).
    useEffect(() => {
      if (!mapboxToken) { setHeightData(new Float32Array(TERRAIN_RES * TERRAIN_RES).fill(0)); return; }
      let cancelled = false;
      loadElevationTile(lat, lng, size, mapboxToken).then((heights) => {
        if (cancelled) return;
        const { min, relief } = normalizeElevations(heights);
        onElevationLoaded?.(min);
        // Real 1:1 relief (clamped so DEM spikes don't explode the surface).
        setHeightData(relief);
      }).catch(() => { if (!cancelled) setHeightData(new Float32Array(TERRAIN_RES * TERRAIN_RES).fill(0)); });
      return () => { cancelled = true; };
    }, [lat, lng, size, mapboxToken]);

    // Load satellite texture (multi-provider: Mapbox → Esri fallback). Works
    // even without a Mapbox token (Esri needs no key), so the ground still gets
    // real imagery — only the elevation relief requires the Mapbox DEM.
    useEffect(() => {
      onTextureLoading?.(true);
      onTextureError?.(false);
      setTexture(null);
      setVegScore(null);

      let cancelled = false;
      let loaded: THREE.Texture | null = null;
      loadStaticSatelliteTexture(lat, lng, size, mapboxToken).then((result) => {
        if (cancelled) { result?.texture.dispose(); return; }
        if (result) {
          loaded = result.texture;
          loaded.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
          setTexture(loaded);
          setVegScore(result.vegScore);
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
      }).catch(() => { if (!cancelled) { onTextureError?.(true); onTextureLoading?.(false); } });

      // Dispose the texture this run actually created (the old cleanup captured
      // a stale null closure, leaking every loaded texture).
      return () => { cancelled = true; loaded?.dispose(); };
    }, [lat, lng, mapboxToken, size, gl]);

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
    // resolution). The old 3m "skirt" walls hung below the boundary — mostly
    // buried in the terrain, they only added neon clutter.
    const fillPositions = useMemo(() => {
      const lc = norm.localCoords;
      if (lc.length < 3) return null;
      return gridFillPositions(lc, size, TERRAIN_RES, heightAtLocal, 0.3);
    }, [norm.localCoords, size, heightAtLocal]);

    // Survey stakes at the lot corners + one length label per edge: the
    // deslinde data a buyer actually reads on a plano.
    const cornerStakes = useMemo(() => {
      if (norm.localCoords.length < 3 || !heightData) return [];
      return norm.localCoords.map(([x, y]) => ({
        pos: [x, heightAtLocal(x, y), -y] as [number, number, number],
      }));
    }, [norm.localCoords, heightData, heightAtLocal]);

    const edgeLabelSprites = useMemo(() => {
      if (norm.localCoords.length < 3 || !heightData) return [];
      return edgeLabels(norm.localCoords, 10).map(({ mid: [x, y], lengthM }) => {
        const text = `${Math.round(lengthM)} m`;
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d');
        if (!ctx) return null;
        const fontPx = 56;
        ctx.font = `700 ${fontPx}px system-ui, sans-serif`;
        const w = Math.ceil(ctx.measureText(text).width) + 44;
        const h = fontPx + 34;
        c.width = w; c.height = h;
        const rctx = c.getContext('2d')!;
        rctx.fillStyle = 'rgba(15, 40, 24, 0.78)';
        rctx.beginPath();
        rctx.roundRect(0, 0, w, h, h / 2);
        rctx.fill();
        rctx.font = `700 ${fontPx}px system-ui, sans-serif`;
        rctx.textAlign = 'center';
        rctx.textBaseline = 'middle';
        rctx.fillStyle = '#eafff2';
        rctx.fillText(text, w / 2, h / 2 + 2);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        const worldH = 2.4;
        return {
          pos: [x, heightAtLocal(x, y) + 2.6, -y] as [number, number, number],
          tex,
          scale: [(w / h) * worldH, worldH, 1] as [number, number, number],
        };
      }).filter((s): s is NonNullable<typeof s> => s !== null);
    }, [norm.localCoords, heightData, heightAtLocal]);

    // Dispose label textures when they are replaced.
    useEffect(() => () => { edgeLabelSprites.forEach((s) => s.tex.dispose()); }, [edgeLabelSprites]);

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

    // Context vegetation: trees grow where the satellite imagery shows forest
    // (vegetation score), never inside the lot. Count scales with plane size.
    const vegetation = useMemo(() => {
      if (!heightData || !vegScore || norm.localCoords.length < 3) return [];
      const maxTrees = Math.min(140, Math.max(40, Math.round(size / 3)));
      return scatterTrees(vegScore, VEG_MASK_RES, size, norm.localCoords, maxTrees);
    }, [heightData, vegScore, size, norm.localCoords]);

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
                ground renders as the flat white base colour — the reported bug.
                Lit material (not basic): the DEM normals produce hillshade and
                objects cast shadows onto the ground, so relief is visible. */}
            <meshStandardMaterial
              key={texture ? texture.uuid : 'flat'}
              map={texture ?? undefined}
              color={texture ? '#ffffff' : '#5D8233'}
              side={THREE.DoubleSide}
              roughness={0.95}
              metalness={0}
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

        {/* Context forest, placed by the imagery's vegetation score. */}
        <InstancedTrees trees={vegetation} heightAt={heightAtLocal} />

        {/* Soft draped fill so the lot reads as a surface, not a neon sticker. */}
        {fillPositions && fillPositions.length >= 9 && (
          <mesh renderOrder={1}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" count={fillPositions.length / 3} array={fillPositions} itemSize={3} />
            </bufferGeometry>
            <meshBasicMaterial color="#34d399" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
          </mesh>
        )}

        {/* Lot boundary, twice: a solid line that respects the terrain depth,
            plus a faint x-ray pass so the deslinde never fully disappears
            behind a hill — without the old always-on-top neon glow. */}
        {contourPositions && contourPositions.length >= 9 && (
          <>
            <lineLoop renderOrder={3}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={contourPositions.length / 3} array={contourPositions} itemSize={3} />
              </bufferGeometry>
              <lineBasicMaterial color="#2fd47c" transparent opacity={0.95} toneMapped={false} />
            </lineLoop>
            <lineLoop renderOrder={998}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={contourPositions.length / 3} array={contourPositions} itemSize={3} />
              </bufferGeometry>
              <lineBasicMaterial color="#2fd47c" depthTest={false} transparent opacity={0.22} toneMapped={false} />
            </lineLoop>
          </>
        )}

        {/* Survey stakes at the corners (white post, red cap). */}
        {cornerStakes.map((s, i) => (
          <group key={`stake-${i}`} position={s.pos}>
            <mesh position={[0, 0.55, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.09, 1.1, 6]} />
              <meshStandardMaterial color="#f4f1e8" roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.16, 0]}>
              <cylinderGeometry args={[0.085, 0.085, 0.22, 6]} />
              <meshStandardMaterial color="#d64533" roughness={0.6} />
            </mesh>
          </group>
        ))}

        {/* Edge-length labels (cotas del deslinde). */}
        {edgeLabelSprites.map((s, i) => (
          <sprite key={`cota-${i}`} position={s.pos} scale={s.scale} renderOrder={997}>
            <spriteMaterial map={s.tex} depthTest={false} transparent toneMapped={false} />
          </sprite>
        ))}
      </>
    );
  }
);

RealisticTerrain.displayName = 'RealisticTerrain';
