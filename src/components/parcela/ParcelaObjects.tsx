import * as THREE from 'three';
import { useRef } from 'react';
import type { ParcelaObjectType, PlacedObject } from './useParcelaState';

interface ObjectProps {
  obj: PlacedObject;
  isSelected: boolean;
  onClick: () => void;
}

// ─── VIVIENDA ───────────────────────────────────────────

const House = ({ size, color }: { size: number; color: string }) => {
  const w = size;
  const d = size * 1.2;
  const h = size * 0.6;
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, h + size * 0.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[w * 0.85, size * 0.45, 4]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, h * 0.25, d / 2 + 0.01]}>
        <planeGeometry args={[w * 0.2, h * 0.5]} />
        <meshStandardMaterial color="#5C3317" />
      </mesh>
      {/* Windows */}
      {[[-w * 0.25, h * 0.55], [w * 0.25, h * 0.55]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, d / 2 + 0.01]}>
          <planeGeometry args={[w * 0.12, h * 0.25]} />
          <meshStandardMaterial color="#B3E5FC" />
        </mesh>
      ))}
    </group>
  );
};

const ModernHouse = () => {
  return (
    <group>
      {/* Main body - flat roof */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 3, 4]} />
        <meshStandardMaterial color="#ECEFF1" />
      </mesh>
      {/* Roof slab */}
      <mesh position={[0, 3.05, 0]} castShadow>
        <boxGeometry args={[5.4, 0.1, 4.4]} />
        <meshStandardMaterial color="#455A64" />
      </mesh>
      {/* Second floor offset */}
      <mesh position={[1.5, 1.5, -0.8]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 3, 2]} />
        <meshStandardMaterial color="#CFD8DC" />
      </mesh>
      {/* Large windows */}
      <mesh position={[0, 1.5, 2.01]}>
        <planeGeometry args={[3.5, 2.2]} />
        <meshStandardMaterial color="#4FC3F7" transparent opacity={0.5} />
      </mesh>
      {/* Garage */}
      <mesh position={[-1.8, 0.8, 2.01]}>
        <planeGeometry args={[1.2, 1.6]} />
        <meshStandardMaterial color="#37474F" />
      </mesh>
    </group>
  );
};

const Cabin = () => (
  <group>
    {/* Log walls */}
    <mesh position={[0, 1, 0]} castShadow receiveShadow>
      <boxGeometry args={[3, 2, 3.5]} />
      <meshStandardMaterial color="#8D6E63" />
    </mesh>
    {/* A-frame roof */}
    <mesh position={[0, 2.8, 0]} rotation={[0, 0, 0]} castShadow>
      <coneGeometry args={[2.8, 1.8, 4]} />
      <meshStandardMaterial color="#5D4037" />
    </mesh>
    {/* Porch */}
    <mesh position={[0, 0.1, 2]} receiveShadow>
      <boxGeometry args={[3.5, 0.15, 1]} />
      <meshStandardMaterial color="#A1887F" />
    </mesh>
    {/* Chimney */}
    <mesh position={[1, 3.2, -0.5]} castShadow>
      <boxGeometry args={[0.4, 1.2, 0.4]} />
      <meshStandardMaterial color="#795548" />
    </mesh>
  </group>
);

const TinyHouse = () => (
  <group>
    <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
      <boxGeometry args={[2, 1.6, 3]} />
      <meshStandardMaterial color="#E8EAF6" />
    </mesh>
    {/* Curved roof */}
    <mesh position={[0, 1.75, 0]} castShadow>
      <cylinderGeometry args={[1.3, 1.3, 3.2, 16, 1, false, 0, Math.PI]} />
      <meshStandardMaterial color="#78909C" />
    </mesh>
    {/* Door */}
    <mesh position={[0, 0.6, 1.51]}>
      <planeGeometry args={[0.7, 1.2]} />
      <meshStandardMaterial color="#455A64" />
    </mesh>
    {/* Wheels */}
    {[[-0.7, 0.15, 1.3], [0.7, 0.15, 1.3], [-0.7, 0.15, -1.3], [0.7, 0.15, -1.3]].map((p, i) => (
      <mesh key={i} position={p as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 12]} />
        <meshStandardMaterial color="#212121" />
      </mesh>
    ))}
  </group>
);

