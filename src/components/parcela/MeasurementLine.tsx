import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface MeasurementLineProps {
  points: [number, number, number][];
}

export const MeasurementLine = ({ points }: MeasurementLineProps) => {
  const p1 = points.length >= 1 ? points[0] : [0, 0, 0] as [number, number, number];
  const p2 = points.length >= 2 ? points[1] : p1;

  const distance = useMemo(() => {
    if (points.length < 2) return 0;
    const dx = p2[0] - p1[0];
    const dz = p2[2] - p1[2];
    return Math.sqrt(dx * dx + dz * dz);
  }, [p1, p2, points.length]);

  const midpoint: [number, number, number] = useMemo(() => [
    (p1[0] + p2[0]) / 2,
    Math.max(p1[1], p2[1]) + 0.8,
    (p1[2] + p2[2]) / 2,
  ], [p1, p2]);

  const linePoints = useMemo(() => {
    return new Float32Array([
      p1[0], p1[1] + 0.1, p1[2],
      p2[0], p2[1] + 0.1, p2[2],
    ]);
  }, [p1, p2]);

  if (points.length < 2) return null;

  return (
    <group>
      {/* Main measurement line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={linePoints}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#FFD600" linewidth={2} />
      </line>

      {/* Endpoint markers */}
      {[p1, p2].map((p, i) => (
        <mesh key={i} position={[p[0], p[1] + 0.15, p[2]]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color="#FFD600" />
        </mesh>
      ))}

      {/* Distance label */}
      <Text
        position={midpoint}
        fontSize={0.5}
        color="#FFD600"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#000000"
      >
        {distance.toFixed(1)}m
      </Text>
    </group>
  );
};
