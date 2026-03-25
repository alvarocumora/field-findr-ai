import { useMemo, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';

interface RealisticTerrainProps {
  polygon: number[][] | null;
  latitude?: number;
  longitude?: number;
  size?: number;
  onElevationLoaded?: (baseElevation: number) => void;
}

export interface TerrainHandle {
  getHeightAt: (x: number, z: number) => number;
}

const TERRAIN_RES = 128;

function lngLatToTile(lng: number, lat: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

function decodeRGBElevation(r: number, g: number, b: number): number {
  return -10000 + (r * 256 * 256 + g * 256 + b) * 0.1;
}

async function loadTerrainTile(lat: number, lng: number, zoom = 14): Promise<{ heights: Float32Array; satellite: string }> {
  const { x, y } = lngLatToTile(lng, lat, zoom);
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  if (!token) return { heights: new Float32Array(TERRAIN_RES * TERRAIN_RES), satellite: '' };

  const terrainUrl = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${zoom}/${x}/${y}.pngraw?access_token=${token}`;
  const satelliteUrl = `https://api.mapbox.com/v4/mapbox.satellite/${zoom}/${x}/${y}@2x.jpg?access_token=${token}`;

  const heights = await new Promise<Float32Array>((resolve, reject) => {
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
    img.src = terrainUrl;
  });

  return { heights, satellite: satelliteUrl };
}

export const RealisticTerrain = forwardRef<TerrainHandle, RealisticTerrainProps>(
  ({ polygon, latitude, longitude, size = 40, onElevationLoaded }, ref) => {
    const [heightData, setHeightData] = useState<Float32Array | null>(null);
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    const [baseElevation, setBaseElevation] = useState(0);

    const lat = latitude ?? (polygon ? polygon.reduce((s, p) => s + p[1], 0) / polygon.length : -33.4);
    const lng = longitude ?? (polygon ? polygon.reduce((s, p) => s + p[0], 0) / polygon.length : -70.6);

    useEffect(() => {
      loadTerrainTile(lat, lng).then(({ heights, satellite }) => {
        const min = Math.min(...Array.from(heights));
        setBaseElevation(min);
        onElevationLoaded?.(min);
        const normalized = new Float32Array(heights.length);
        for (let i = 0; i < heights.length; i++) {
          normalized[i] = (heights[i] - min) * 0.3;
        }
        setHeightData(normalized);

        if (satellite) {
          const loader = new THREE.TextureLoader();
          loader.crossOrigin = 'anonymous';
          loader.load(satellite, (tex) => {
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.minFilter = THREE.LinearMipMapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            setTexture(tex);
          });
        }
      }).catch(console.error);
    }, [lat, lng]);

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

    // Expose getHeightAt for Y-snapping via raycasting
    const getHeightAt = useCallback((x: number, z: number): number => {
      if (!heightData) return 0;
      // Convert world XZ to heightmap grid indices
      const halfSize = size / 2;
      const gx = ((x + halfSize) / size) * (TERRAIN_RES - 1);
      const gz = ((-z + halfSize) / size) * (TERRAIN_RES - 1);
      const ix = Math.max(0, Math.min(TERRAIN_RES - 1, Math.round(gx)));
      const iz = Math.max(0, Math.min(TERRAIN_RES - 1, Math.round(gz)));
      return heightData[iz * TERRAIN_RES + ix] || 0;
    }, [heightData, size]);

    useImperativeHandle(ref, () => ({ getHeightAt }), [getHeightAt]);

    return (
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={geometry} receiveShadow castShadow>
          {texture ? (
            <meshStandardMaterial map={texture} roughness={0.85} />
          ) : (
            <meshStandardMaterial color="#5D8233" roughness={0.9} />
          )}
        </mesh>
      </group>
    );
  }
);

RealisticTerrain.displayName = 'RealisticTerrain';