// ─── AGUA ───────────────────────────────────────────────

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
    {/* Pool edge tiles */}
    <mesh position={[0, 0.12, 0]}>
      <boxGeometry args={[3.2, 0.04, 5.2]} />
      <meshStandardMaterial color="#B0BEC5" />
    </mesh>
  </group>
);

const RoundPool = () => (
  <group>
    <mesh position={[0, 0.05, 0]} receiveShadow>
      <cylinderGeometry args={[2.2, 2.2, 0.1, 24]} />
      <meshStandardMaterial color="#E0E0E0" />
    </mesh>
    <mesh position={[0, -0.15, 0]}>
      <cylinderGeometry args={[2, 2, 0.3, 24]} />
      <meshStandardMaterial color="#29B6F6" transparent opacity={0.8} />
    </mesh>
  </group>
);

const Jacuzzi = () => (
  <group>
    <mesh position={[0, 0.25, 0]} receiveShadow>
      <cylinderGeometry args={[1.2, 1.3, 0.5, 16]} />
      <meshStandardMaterial color="#5D4037" />
    </mesh>
    <mesh position={[0, 0.15, 0]}>
      <cylinderGeometry args={[1, 1, 0.4, 16]} />
      <meshStandardMaterial color="#4DD0E1" transparent opacity={0.85} />
    </mesh>
    {/* Jets - small spheres */}
    {Array.from({ length: 6 }).map((_, i) => {
      const a = (i / 6) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * 0.85, 0.35, Math.sin(a) * 0.85]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#B0BEC5" />
        </mesh>
      );
    })}
  </group>
);

const WaterWell = () => (
  <group>
    {/* Base cylinder */}
    <mesh position={[0, 0.4, 0]} castShadow>
      <cylinderGeometry args={[0.6, 0.7, 0.8, 12]} />
      <meshStandardMaterial color="#9E9E9E" />
    </mesh>
    {/* Roof posts */}
    {[[0.5, 0, 0], [-0.5, 0, 0]].map((p, i) => (
      <mesh key={i} position={[p[0], 1.2, p[2]]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1.6, 6]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
    ))}
    {/* Roof */}
    <mesh position={[0, 2.1, 0]} castShadow>
      <coneGeometry args={[0.8, 0.5, 4]} />
      <meshStandardMaterial color="#8D6E63" />
    </mesh>
    {/* Bucket */}
    <mesh position={[0, 1, 0]}>
      <cylinderGeometry args={[0.12, 0.1, 0.2, 8]} />
      <meshStandardMaterial color="#795548" />
    </mesh>
  </group>
);

// ─── CERCOS ─────────────────────────────────────────────

const Fence = () => (
  <group>
    {Array.from({ length: 8 }).map((_, i) => (
      <mesh key={i} position={[i * 0.7 - 2.45, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 1, 6]} />
        <meshStandardMaterial color="#8D6E63" />
      </mesh>
    ))}
    <mesh position={[0, 0.7, 0]} castShadow>
      <boxGeometry args={[5, 0.06, 0.06]} />
      <meshStandardMaterial color="#8D6E63" />
    </mesh>
    <mesh position={[0, 0.3, 0]} castShadow>
      <boxGeometry args={[5, 0.06, 0.06]} />
      <meshStandardMaterial color="#8D6E63" />
    </mesh>
  </group>
);

const StoneWall = () => (
  <group>
    <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
      <boxGeometry args={[5, 0.8, 0.4]} />
      <meshStandardMaterial color="#9E9E9E" roughness={0.9} />
    </mesh>
    {/* Stone texture bumps */}
    {Array.from({ length: 12 }).map((_, i) => (
      <mesh key={i} position={[(i % 6 - 2.5) * 0.8, 0.15 + Math.floor(i / 6) * 0.4, 0.21]} castShadow>
        <sphereGeometry args={[0.12 + Math.random() * 0.08, 6, 6]} />
        <meshStandardMaterial color={i % 3 === 0 ? '#BDBDBD' : i % 3 === 1 ? '#A1887F' : '#90A4AE'} roughness={1} />
      </mesh>
    ))}
  </group>
);

