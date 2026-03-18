import * as THREE from 'three';
import { useRef } from 'react';
import type { ParcelaObjectType, PlacedObject } from './useParcelaState';

interface ObjectProps {
  obj: PlacedObject;
  isSelected: boolean;
  onClick: () => void;
}

const House = ({ size, color }: { size: number; color: string }) => {
  const w = size;
  const d = size * 1.2;
  const h = size * 0.6;
  return (
    <group>
      {/* Walls */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, h + size * 0.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[w * 0.85, size * 0.45, 4]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      {/* Door */}
      <mesh position={[0, h * 0.25, d / 2 + 0.01]}>
        <planeGeometry args={[w * 0.2, h * 0.5]} />
        <meshStandardMaterial color="#5C3317" />
      </mesh>
    </group>
  );
};

const Pool = () => (
  <group>
    <mesh position={[0, 0.05, 0]} receiveShadow>
      <boxGeometry args={[3, 0.1, 5]} />
      <meshStandardMaterial color="#E0E0E0" />
    </mesh>
    <mesh position={[0, -0.15, 0]}>
      <boxGeometry args={[2.6, 0.3, 4.6]} />
      <meshStandardMaterial color="#4FC3F7" transparent opacity={0.8} />
    </mesh>
  </group>
);

const PineTree = () => (
  <group>
    <mesh position={[0, 1.5, 0]} castShadow>
      <coneGeometry args={[0.8, 2.5, 8]} />
      <meshStandardMaterial color="#2E7D32" />
    </mesh>
    <mesh position={[0, 0.4, 0]} castShadow>
      <cylinderGeometry args={[0.12, 0.15, 0.8, 8]} />
      <meshStandardMaterial color="#5D4037" />
    </mesh>
  </group>
);

const FruitTree = () => (
  <group>
    <mesh position={[0, 2, 0]} castShadow>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial color="#4CAF50" />
    </mesh>
    <mesh position={[0, 0.5, 0]} castShadow>
      <cylinderGeometry args={[0.1, 0.15, 1, 8]} />
      <meshStandardMaterial color="#5D4037" />
    </mesh>
    {/* Fruits */}
    {[[-0.4, 2.3, 0.5], [0.5, 1.8, -0.3], [-0.2, 1.6, -0.5]].map((p, i) => (
      <mesh key={i} position={p as [number, number, number]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshStandardMaterial color="#FF5722" />
      </mesh>
    ))}
  </group>
);

const Fence = () => (
  <group>
    {Array.from({ length: 6 }).map((_, i) => (
      <group key={i} position={[i * 0.8 - 2, 0, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 1, 6]} />
          <meshStandardMaterial color="#8D6E63" />
        </mesh>
      </group>
    ))}
    {/* Rails */}
    <mesh position={[0, 0.7, 0]} castShadow>
      <boxGeometry args={[4.5, 0.06, 0.06]} />
      <meshStandardMaterial color="#8D6E63" />
    </mesh>
    <mesh position={[0, 0.3, 0]} castShadow>
      <boxGeometry args={[4.5, 0.06, 0.06]} />
      <meshStandardMaterial color="#8D6E63" />
    </mesh>
  </group>
);

const Gate = () => (
  <group>
    {/* Pillars */}
    <mesh position={[-1, 1, 0]} castShadow>
      <boxGeometry args={[0.3, 2, 0.3]} />
      <meshStandardMaterial color="#9E9E9E" />
    </mesh>
    <mesh position={[1, 1, 0]} castShadow>
      <boxGeometry args={[0.3, 2, 0.3]} />
      <meshStandardMaterial color="#9E9E9E" />
    </mesh>
    {/* Gate bar */}
    <mesh position={[0, 2.1, 0]} castShadow>
      <boxGeometry args={[2.3, 0.15, 0.15]} />
      <meshStandardMaterial color="#616161" />
    </mesh>
    {/* Gate panels */}
    <mesh position={[0, 0.9, 0]}>
      <boxGeometry args={[1.7, 1.6, 0.05]} />
      <meshStandardMaterial color="#37474F" transparent opacity={0.7} />
    </mesh>
  </group>
);

const Garden = () => (
  <group>
    <mesh position={[0, 0.02, 0]} receiveShadow>
      <boxGeometry args={[3, 0.04, 3]} />
      <meshStandardMaterial color="#795548" />
    </mesh>
    {Array.from({ length: 9 }).map((_, i) => (
      <mesh key={i} position={[(i % 3 - 1) * 0.8, 0.2, (Math.floor(i / 3) - 1) * 0.8]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.35, 6]} />
        <meshStandardMaterial color="#66BB6A" />
      </mesh>
    ))}
  </group>
);

const Quincho = () => (
  <group>
    {/* Base */}
    <mesh position={[0, 0.03, 0]} receiveShadow>
      <boxGeometry args={[4, 0.06, 3]} />
      <meshStandardMaterial color="#BCAAA4" />
    </mesh>
    {/* Posts */}
    {[[-1.8, 0, -1.3], [1.8, 0, -1.3], [-1.8, 0, 1.3], [1.8, 0, 1.3]].map((p, i) => (
      <mesh key={i} position={[p[0], 1.3, p[2]]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 2.6, 8]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
    ))}
    {/* Roof */}
    <mesh position={[0, 2.7, 0]} castShadow>
      <boxGeometry args={[4.5, 0.1, 3.5]} />
      <meshStandardMaterial color="#8D6E63" />
    </mesh>
  </group>
);

const Parking = () => (
  <group>
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[3.5, 5]} />
      <meshStandardMaterial color="#9E9E9E" />
    </mesh>
    {/* Lines */}
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.08, 4.5]} />
      <meshStandardMaterial color="#FFFFFF" />
    </mesh>
  </group>
);

const OBJECT_COMPONENTS: Record<ParcelaObjectType, React.FC> = {
  casa_50: () => <House size={2.2} color="#FFCC80" />,
  casa_80: () => <House size={3} color="#FFAB91" />,
  casa_120: () => <House size={3.8} color="#EF9A9A" />,
  piscina: Pool,
  cerco: Fence,
  entrada: Gate,
  huerto: Garden,
  arbol_pino: PineTree,
  arbol_frutal: FruitTree,
  quincho: Quincho,
  estacionamiento: Parking,
};

export const ParcelaObject3D = ({ obj, isSelected, onClick }: ObjectProps) => {
  const ref = useRef<THREE.Group>(null);
  const Component = OBJECT_COMPONENTS[obj.type];

  return (
    <group
      ref={ref}
      position={obj.position}
      rotation={[0, obj.rotation, 0]}
      scale={[obj.scale, obj.scale, obj.scale]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <Component />
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2, 2.2, 32]} />
          <meshBasicMaterial color="#FFD600" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};
