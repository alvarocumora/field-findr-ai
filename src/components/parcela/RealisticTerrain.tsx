import { useMemo, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';

interface RealisticTerrainProps {
  polygon: number[][] | null;
  latitude?: number;
  longitude?: number;
  size?: number;
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
const SAT_ZOOM = 18;
const ELEV_ZOOM = 15;
const TILE_PX = 512;
const GRID = 3;

function lngLatToTileFraction(lng: number, lat: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const xFull = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const yFull = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;
  const tileX = Math.floor(xFull);
  const tileY = Math.floor(yFull);
  const fracX = xFull - tileX;
  const fracY = yFull - tileY;
  return { tileX, tileY, fracX, fracY };
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
      const canvas = document.createElement('canvas');
      canvas.width = TERRAIN_RES;
      canvas.height = TERRAIN_RES;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, TERRAIN_RES, TERRAIN_RES);
      const data = ctx.getImageData(0, 0, TERRAIN_RES, TERRAIN_RES).data;
      const h = new Float32Array(TERRAIN_RES * TERRAIN_RES);
      for (let i = 0; i < TERRAIN_RES * TERRAIN_RES; i++) {
        h[i] = decodeRGBElevation(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
      }
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
    img.onerror = () => resolve(null);
    img.src = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/${TILE_PX}/${zoom}/${tx}/${ty}?access_token=${token}`;
  });
}

interface StitchResult {
  texture: THREE.Texture;
  tilesLoaded: number;
  canvasDataUrl: string;
}

async function loadStitchedSatelliteTexture(
  lat: number, lng: number, planeSize: number, token: string, zoom = SAT_ZOOM
): Promise<StitchResult | null> {
  if (!token) return null;

  const { tileX, tileY, fracX, fracY } = lngLatToTileFraction(lng, lat, zoom);
  const tileMeters = tileSizeMeters(lat, zoom);
  const canvasPx = TILE_PX * GRID;
  const gridMeters = tileMeters * GRID;

  const promises: Promise<{ img: HTMLImageElement | null; col: number; row: number }>[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const col = dx + 1;
      const row = dy + 1;
      promises.push(
        loadTileImage(zoom, tileX + dx, tileY + dy, token).then(img => ({ img, col, row }))
      );
    }
  }

  const results = await Promise.all(promises);
  const loaded = results.filter(r => r.img !== null).length;

  if (loaded === 0) {
    if (zoom > 14) {
      return loadStitchedSatelliteTexture(lat, lng, planeSize, token, zoom - 1);
    }
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasPx;
  canvas.height = canvasPx;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#5D8233';
  ctx.fillRect(0, 0, canvasPx, canvasPx);

  for (const { img, col, row } of results) {
    if (img) {
      ctx.drawImage(img, col * TILE_PX, row * TILE_PX, TILE_PX, TILE_PX);
    }
  }

  // Get a small preview for debug
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = 128;
  previewCanvas.height = 128;
  const pCtx = previewCanvas.getContext('2d')!;
  pCtx.drawImage(canvas, 0, 0, 128, 128);
  const canvasDataUrl = previewCanvas.toDataURL('image/jpeg', 0.5);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;

  const repeatVal = planeSize / gridMeters;
  tex.repeat.set(repeatVal, repeatVal);

  const centerU = (1 + fracX) / GRID;
  const centerV = 1 - (1 + fracY) / GRID;
  tex.offset.set(centerU - repeatVal / 2, centerV - repeatVal / 2);

  console.log('🛰️ Satellite stitched:', { zoom, tileMeters: Math.round(tileMeters), gridMeters: Math.round(gridMeters), planeSize: Math.round(planeSize), repeatVal: repeatVal.toFixed(3), loaded: `${loaded}/9` });

  return { texture: tex, tilesLoaded: loaded, canvasDataUrl };
}

function polygonToLocal(polygon: number[][]): { coords: [number, number][]; cx: number; cy: number } {
  if (!polygon || polygon.length === 0) return { coords: [], cx: 0, cy: 0 };
  const cx = polygon.reduce((s, p) => s + p[0], 0) / polygon.length;
  const cy = polygon.reduce((s, p) => s + p[1], 0) / polygon.length;
  const metersPerDegLng = 111320 * Math.cos((cy * Math.PI) / 180);
  const metersPerDegLat = 110540;
  const coords: [number, number][] = polygon.map(([lng, lat]) => [
    (lng - cx) * metersPerDegLng,
    (lat - cy) * metersPerDegLat,
  ]);
  return { coords, cx, cy };
}

function computeSizeFromPolygon(localCoords: [number, number][]): number {
  if (localCoords.length === 0) return 40;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of localCoords) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const span = Math.max(maxX - minX, maxY - minY);
  return Math.max(40, span * 2.5);
}

export const RealisticTerrain = forwardRef<TerrainHandle, RealisticTerrainProps>(
  ({ polygon, latitude, longitude, size: sizeProp, mapboxToken, onElevationLoaded, onTextureLoading, onTextureError, onDebugInfo }, ref) => {
    const [heightData, setHeightData] = useState<Float32Array | null>(null);
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    const [baseElevation, setBaseElevation] = useState(0);

    // PRIORITY: use polygon centroid if available, fallback to lat/lng props
    const polygonCentroid = useMemo(() => {
      if (!polygon || polygon.length < 3) return null;
      const cx = polygon.reduce((s, p) => s + p[0], 0) / polygon.length;
      const cy = polygon.reduce((s, p) => s + p[1], 0) / polygon.length;
      return { lng: cx, lat: cy };
    }, [polygon]);

    const lat = polygonCentroid?.lat ?? latitude ?? -33.4;
    const lng = polygonCentroid?.lng ?? longitude ?? -70.6;

    const { coords: localCoords } = useMemo(() => polygonToLocal(polygon || []), [polygon]);
    const size = sizeProp ?? computeSizeFromPolygon(localCoords);

    // Load elevation
    useEffect(() => {
      if (!mapboxToken) {
        setHeightData(new Float32Array(TERRAIN_RES * TERRAIN_RES).fill(0));
        return;
      }
      loadElevationTile(lat, lng, mapboxToken).then((heights) => {
        const min = Math.min(...Array.from(heights));
        setBaseElevation(min);
        onElevationLoaded?.(min);
        const normalized = new Float32Array(heights.length);
        for (let i = 0; i < heights.length; i++) {
          normalized[i] = (heights[i] - min) * 0.005;
        }
        setHeightData(normalized);
      }).catch(() => {
        setHeightData(new Float32Array(TERRAIN_RES * TERRAIN_RES).fill(0));
      });
    }, [lat, lng, mapboxToken]);

    // Load stitched satellite texture
    useEffect(() => {
      if (!mapboxToken) { onTextureError?.(true); return; }
      onTextureLoading?.(true);
      onTextureError?.(false);

      loadStitchedSatelliteTexture(lat, lng, size, mapboxToken, SAT_ZOOM).then((result) => {
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
            planeSize: Math.round(size), tilesLoaded: 0, tilesTotal: 9,
            textureApplied: false,
          });
        }
        onTextureLoading?.(false);
      }).catch(() => {
        onTextureError?.(true);
        onTextureLoading?.(false);
      });
    }, [lat, lng, mapboxToken, size]);

    const geometry = useMemo(() => {
      const geo = new THREE.PlaneGeometry(size, size, TERRAIN_RES - 1, TERRAIN_RES - 1);
      if (heightData && heightData.length === TERRAIN_RES * TERRAIN_RES) {
        const positions = geo.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          positions.setZ(i, heightData[i]);
        }
        positions.needsUpdate = true;
        geo.computeVertexNormals();
      }
      return geo;
    }, [heightData, size]);

    // Polygon contour
    const contourPositions = useMemo(() => {
      if (localCoords.length === 0) return null;
      const pts: number[] = [];
      for (const [x, y] of localCoords) {
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
    }, [localCoords, heightData, size]);

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
              <meshBasicMaterial
                map={texture}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            ) : (
              <meshBasicMaterial
                color="#5D8233"
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            )}
          </mesh>
        </group>

        {/* Lot polygon contour — outer glow */}
        {contourPositions && contourPositions.length >= 9 && (
          <>
            <lineLoop>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={contourPositions.length / 3}
                  array={contourPositions}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#00FF88" linewidth={3} transparent opacity={0.4} />
            </lineLoop>
            <lineLoop>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={contourPositions.length / 3}
                  array={contourPositions}
                  itemSize={3}
                />
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