const Gate = () => (
  <group>
    <mesh position={[-1, 1, 0]} castShadow>
      <boxGeometry args={[0.3, 2, 0.3]} />
      <meshStandardMaterial color="#9E9E9E" />
    </mesh>
    <mesh position={[1, 1, 0]} castShadow>
      <boxGeometry args={[0.3, 2, 0.3]} />
      <meshStandardMaterial color="#9E9E9E" />
    </mesh>
    <mesh position={[0, 2.1, 0]} castShadow>
      <boxGeometry args={[2.3, 0.15, 0.15]} />
      <meshStandardMaterial color="#616161" />
    </mesh>
    <mesh position={[0, 0.9, 0]}>
      <boxGeometry args={[1.7, 1.6, 0.05]} />
      <meshStandardMaterial color="#37474F" transparent opacity={0.7} />
    </mesh>
  </group>
);

// ─── VEGETACIÓN ─────────────────────────────────────────

const PineTree = () => (
  <group>
    <mesh position={[0, 0.4, 0]} castShadow>
      <cylinderGeometry args={[0.12, 0.15, 0.8, 8]} />
      <meshStandardMaterial color="#5D4037" />
    </mesh>
    <mesh position={[0, 1.2, 0]} castShadow>
      <coneGeometry args={[0.9, 1.5, 8]} />
      <meshStandardMaterial color="#2E7D32" />
    </mesh>
    <mesh position={[0, 2.1, 0]} castShadow>
      <coneGeometry args={[0.7, 1.2, 8]} />
      <meshStandardMaterial color="#388E3C" />
    </mesh>
    <mesh position={[0, 2.8, 0]} castShadow>
      <coneGeometry args={[0.45, 0.9, 8]} />
      <meshStandardMaterial color="#43A047" />
    </mesh>
  </group>
);

const FruitTree = () => (
  <group>
    <mesh position={[0, 0.5, 0]} castShadow>
      <cylinderGeometry args={[0.1, 0.15, 1, 8]} />
      <meshStandardMaterial color="#5D4037" />
    </mesh>
    <mesh position={[0, 2, 0]} castShadow>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial color="#4CAF50" />
    </mesh>
    {[[-0.4, 2.3, 0.5], [0.5, 1.8, -0.3], [-0.2, 1.6, -0.5], [0.3, 2.4, 0.2], [-0.5, 1.7, 0.3]].map((p, i) => (
      <mesh key={i} position={p as [number, number, number]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshStandardMaterial color={i % 2 === 0 ? '#FF5722' : '#FFC107'} />
      </mesh>
    ))}
  </group>
);

const PalmTree = () => (
  <group>
    {/* Curved trunk */}
    <mesh position={[0, 1.5, 0]} castShadow>
      <cylinderGeometry args={[0.15, 0.2, 3, 8]} />
      <meshStandardMaterial color="#8D6E63" />
    </mesh>
    <mesh position={[0.1, 3, 0]} castShadow>
      <cylinderGeometry args={[0.12, 0.15, 1, 8]} />
      <meshStandardMaterial color="#A1887F" />
    </mesh>
    {/* Palm fronds */}
    {Array.from({ length: 7 }).map((_, i) => {
      const angle = (i / 7) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(angle) * 0.8, 3.5, Math.sin(angle) * 0.8]} 
              rotation={[Math.cos(angle) * 0.8, 0, Math.sin(angle) * 0.8]} castShadow>
          <coneGeometry args={[0.15, 1.8, 4]} />
          <meshStandardMaterial color="#66BB6A" />
        </mesh>
      );
    })}
    {/* Coconuts */}
    {[[0.15, 3.4, 0.15], [-0.1, 3.35, -0.1]].map((p, i) => (
      <mesh key={`c${i}`} position={p as [number, number, number]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#795548" />
      </mesh>
    ))}
  </group>
);

