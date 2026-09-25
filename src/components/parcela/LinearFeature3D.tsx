import { useMemo } from 'react';
import * as THREE from 'three';
import type { PlacedObject } from './useParcelaState';

interface Props {
  obj: PlacedObject;
  isSelected: boolean;
  onClick: () => void;
}

type Segment = {
  midpoint: [number, number, number];
  length: number;
  angle: number;
  start: [number, number, number];
  end: [number, number, number];
};

const segmentsOf = (points: [number, number, number][]): Segment[] =>
  points.slice(0, -1).flatMap((p, index) => {
    const q = points[index + 1];
    const dx = q[0] - p[0];
    const dz = q[2] - p[2];
    const length = Math.hypot(dx, dz);
    if (length < 0.05) return [];
    return [{
      midpoint: [(p[0] + q[0]) / 2, Math.max(p[1], q[1]) + 0.04, (p[2] + q[2]) / 2] as [number, number, number],
      length,
      angle: Math.atan2(dx, dz),
      start: p,
      end: q,
    }];
  });

const FenceSegment = ({ segment, selected }: { segment: Segment; selected: boolean }) => {
  const postCount = Math.max(2, Math.ceil(segment.length / 3) + 1);
  const posts = Array.from({ length: postCount }, (_, i) => {
    const t = postCount === 1 ? 0 : i / (postCount - 1);
    return [
      segment.start[0] + (segment.end[0] - segment.start[0]) * t,
      Math.max(segment.start[1], segment.end[1]),
      segment.start[2] + (segment.end[2] - segment.start[2]) * t,
    ] as [number, number, number];
  });

  return (
    <group>
      {posts.map((p, i) => (
        <mesh key={i} position={[p[0], p[1] + 0.75, p[2]]} castShadow>
          <boxGeometry args={[0.11, 1.5, 0.11]} />
          <meshStandardMaterial color={selected ? '#f6c64e' : '#7b5b3d'} roughness={0.9} />
        </mesh>
      ))}
      {[0.48, 1.05].map((height) => (
        <mesh
          key={height}
          position={[segment.midpoint[0], segment.midpoint[1] + height, segment.midpoint[2]]}
          rotation={[0, segment.angle, 0]}
          castShadow
        >
          <boxGeometry args={[0.09, 0.09, segment.length]} />
          <meshStandardMaterial color={selected ? '#f6c64e' : '#8d6e63'} roughness={0.86} />
        </mesh>
      ))}
    </group>
  );
};

export const LinearFeature3D = ({ obj, isSelected, onClick }: Props) => {
  const points = obj.points ?? [];
  const segments = useMemo(() => segmentsOf(points), [points]);
  const width = Math.max(0.08, obj.width ?? (obj.type === 'camino_trazado' ? 4 : obj.type === 'sendero_trazado' ? 1.2 : 0.12));

  if (obj.visible === false || segments.length === 0) return null;

  const roadColor = obj.type === 'camino_trazado'
    ? (isSelected ? '#f6c64e' : '#8f806b')
    : (isSelected ? '#f6c64e' : '#b89b72');

  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {obj.type === 'cerco_trazado' ? (
        segments.map((segment, index) => <FenceSegment key={index} segment={segment} selected={isSelected} />)
      ) : (
        segments.map((segment, index) => (
          <mesh
            key={index}
            position={[segment.midpoint[0], segment.midpoint[1], segment.midpoint[2]]}
            rotation={[0, segment.angle, 0]}
            receiveShadow
          >
            <boxGeometry args={[width, 0.08, segment.length + 0.2]} />
            <meshStandardMaterial
              color={roadColor}
              roughness={obj.type === 'camino_trazado' ? 0.98 : 0.92}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
        ))
      )}

      {isSelected && points.map((p, index) => (
        <mesh key={`node-${index}`} position={[p[0], p[1] + 0.2, p[2]]}>
          <sphereGeometry args={[0.22, 10, 10]} />
          <meshBasicMaterial color="#f6c64e" depthTest={false} />
        </mesh>
      ))}
    </group>
  );
};

export const DraftLinearFeature3D = ({
  points,
  mode,
}: {
  points: [number, number, number][];
  mode: 'camino_trazado' | 'sendero_trazado' | 'cerco_trazado';
}) => {
  const segments = useMemo(() => segmentsOf(points), [points]);
  if (!segments.length && points.length < 1) return null;

  return (
    <group>
      {segments.map((segment, index) => (
        <mesh
          key={index}
          position={[segment.midpoint[0], segment.midpoint[1] + 0.05, segment.midpoint[2]]}
          rotation={[0, segment.angle, 0]}
        >
          <boxGeometry args={[mode === 'camino_trazado' ? 0.32 : 0.18, 0.06, segment.length]} />
          <meshBasicMaterial color="#f6c64e" transparent opacity={0.9} depthTest={false} />
        </mesh>
      ))}
      {points.map((p, index) => (
        <mesh key={index} position={[p[0], p[1] + 0.2, p[2]]}>
          <sphereGeometry args={[0.2, 10, 10]} />
          <meshBasicMaterial color="#f6c64e" depthTest={false} />
        </mesh>
      ))}
    </group>
  );
};
