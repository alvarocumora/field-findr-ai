import { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';

interface RealisticTerrainProps {
  polygon: number[][] | null;
  latitude?: number;
  longitude?: number;
  size?: number;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

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

async function loadTerrainData(lat: number, lng: number, zoom = 14): Promise<{ heights: Float32Array; satellite: string }> {
  const { x, y } = lngLatToTile(lng, lat, zoom);
  
  const terrainUrl = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${zoom}/${x}/${y}.pngraw?access_token=${MAPBOX_TOKEN}`;
  const satelliteUrl = `https://api.mapbox.com/v4/mapbox.satellite/${zoom}/${x}/${y}@2x.jpg?access_token=${MAPBOX_TOKEN}`;
  
  const heights = await new Promise<Float32Array>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const res = 64;
      canvas.width = res;
      canvas.height = res;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, res, res);
      const data = ctx.getImageData(0, 0, res, res).data;
      const h = new Float32Array(res * res);
      for (let i = 0; i < res * res; i++) {
        h[i] = decodeRGBElevation(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
      }
      resolve(h);
    };
    img.onerror = reject;
    img.src = terrainUrl;
  });

  return { heights, satellite: satelliteUrl };
}

export const RealisticTerrain = ({ polygon, latitude, longitude, size = 40 }: RealisticTerrainProps) => {
  const [heightData, setHeightData] = useState<Float32Array | null>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [baseElevation, setBaseElevation] = useState(0);

  const lat = latitude ?? (polygon ? polygon.reduce((s, p) => s + p[1], 0) / polygon.length : -33.4);
  const lng = longitude ?? (polygon ? polygon.reduce((s, p) => s + p[0], 0) / polygon.length : -70.6);

  useEffect(() => {
    if (!MAPBOX_TOKEN) return;
    
    loadTerrainData(lat, lng).then(({ heights, satellite }) => {
      // Normalize heights relative to min
      const min = Math.min(...Array.from(heights));
      setBaseElevation(min);
      const normalized = new Float32Array(heights.length);
      for (let i = 0; i < heights.length; i++) {
        normalized[i] = (heights[i] - min) * 0.3; // Scale factor for visual effect
      }
      setHeightData(normalized);

      // Load satellite texture
      const loader = new THREE.TextureLoader();
      loader.crossOrigin = 'anonymous';
      loader.load(satellite, (tex) => {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        setTexture(tex);
      });
    }).catch(console.error);
  }, [lat, lng]);

  const geometry = useMemo(() => {
    const res = 64;
    const geo = new THREE.PlaneGeometry(size, size, res - 1, res - 1);
    
    if (heightData && heightData.length === res * res) {
      const positions = geo.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        positions.setZ(i, heightData[i]);
      }
      positions.needsUpdate = true;
      geo.computeVertexNormals();
    }
    
    return geo;
  }, [heightData, size]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={geometry} receiveShadow>
        {texture ? (
          <meshStandardMaterial map={texture} roughness={0.85} />
        ) : (
          <meshStandardMaterial color="#5D8233" roughness={0.9} />
        )}
      </mesh>
    </group>
  );
};