const Shrub = () => (
  <group>
    <mesh position={[0, 0.35, 0]} castShadow>
      <sphereGeometry args={[0.5, 10, 10]} />
      <meshStandardMaterial color="#66BB6A" />
    </mesh>
    <mesh position={[0.3, 0.25, 0.2]} castShadow>
      <sphereGeometry args={[0.35, 8, 8]} />
      <meshStandardMaterial color="#81C784" />
    </mesh>
    <mesh position={[-0.2, 0.3, -0.15]} castShadow>
      <sphereGeometry args={[0.4, 8, 8]} />
      <meshStandardMaterial color="#4CAF50" />
    </mesh>
  </group>
);

const LawnPatch = () => (
  <group>
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[5, 5]} />
      <meshStandardMaterial color="#8BC34A" />
    </mesh>
    {/* Subtle grass tufts */}
    {Array.from({ length: 8 }).map((_, i) => (
      <mesh key={i} position={[(Math.random() - 0.5) * 4, 0.08, (Math.random() - 0.5) * 4]} castShadow>
        <coneGeometry args={[0.06, 0.15, 4]} />
        <meshStandardMaterial color="#7CB342" />
      </mesh>
    ))}
  </group>
);

const Garden = () => (
  <group>
    <mesh position={[0, 0.02, 0]} receiveShadow>
      <boxGeometry args={[3, 0.04, 3]} />
      <meshStandardMaterial color="#795548" />
    </mesh>
    {Array.from({ length: 16 }).map((_, i) => (
      <mesh key={i} position={[(i % 4 - 1.5) * 0.65, 0.2, (Math.floor(i / 4) - 1.5) * 0.65]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.3 + Math.random() * 0.1, 6]} />
        <meshStandardMaterial color={i % 3 === 0 ? '#66BB6A' : i % 3 === 1 ? '#43A047' : '#AED581'} />
      </mesh>
    ))}
  </group>
);

const Greenhouse = () => (
  <group>
    {/* Base */}
    <mesh position={[0, 0.05, 0]} receiveShadow>
      <boxGeometry args={[3, 0.1, 5]} />
      <meshStandardMaterial color="#795548" />
    </mesh>
    {/* Tunnel structure */}
    <mesh position={[0, 1.2, 0]} castShadow>
      <cylinderGeometry args={[1.5, 1.5, 5, 16, 1, false, 0, Math.PI]} />
      <meshStandardMaterial color="#E8F5E9" transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
    {/* Metal frame ribs */}
    {Array.from({ length: 5 }).map((_, i) => (
      <mesh key={i} position={[0, 1.2, (i - 2) * 1.1]}>
        <torusGeometry args={[1.5, 0.02, 6, 16, Math.PI]} />
        <meshStandardMaterial color="#9E9E9E" />
      </mesh>
    ))}
    {/* Plants inside */}
    {Array.from({ length: 6 }).map((_, i) => (
      <mesh key={`p${i}`} position={[(i % 2 - 0.5) * 1.5, 0.3, (Math.floor(i / 2) - 1) * 1.5]}>
        <sphereGeometry args={[0.2, 6, 6]} />
        <meshStandardMaterial color="#66BB6A" />
      </mesh>
    ))}
  </group>
);

const ZenGarden = () => (
  <group>
    {/* Sand base */}
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[2.5, 24]} />
      <meshStandardMaterial color="#F5F5DC" />
    </mesh>
    {/* Rocks */}
    {[[0.5, 0.15, 0.3], [-0.8, 0.2, -0.5], [0.2, 0.12, -0.9]].map((p, i) => (
      <mesh key={i} position={p as [number, number, number]} castShadow>
        <dodecahedronGeometry args={[0.2 + i * 0.08, 0]} />
        <meshStandardMaterial color="#757575" roughness={1} />
      </mesh>
    ))}
    {/* Raked circles (torus) */}
    {[0.8, 1.3, 1.8].map((r, i) => (
      <mesh key={`r${i}`} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.015, 4, 32]} />
        <meshStandardMaterial color="#D7CCC8" />
      </mesh>
    ))}
    {/* Small bamboo */}
    <mesh position={[-1.5, 0.6, 1]} castShadow>
      <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
      <meshStandardMaterial color="#4CAF50" />
    </mesh>
  </group>
);

