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
}

export interface TerrainHandle {
  getHeightAt: (x: number, z: number) => number;
}

const TERRAIN_RES = 128;
const SAT_ZOOM = 18;
const ELEV_ZOOM = 15;
const TILE_PX = 512;
const GRID = 3; // 3x3 tile grid

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

/** Load a single tile image using modern Static Tiles API */
function loadTileImage(zoom: number, tx: number, ty: number, token: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/${TILE_PX}/${zoom}/${tx}/${ty}?access_token=${token}`;
  });
}

/** Load a 3x3 grid of satellite tiles stitched into one canvas texture */
async function loadStitchedSatelliteTexture(
  lat: number, lng: number, planeSize: number, token: string, zoom = SAT_ZOOM
): Promise<THREE.Texture | null> {
  if (!token) return null;

  const { tileX, tileY, fracX, fracY } = lngLatToTileFraction(lng, lat, zoom);
  const tileMeters = tileSizeMeters(lat, zoom);
  const canvasPx = TILE_PX * GRID; // 768px
  const gridMeters = tileMeters * GRID; // ~375m

  // Load all 9 tiles in parallel
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
    // Fallback to lower zoom
    if (zoom > 15) {
      console.warn(`No tiles at zoom ${zoom}, falling back to ${zoom - 1}`);
      return loadStitchedSatelliteTexture(lat, lng, planeSize, token, zoom - 1);
    }
    return null;
  }

  // Stitch tiles onto a canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasPx;
  canvas.height = canvasPx;
  const ctx = canvas.getContext('2d')!;

  // Fill with a base color in case some tiles failed
  ctx.fillStyle = '#5D8233';
  ctx.fillRect(0, 0, canvasPx, canvasPx);

  for (const { img, col, row } of results) {
    if (img) {
      ctx.drawImage(img, col * TILE_PX, row * TILE_PX, TILE_PX, TILE_PX);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.magFilter = THREE.LinearFilter;

  // UV mapping: map the plane onto the stitched grid
  // The center tile is at grid position (1,1). The fractional position within it is (fracX, fracY).
  // In texture space, the center of the lot is at ((1 + fracX) / 3, (1 + fracY) / 3)
  const repeatVal = planeSize / gridMeters;
  tex.repeat.set(repeatVal, repeatVal);

  // Center of lot in UV space of the stitched canvas
  const centerU = (1 + fracX) / GRID;
  const centerV = 1 - (1 + fracY) / GRID; // flip Y
  tex.offset.set(centerU - repeatVal / 2, centerV - repeatVal / 2);

  console.log('Stitched satellite:', { zoom, tileMeters: Math.round(tileMeters), gridMeters: Math.round(gridMeters), planeSize, repeatVal: repeatVal.toFixed(3), loaded: `${loaded}/9`, centerU: centerU.toFixed(3), centerV: centerV.toFixed(3) });
  return tex;
}

/** Convert polygon GPS coords to local XZ coords centered on centroid */
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
  ({ polygon, latitude, longitude, size: sizeProp, mapboxToken, onElevationLoaded, onTextureLoading }, ref) => {
    const [heightData, setHeightData] = useState<Float32Array | null>(null);
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    const [baseElevation, setBaseElevation] = useState(0);

    const lat = latitude ?? (polygon ? polygon.reduce((s, p) => s + p[1], 0) / polygon.length : -33.4);
    const lng = longitude ?? (polygon ? polygon.reduce((s, p) => s + p[0], 0) / polygon.length : -70.6);

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

    // Load stitched satellite texture (3x3 grid)
    useEffect(() => {
      if (!mapboxToken) return;
      onTextureLoading?.(true);
      loadStitchedSatelliteTexture(lat, lng, size, mapboxToken, SAT_ZOOM).then((tex) => {
        if (tex) setTexture(tex);
        onTextureLoading?.(false);
      }).catch(() => {
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
          <mesh geometry={geometry} receiveShadow castShadow>
            {texture ? (
              <meshBasicMaterial map={texture} />
            ) : (
              <meshBasicMaterial color="#5D8233" />
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
