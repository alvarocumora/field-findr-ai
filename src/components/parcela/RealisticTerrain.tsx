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

/** Returns tile x, y (integer) and fractional offsets fx, fy within that tile */
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

/** Meters per tile at a given zoom and latitude */
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

  return new Promise<Float32Array>((resolve, reject) => {
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
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSatelliteTexture(
  lat: number, lng: number, planeSize: number, token: string, zoom = SAT_ZOOM
): Promise<THREE.Texture | null> {
  if (!token) return null;

  const { tileX, tileY, fracX, fracY } = lngLatToTileFraction(lng, lat, zoom);
  const tileMeters = tileSizeMeters(lat, zoom);

  const url = `https://api.mapbox.com/v4/mapbox.satellite/${zoom}/${tileX}/${tileY}@2x.jpg?access_token=${token}`;

  return new Promise<THREE.Texture | null>((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(
      url,
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.minFilter = THREE.LinearMipMapLinearFilter;
        tex.magFilter = THREE.LinearFilter;

        // How many tiles the plane covers
        const repeatVal = planeSize / tileMeters;
        tex.repeat.set(repeatVal, repeatVal);

        // Offset so the center of the plane aligns with lat/lng
        const offX = fracX - repeatVal / 2;
        const offY = (1 - fracY) - repeatVal / 2;
        tex.offset.set(offX, offY);

        console.log('Satellite UV:', { zoom, tileMeters: tileMeters.toFixed(0), planeSize, repeatVal: repeatVal.toFixed(4), fracX: fracX.toFixed(4), fracY: fracY.toFixed(4) });
        resolve(tex);
      },
      undefined,
      (err) => {
        console.error('Satellite texture failed at zoom', zoom, err);
        // Fallback to lower zoom
        if (zoom > 15) {
          resolve(loadSatelliteTexture(lat, lng, planeSize, token, zoom - 1));
        } else {
          resolve(null);
        }
      }
    );
  });
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

/** Compute terrain size from polygon bounding box with padding */
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

    // Load elevation data
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

    // Load satellite texture separately at high zoom
    useEffect(() => {
      if (!mapboxToken) return;
      onTextureLoading?.(true);
      loadSatelliteTexture(lat, lng, size, mapboxToken, SAT_ZOOM).then((tex) => {
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
