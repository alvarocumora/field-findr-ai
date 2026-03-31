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
const TILE_PX = 256; // Use 256px tiles — simpler math, no zoom offset issues
const GRID = 3;

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

function loadTileImage(zoom: number, tx: number, ty: number, token: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => { console.warn(`❌ Tile failed: z${zoom}/${tx}/${ty}`); resolve(null); };
    // Use Raster Tiles API with 256px — straightforward zoom math
    img.src = `https://api.mapbox.com/v4/mapbox.satellite/${zoom}/${tx}/${ty}@2x.png?access_token=${token}`;
  });
}

/**
 * Loads a 3x3 grid of satellite tiles, then CROPS the exact region
 * corresponding to the terrain plane. Returns a texture with default UV (no repeat/offset).
 */
async function loadCroppedSatelliteTexture(
  lat: number, lng: number, planeSize: number, token: string, zoom = SAT_ZOOM
): Promise<{ texture: THREE.Texture; tilesLoaded: number; canvasDataUrl: string } | null> {
  if (!token) return null;

  const { tileX, tileY, fracX, fracY } = lngLatToTileFraction(lng, lat, zoom);
  const tileMeters = tileSizeMeters(lat, zoom);
  const canvasPx = TILE_PX * GRID; // 768px for 256px tiles * 3

  // Load 3x3 grid
  const promises: Promise<{ img: HTMLImageElement | null; col: number; row: number }>[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      promises.push(
        loadTileImage(zoom, tileX + dx, tileY + dy, token).then(img => ({ img, col: dx + 1, row: dy + 1 }))
      );
    }
  }
  const results = await Promise.all(promises);
  const loaded = results.filter(r => r.img !== null).length;

  if (loaded === 0) {
    if (zoom > 14) return loadCroppedSatelliteTexture(lat, lng, planeSize, token, zoom - 1);
    return null;
  }

  // Stitch tiles onto a canvas
  // Note: @2x tiles are 512px but we requested TILE_PX=256 in our grid math
  // The actual image size from @2x is 512px, so we draw them into 512px slots
  const actualTilePx = 512; // @2x tiles
  const stitchPx = actualTilePx * GRID; // 1536
  const stitchCanvas = document.createElement('canvas');
  stitchCanvas.width = stitchPx;
  stitchCanvas.height = stitchPx;
  const sCtx = stitchCanvas.getContext('2d')!;
  sCtx.fillStyle = '#5D8233';
  sCtx.fillRect(0, 0, stitchPx, stitchPx);
  for (const { img, col, row } of results) {
    if (img) sCtx.drawImage(img, col * actualTilePx, row * actualTilePx, actualTilePx, actualTilePx);
  }

  // Now crop exactly the plane's extent
  const gridMeters = tileMeters * GRID;
  const pxPerMeter = stitchPx / gridMeters;

  // Center of the grid in pixels (where the centroid falls)
  const centerPxX = (1 + fracX) * actualTilePx;
  const centerPxY = (1 + fracY) * actualTilePx;

  // Plane extent in pixels
  const halfPlanePx = (planeSize / 2) * pxPerMeter;
  const cropX = centerPxX - halfPlanePx;
  const cropY = centerPxY - halfPlanePx;
  const cropSize = planeSize * pxPerMeter;

  // Create cropped canvas at good resolution (clamp to 1024 max)
  const outputPx = Math.min(1024, Math.ceil(cropSize));
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = outputPx;
  cropCanvas.height = outputPx;
  const cCtx = cropCanvas.getContext('2d')!;
  cCtx.drawImage(stitchCanvas, cropX, cropY, cropSize, cropSize, 0, 0, outputPx, outputPx);

  // Debug preview
  const prevCanvas = document.createElement('canvas');
  prevCanvas.width = 128; prevCanvas.height = 128;
  prevCanvas.getContext('2d')!.drawImage(cropCanvas, 0, 0, 128, 128);
  const canvasDataUrl = prevCanvas.toDataURL('image/jpeg', 0.6);

  // Create texture — no repeat/offset needed, just 1:1 mapping
  const tex = new THREE.CanvasTexture(cropCanvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;

  console.log('🛰️ Satellite cropped:', {
    zoom, tileMeters: Math.round(tileMeters), gridMeters: Math.round(gridMeters),
    planeSize: Math.round(planeSize), cropPx: `${Math.round(cropX)},${Math.round(cropY)} ${Math.round(cropSize)}px`,
    outputPx, loaded: `${loaded}/9`,
  });

  return { texture: tex, tilesLoaded: loaded, canvasDataUrl };
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
        const normalized = new Float32Array(heights.length);
        for (let i = 0; i < heights.length; i++) normalized[i] = (heights[i] - min) * 0.005;
        setHeightData(normalized);
      }).catch(() => setHeightData(new Float32Array(TERRAIN_RES * TERRAIN_RES).fill(0)));
    }, [lat, lng, mapboxToken]);

    // Load satellite texture (cropped approach)
    useEffect(() => {
      if (!mapboxToken) { onTextureError?.(true); return; }
      onTextureLoading?.(true);
      onTextureError?.(false);
      setTexture(null);

      loadCroppedSatelliteTexture(lat, lng, size, mapboxToken, SAT_ZOOM).then((result) => {
        if (result) {
          setTexture(result.texture);
          onTextureError?.(false);
          onDebugInfo?.({
            lat, lng, zoom: SAT_ZOOM, tileMeters: Math.round(tileSizeMeters(lat, SAT_ZOOM)),
            planeSize: Math.round(size), tilesLoaded: result.tilesLoaded, tilesTotal: 9,
            textureApplied: true, canvasDataUrl: result.canvasDataUrl,
          });
        } else {
          onTextureError?.(true);
          onDebugInfo?.({
            lat, lng, zoom: SAT_ZOOM, tileMeters: Math.round(tileSizeMeters(lat, SAT_ZOOM)),
            planeSize: Math.round(size), tilesLoaded: 0, tilesTotal: 9, textureApplied: false,
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