// ─── OUTDOOR ────────────────────────────────────────────

const Quincho = () => (
  <group>
    <mesh position={[0, 0.03, 0]} receiveShadow>
      <boxGeometry args={[4, 0.06, 3]} />
      <meshStandardMaterial color="#BCAAA4" />
    </mesh>
    {[[-1.8, 0, -1.3], [1.8, 0, -1.3], [-1.8, 0, 1.3], [1.8, 0, 1.3]].map((p, i) => (
      <mesh key={i} position={[p[0], 1.3, p[2]]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 2.6, 8]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
    ))}
    <mesh position={[0, 2.7, 0]} castShadow>
      <boxGeometry args={[4.5, 0.1, 3.5]} />
      <meshStandardMaterial color="#8D6E63" />
    </mesh>
    {/* Grill */}
    <mesh position={[1.5, 0.5, 0]} castShadow>
      <boxGeometry args={[0.8, 0.8, 0.5]} />
      <meshStandardMaterial color="#424242" />
    </mesh>
  </group>
);

const Pergola = () => (
  <group>
    {/* 4 posts */}
    {[[-1.5, 0, -1.5], [1.5, 0, -1.5], [-1.5, 0, 1.5], [1.5, 0, 1.5]].map((p, i) => (
      <mesh key={i} position={[p[0], 1.3, p[2]]} castShadow>
        <boxGeometry args={[0.12, 2.6, 0.12]} />
        <meshStandardMaterial color="#8D6E63" />
      </mesh>
    ))}
    {/* Cross beams */}
    {Array.from({ length: 5 }).map((_, i) => (
      <mesh key={`b${i}`} position={[0, 2.65, (i - 2) * 0.7]} castShadow>
        <boxGeometry args={[3.5, 0.08, 0.08]} />
        <meshStandardMaterial color="#A1887F" />
      </mesh>
    ))}
    {/* Vine leaves on top */}
    {Array.from({ length: 8 }).map((_, i) => (
      <mesh key={`v${i}`} position={[(Math.random() - 0.5) * 3, 2.6, (Math.random() - 0.5) * 2.5]}>
        <sphereGeometry args={[0.2 + Math.random() * 0.15, 6, 6]} />
        <meshStandardMaterial color="#66BB6A" transparent opacity={0.8} />
      </mesh>
    ))}
  </group>
);

const Firepit = () => (
  <group>
    {/* Stone ring */}
    <mesh position={[0, 0.2, 0]} castShadow>
      <torusGeometry args={[0.7, 0.2, 8, 16]} />
      <meshStandardMaterial color="#757575" roughness={1} />
    </mesh>
    {/* Fire glow */}
    <mesh position={[0, 0.3, 0]}>
      <coneGeometry args={[0.3, 0.5, 8]} />
      <meshStandardMaterial color="#FF9800" emissive="#FF6F00" emissiveIntensity={0.5} transparent opacity={0.8} />
    </mesh>
    {/* Sitting logs */}
    {Array.from({ length: 4 }).map((_, i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      return (
        <mesh key={i} position={[Math.cos(a) * 1.5, 0.15, Math.sin(a) * 1.5]} rotation={[0, a, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.8, 8]} />
          <meshStandardMaterial color="#795548" />
        </mesh>
      );
    })}
  </group>
);

const Deck = () => (
  <group>
    {/* Platform */}
    <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
      <boxGeometry args={[4, 0.12, 3]} />
      <meshStandardMaterial color="#A1887F" />
    </mesh>
    {/* Planks pattern */}
    {Array.from({ length: 8 }).map((_, i) => (
      <mesh key={i} position={[(i - 3.5) * 0.5, 0.22, 0]}>
        <boxGeometry args={[0.45, 0.02, 3]} />
        <meshStandardMaterial color={i % 2 === 0 ? '#8D6E63' : '#A1887F'} />
      </mesh>
    ))}
    {/* Steps */}
    <mesh position={[0, 0.07, 1.65]} castShadow>
      <boxGeometry args={[1.5, 0.08, 0.3]} />
      <meshStandardMaterial color="#8D6E63" />
    </mesh>
  </group>
);

