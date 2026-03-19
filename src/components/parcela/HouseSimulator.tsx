import { useRef, useMemo, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

interface HouseSimulatorProps {
  heightData: Float32Array | null;
  terrainSize: number;
  position: [number, number, number];
  onPositionChange?: (pos: [number, number, number]) => void;
  houseType?: 'small' | 'medium' | 'large';
}

const HOUSE_CONFIGS = {
  small: { width: 6, depth: 8, height: 3, roofHeight: 2, color: '#E8D5B7' },
  medium: { width: 8, depth: 12, height: 3.5, roofHeight: 2.5, color: '#D4C4A8' },
  large: { width: 12, depth: 16, height: 4, roofHeight: 3, color: '#C9B896' },
};

function getTerrainHeight(
  x: number, z: number, heightData: Float32Array | null, terrainSize: number
): number {
  if (!heightData) return 0;
  const res = Math.sqrt(heightData.length);
  const nx = (x / terrainSize + 0.5) * (res - 1);
  const nz = (z / terrainSize + 0.5) * (res - 1);
  const ix = Math.min(Math.max(Math.floor(nx), 0), res - 2);
  const iz = Math.min(Math.max(Math.floor(nz), 0), res - 2);
  const fx = nx - ix;
  const fz = nz - iz;
  
  const h00 = heightData[iz * res + ix];
  const h10 = heightData[iz * res + ix + 1];
  const h01 = heightData[(iz + 1) * res + ix];
  const h11 = heightData[(iz + 1) * res + ix + 1];
  
  return (h00 * (1 - fx) * (1 - fz) + h10 * fx * (1 - fz) + h01 * (1 - fx) * fz + h11 * fx * fz);
}

export const HouseSimulator = ({
  heightData, terrainSize, position, onPositionChange, houseType = 'medium',
}: HouseSimulatorProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const config = HOUSE_CONFIGS[houseType];

  const terrainY = useMemo(
    () => getTerrainHeight(position[0], position[2], heightData, terrainSize),
    [position, heightData, terrainSize]
  );

  // Calculate slope at house position
  const slopeInfo = useMemo(() => {
    if (!heightData) return { angle: 0, label: 'N/A' };
    const dx = 0.5;
    const h1 = getTerrainHeight(position[0] - dx, position[2], heightData, terrainSize);
    const h2 = getTerrainHeight(position[0] + dx, position[2], heightData, terrainSize);
    const h3 = getTerrainHeight(position[0], position[2] - dx, heightData, terrainSize);
    const h4 = getTerrainHeight(position[0], position[2] + dx, heightData, terrainSize);
    const slopeX = Math.atan2(h2 - h1, dx * 2) * (180 / Math.PI);
    const slopeZ = Math.atan2(h4 - h3, dx * 2) * (180 / Math.PI);
    const angle = Math.sqrt(slopeX * slopeX + slopeZ * slopeZ);
    return { angle: Math.round(angle * 10) / 10, label: `${Math.round(angle)}°` };
  }, [position, heightData, terrainSize]);

  return (
    <group ref={groupRef} position={[position[0], terrainY, position[2]]}>
      {/* House body */}
      <mesh position={[0, config.height / 2, 0]} castShadow>
        <boxGeometry args={[config.width, config.height, config.depth]} />
        <meshStandardMaterial color={config.color} roughness={0.7} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, config.height + config.roofHeight / 2, 0]} castShadow>
        <coneGeometry args={[Math.max(config.width, config.depth) * 0.6, config.roofHeight, 4]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>

      {/* Door */}
      <mesh position={[0, 1.1, config.depth / 2 + 0.01]}>
        <planeGeometry args={[1.2, 2.2]} />
        <meshStandardMaterial color="#5C3A21" />
      </mesh>

      {/* Windows */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[config.width / 2 + 0.01, config.height * 0.6, side * config.depth * 0.25]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.5, 1.2]} />
          <meshStandardMaterial color="#87CEEB" metalness={0.3} roughness={0.1} />
        </mesh>
      ))}

      {/* Slope indicator */}
      {slopeInfo.angle > 3 && (
        <Html position={[0, config.height + config.roofHeight + 1, 0]} center>
          <div className="px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/40 text-[10px] font-mono text-foreground whitespace-nowrap">
            ⛰ {slopeInfo.label} pendiente
          </div>
        </Html>
      )}

      {/* Foundation outline on terrain */}
      <lineLoop position={[0, 0.05, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={5}
            array={new Float32Array([
              -config.width / 2, 0, -config.depth / 2,
              config.width / 2, 0, -config.depth / 2,
              config.width / 2, 0, config.depth / 2,
              -config.width / 2, 0, config.depth / 2,
              -config.width / 2, 0, -config.depth / 2,
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#FFD700" linewidth={2} />
      </lineLoop>
    </group>
  );
};