// ─── INFRAESTRUCTURA ────────────────────────────────────

const Parking = () => (
  <group>
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[5, 5]} />
      <meshStandardMaterial color="#9E9E9E" />
    </mesh>
    {/* Parking lines */}
    {[-1, 1].map((x, i) => (
      <mesh key={i} position={[x, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.06, 4.5]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    ))}
  </group>
);

const Driveway = () => (
  <group>
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[2.5, 8]} />
      <meshStandardMaterial color="#BDBDBD" />
    </mesh>
    {/* Edge stones */}
    {[-1.3, 1.3].map((x, i) => (
      <mesh key={i} position={[x, 0.04, 0]}>
        <boxGeometry args={[0.1, 0.06, 8]} />
        <meshStandardMaterial color="#9E9E9E" />
      </mesh>
    ))}
  </group>
);

const Pathway = () => (
  <group>
    {Array.from({ length: 10 }).map((_, i) => (
      <mesh key={i} position={[0, 0.015, (i - 4.5) * 0.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.3, 6]} />
        <meshStandardMaterial color="#BDBDBD" />
      </mesh>
    ))}
  </group>
);

const SolarPanel = () => (
  <group>
    {/* Support frame */}
    <mesh position={[0, 0.6, 0.2]} castShadow>
      <boxGeometry args={[0.08, 1.2, 0.08]} />
      <meshStandardMaterial color="#9E9E9E" />
    </mesh>
    <mesh position={[0, 0.6, -0.2]} castShadow>
      <boxGeometry args={[0.08, 1.2, 0.08]} />
      <meshStandardMaterial color="#9E9E9E" />
    </mesh>
    {/* Panel */}
    <mesh position={[0, 1.1, 0]} rotation={[-0.5, 0, 0]} castShadow>
      <boxGeometry args={[2, 0.05, 1.5]} />
      <meshStandardMaterial color="#1A237E" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Grid lines */}
    {Array.from({ length: 4 }).map((_, i) => (
      <mesh key={i} position={[(i - 1.5) * 0.5, 1.13, 0]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[0.02, 0.01, 1.5]} />
        <meshStandardMaterial color="#283593" />
      </mesh>
    ))}
  </group>
);

const Shed = () => (
  <group>
    {/* Walls */}
    <mesh position={[0, 1, 0]} castShadow receiveShadow>
      <boxGeometry args={[3, 2, 2.5]} />
      <meshStandardMaterial color="#A1887F" />
    </mesh>
    {/* Roof */}
    <mesh position={[0, 2.3, 0]} castShadow>
      <boxGeometry args={[3.3, 0.08, 2.8]} />
      <meshStandardMaterial color="#78909C" metalness={0.3} />
    </mesh>
    {/* Sloped roof */}
    <mesh position={[0, 2.15, 0]} rotation={[0.15, 0, 0]} castShadow>
      <boxGeometry args={[3.3, 0.08, 2.8]} />
      <meshStandardMaterial color="#607D8B" metalness={0.3} />
    </mesh>
    {/* Door */}
    <mesh position={[0.5, 0.75, 1.26]}>
      <planeGeometry args={[1, 1.5]} />
      <meshStandardMaterial color="#5D4037" />
    </mesh>
  </group>
);

// ─── RECREACIÓN ─────────────────────────────────────────

const SwingSet = () => (
  <group>
    {/* A-frame */}
    {[[-1.2, 0, 0], [1.2, 0, 0]].map((p, side) => (
      <group key={side}>
        <mesh position={[p[0], 1.3, -0.5]} rotation={[0.15, 0, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 2.6, 8]} />
          <meshStandardMaterial color="#F44336" />
        </mesh>
        <mesh position={[p[0], 1.3, 0.5]} rotation={[-0.15, 0, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 2.6, 8]} />
          <meshStandardMaterial color="#F44336" />
        </mesh>
      </group>
    ))}
    {/* Top bar */}
    <mesh position={[0, 2.5, 0]} castShadow>
      <cylinderGeometry args={[0.04, 0.04, 2.8, 8]} />
      <meshStandardMaterial color="#F44336" />
    </mesh>
    {/* Swings */}
    {[-0.4, 0.4].map((x, i) => (
      <group key={`sw${i}`}>
        {/* Chains */}
        <mesh position={[x, 1.5, 0]}>
          <boxGeometry args={[0.02, 2, 0.02]} />
          <meshStandardMaterial color="#9E9E9E" />
        </mesh>
        {/* Seat */}
        <mesh position={[x, 0.5, 0]}>
          <boxGeometry args={[0.3, 0.03, 0.15]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
      </group>
    ))}
  </group>
);

const Trampoline = () => (
  <group>
    {/* Ring */}
    <mesh position={[0, 0.4, 0]} castShadow>
      <torusGeometry args={[1.5, 0.06, 8, 24]} />
      <meshStandardMaterial color="#424242" />
    </mesh>
    {/* Bounce surface */}
    <mesh position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.45, 24]} />
      <meshStandardMaterial color="#212121" />
    </mesh>
    {/* Legs */}
    {Array.from({ length: 6 }).map((_, i) => {
      const a = (i / 6) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * 1.3, 0.2, Math.sin(a) * 1.3]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
          <meshStandardMaterial color="#616161" />
        </mesh>
      );
    })}
    {/* Safety net posts */}
    {Array.from({ length: 6 }).map((_, i) => {
      const a = (i / 6) * Math.PI * 2;
      return (
        <mesh key={`p${i}`} position={[Math.cos(a) * 1.5, 1.2, Math.sin(a) * 1.5]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 1.6, 6]} />
          <meshStandardMaterial color="#757575" />
        </mesh>
      );
    })}
  </group>
);

const SportsCourt = () => (
  <group>
    {/* Court surface */}
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[10, 5]} />
      <meshStandardMaterial color="#388E3C" />
    </mesh>
    {/* Lines */}
    <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[2.2, 2.3, 32]} />
      <meshStandardMaterial color="#FFFFFF" />
    </mesh>
    {/* Center line */}
    <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.06, 5]} />
      <meshStandardMaterial color="#FFFFFF" />
    </mesh>
    {/* Boundary */}
    <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0, 0.06, 4]} />
      <meshStandardMaterial color="#FFFFFF" />
    </mesh>
    {/* Outer lines */}
    {[[-5, 0], [5, 0], [0, -2.5], [0, 2.5]].map(([x, z], i) => (
      <mesh key={i} position={[x * 0.5, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[i < 2 ? 0.06 : 10, i < 2 ? 5 : 0.06]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    ))}
    {/* Goals/posts */}
    {[-4.8, 4.8].map((x, i) => (
      <mesh key={`g${i}`} position={[x, 1, 0]} castShadow>
        <boxGeometry args={[0.08, 2, 2]} />
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.3} />
      </mesh>
    ))}
  </group>
);

// ─── REGISTRY ───────────────────────────────────────────

const OBJECT_COMPONENTS: Record<ParcelaObjectType, React.FC> = {
  casa_50: () => <House size={2.2} color="#FFCC80" />,
  casa_80: () => <House size={3} color="#FFAB91" />,
  casa_120: () => <House size={3.8} color="#EF9A9A" />,
  casa_moderna: ModernHouse,
  cabana: Cabin,
  tiny_house: TinyHouse,
  piscina: Pool,
  piscina_redonda: RoundPool,
  jacuzzi: Jacuzzi,
  pozo_agua: WaterWell,
  cerco: Fence,
  cerco_piedra: StoneWall,
  entrada: Gate,
  huerto: Garden,
  invernadero: Greenhouse,
  jardin_zen: ZenGarden,
  arbol_pino: PineTree,
  arbol_frutal: FruitTree,
  arbol_palma: PalmTree,
  arbusto: Shrub,
  cesped: LawnPatch,
  quincho: Quincho,
  pergola: Pergola,
  fogata: Firepit,
  deck: Deck,
  estacionamiento: Parking,
  camino: Driveway,
  sendero: Pathway,
  panel_solar: SolarPanel,
  bodega: Shed,
  columpio: SwingSet,
  trampolin: Trampoline,
  cancha: SportsCourt,
  glb_custom: FallbackGLBPlaceholder,
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
