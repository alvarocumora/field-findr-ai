import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import type { ParcelaObjectType, PlacedObject } from './useParcelaState';

interface ObjectProps {
  obj: PlacedObject;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Shared PBR material presets. Previously every mesh used
 * `<meshStandardMaterial color=...>` with default roughness 1 / metalness 0,
 * so wood, glass, metal and stone all read as the same flat plastic. These
 * give each material family realistic roughness/metalness (and real glass).
 */
export const MAT = {
  wood: { color: '#8d6e63', roughness: 0.82, metalness: 0.0 },
  woodDark: { color: '#5d4037', roughness: 0.8, metalness: 0.0 },
  woodLight: { color: '#a1887f', roughness: 0.85, metalness: 0.0 },
  logs: { color: '#9c6b4f', roughness: 0.9, metalness: 0.0 },
  glass: { color: '#bcdfff', roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.42 },
  metal: { color: '#b0bec5', roughness: 0.35, metalness: 0.85 },
  darkMetal: { color: '#37474f', roughness: 0.4, metalness: 0.7 },
  stone: { color: '#9e9e9e', roughness: 1.0, metalness: 0.0 },
  concrete: { color: '#cfd8dc', roughness: 0.95, metalness: 0.0 },
  plasterLight: { color: '#eceff1', roughness: 0.9, metalness: 0.0 },
  roofTile: { color: '#7b4a3a', roughness: 0.85, metalness: 0.0 },
  roofDark: { color: '#455a64', roughness: 0.6, metalness: 0.2 },
  water: { color: '#29b6f6', roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.82 },
  foliage: { color: '#388e3c', roughness: 0.9, metalness: 0.0 },
  rubber: { color: '#212121', roughness: 0.8, metalness: 0.0 },
} as const;

// ─── VIVIENDA ───────────────────────────────────────────

/** Triangular-prism gable roof (ridge runs along X). */
const GableRoof = ({ w, h, d, y, mat }: { w: number; h: number; d: number; y: number; mat: object }) => (
  <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
    {/* 3-sided cylinder = triangular prism; length along its local axis = w */}
    <cylinderGeometry args={[h, h, w, 3]} />
    <meshStandardMaterial {...mat} />
  </mesh>
);

/**
 * Proper two-slope (gable) roof with eave overhang, ridge cap and filled
 * triangular gable ends. Ridge runs along Z; slopes shed water toward ±X.
 * Far more believable than a single triangular prism because it has real
 * overhangs and thin fascia rather than a fat solid wedge.
 */
const PitchedRoof = ({
  w,
  d,
  rise,
  y,
  ov = 0.28,
  mat,
  gableMat,
}: {
  w: number;
  d: number;
  rise: number;
  y: number;
  ov?: number;
  mat: object;
  gableMat?: object;
}) => {
  const sx = w / 2 + ov;
  const slant = Math.hypot(sx, rise);
  const angle = Math.atan2(rise, sx);
  const len = d + 2 * ov;
  const tri = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0);
    s.lineTo(w / 2, 0);
    s.lineTo(0, rise);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, [w, rise]);
  return (
    <group position={[0, y, 0]}>
      {/* two roof planes */}
      <mesh position={[sx / 2, rise / 2, 0]} rotation={[0, 0, -angle]} castShadow>
        <boxGeometry args={[slant, 0.09, len]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[-sx / 2, rise / 2, 0]} rotation={[0, 0, angle]} castShadow>
        <boxGeometry args={[slant, 0.09, len]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* ridge cap */}
      <mesh position={[0, rise + 0.03, 0]} castShadow>
        <boxGeometry args={[0.14, 0.09, len]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      {/* filled triangular gable ends */}
      {gableMat &&
        [d / 2, -d / 2].map((z, i) => (
          <mesh key={i} geometry={tri} position={[0, 0, z]} rotation={[0, i === 0 ? 0 : Math.PI, 0]}>
            <meshStandardMaterial {...gableMat} side={THREE.DoubleSide} />
          </mesh>
        ))}
    </group>
  );
};

/**
 * Framed glass window (faces +Z). A recessed cool interior + a semi-opaque
 * blue glass pane so it reads as glazing even without an HDRI environment,
 * a border frame (four bars, not a solid backing) and a mullion cross.
 */
const Window = ({ w, h, frame = MAT.darkMetal }: { w: number; h: number; frame?: object }) => {
  const bars: [number, number, number, number][] = [
    [0, h / 2, w + 0.08, 0.06],
    [0, -h / 2, w + 0.08, 0.06],
    [-w / 2, 0, 0.06, h],
    [w / 2, 0, 0.06, h],
  ];
  return (
    <group>
      {/* recessed interior (dark, cool) */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#2b3742" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* glass pane */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#aed6ee" roughness={0.08} metalness={0.25} transparent opacity={0.55} />
      </mesh>
      {/* border frame */}
      {bars.map(([x, y, bw, bh], i) => (
        <mesh key={i} position={[x, y, 0.01]}>
          <boxGeometry args={[bw, bh, 0.06]} />
          <meshStandardMaterial {...frame} />
        </mesh>
      ))}
      {/* mullion */}
      <mesh position={[0, 0, 0.005]}>
        <boxGeometry args={[0.035, h, 0.03]} />
        <meshStandardMaterial {...frame} />
      </mesh>
    </group>
  );
};

/** Panelled door with frame + handle (faces +Z). Centred on origin. */
const Door = ({ w = 0.9, h = 2, mat = MAT.woodDark }: { w?: number; h?: number; mat?: object }) => (
  <group>
    <mesh position={[0, 0, -0.02]}>
      <boxGeometry args={[w + 0.14, h + 0.14, 0.05]} />
      <meshStandardMaterial {...MAT.stone} />
    </mesh>
    <mesh>
      <boxGeometry args={[w, h, 0.07]} />
      <meshStandardMaterial {...mat} />
    </mesh>
    <mesh position={[w * 0.32, 0, 0.06]}>
      <sphereGeometry args={[0.05, 10, 10]} />
      <meshStandardMaterial {...MAT.metal} />
    </mesh>
  </group>
);

const House = ({ size, color }: { size: number; color: string }) => {
  const w = size * 1.7;
  const d = size * 2.1;
  const h = size * 0.9;
  const rise = size * 0.6;
  const base = 0.16;
  const wallMat = { color, roughness: 0.9, metalness: 0 };
  return (
    <group>
      {/* foundation plinth */}
      <mesh position={[0, base / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[w + 0.25, base, d + 0.25]} />
        <meshStandardMaterial {...MAT.concrete} />
      </mesh>
      {/* walls */}
      <mesh position={[0, base + h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial {...wallMat} />
      </mesh>
      {/* gable roof with overhang + filled gable ends */}
      <PitchedRoof w={w} d={d} rise={rise} y={base + h} ov={0.3} mat={MAT.roofTile} gableMat={wallMat} />
      {/* front door */}
      <group position={[0, base + h * 0.31, d / 2 + 0.03]}>
        <Door w={size * 0.36} h={h * 0.62} />
      </group>
      {/* small canopy over the door */}
      <mesh position={[0, base + h * 0.66, d / 2 + 0.26]} castShadow>
        <boxGeometry args={[size * 0.62, 0.06, 0.5]} />
        <meshStandardMaterial {...MAT.roofDark} />
      </mesh>
      {/* front windows either side of the door */}
      {[-1, 1].map((sx) => (
        <group key={`f${sx}`} position={[sx * w * 0.3, base + h * 0.58, d / 2 + 0.02]}>
          <Window w={size * 0.42} h={h * 0.42} />
        </group>
      ))}
      {/* side windows */}
      {[-1, 1].map((sx) => (
        <group
          key={`s${sx}`}
          position={[sx * (w / 2 + 0.02), base + h * 0.58, 0]}
          rotation={[0, (sx * Math.PI) / 2, 0]}
        >
          <Window w={size * 0.55} h={h * 0.42} />
        </group>
      ))}
      {/* brick chimney */}
      <mesh position={[w * 0.28, base + h + rise * 0.75, -d * 0.12]} castShadow>
        <boxGeometry args={[0.34, rise * 1.2, 0.34]} />
        <meshStandardMaterial {...MAT.stone} />
      </mesh>
    </group>
  );
};

const ModernHouse = () => {
  const base = 0.18;
  return (
    <group>
      {/* foundation slab */}
      <mesh position={[0, base / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[6.4, base, 5]} />
        <meshStandardMaterial {...MAT.concrete} />
      </mesh>
      {/* ground floor — white plaster volume */}
      <mesh position={[0, base + 1.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 3.2, 4.6]} />
        <meshStandardMaterial {...MAT.plasterLight} />
      </mesh>
      {/* flat-roof parapet cap over the ground floor */}
      <mesh position={[0, base + 3.26, 0]} castShadow>
        <boxGeometry args={[6.2, 0.12, 4.8]} />
        <meshStandardMaterial {...MAT.roofDark} />
      </mesh>
      {/* cantilevered upper floor — dark, offset back and to one side */}
      <mesh position={[-0.9, base + 4.45, -0.3]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 2.7, 4]} />
        <meshStandardMaterial {...MAT.darkMetal} />
      </mesh>
      <mesh position={[-0.9, base + 5.86, -0.3]} castShadow>
        <boxGeometry args={[4.4, 0.12, 4.2]} />
        <meshStandardMaterial {...MAT.roofDark} />
      </mesh>
      {/* vertical wood-slat accent running up the façade */}
      <mesh position={[2.65, base + 2.4, 2.35]} castShadow>
        <boxGeometry args={[0.7, 4.6, 0.1]} />
        <meshStandardMaterial {...MAT.wood} />
      </mesh>
      {/* floor-to-ceiling glazing on the ground floor */}
      <group position={[0.5, base + 1.5, 2.32]}>
        <Window w={3.4} h={2.6} frame={MAT.darkMetal} />
      </group>
      {/* window band on the upper floor */}
      <group position={[-0.9, base + 4.55, 1.72]}>
        <Window w={3.2} h={1.5} frame={MAT.metal} />
      </group>
      {/* entry door */}
      <group position={[-2.2, base + 1.1, 2.32]}>
        <Door w={1} h={2.2} mat={MAT.darkMetal} />
      </group>
      {/* entry canopy */}
      <mesh position={[-2.2, base + 2.35, 2.75]} castShadow>
        <boxGeometry args={[1.7, 0.1, 1] } />
        <meshStandardMaterial {...MAT.roofDark} />
      </mesh>
      {/* upper-floor balcony slab + glass railing */}
      <mesh position={[-0.9, base + 3.38, 2.35]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.12, 1.4]} />
        <meshStandardMaterial {...MAT.concrete} />
      </mesh>
      <mesh position={[-0.9, base + 3.78, 3]}>
        <boxGeometry args={[4.2, 0.7, 0.04]} />
        <meshStandardMaterial {...MAT.glass} />
      </mesh>
    </group>
  );
};

const Cabin = () => (
  <group>
    {/* Log walls (base box) */}
    <mesh position={[0, 1, 0]} castShadow receiveShadow>
      <boxGeometry args={[3, 2, 3.5]} />
      <meshStandardMaterial {...MAT.logs} />
    </mesh>
    {/* Stacked-log detail on the front & back faces */}
    {[-1, 1].map((sz) =>
      [0.4, 0.9, 1.4].map((yy, i) => (
        <mesh key={`${sz}-${i}`} position={[0, yy, sz * 1.75]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 3, 8]} />
          <meshStandardMaterial {...MAT.wood} />
        </mesh>
      ))
    )}
    {/* Gable roof */}
    <GableRoof w={3.4} h={1.1} d={3.9} y={2.05} mat={MAT.woodDark} />
    {/* Door */}
    <mesh position={[0, 0.7, 1.76]}>
      <planeGeometry args={[0.8, 1.4]} />
      <meshStandardMaterial {...MAT.woodDark} />
    </mesh>
    {/* Window (glass) */}
    <mesh position={[1, 1.15, 1.76]}>
      <planeGeometry args={[0.6, 0.6]} />
      <meshStandardMaterial {...MAT.glass} />
    </mesh>
    {/* Porch deck */}
    <mesh position={[0, 0.1, 2.4]} receiveShadow>
      <boxGeometry args={[3.5, 0.15, 1]} />
      <meshStandardMaterial {...MAT.woodLight} />
    </mesh>
    {/* Stone chimney */}
    <mesh position={[1, 3.1, -0.5]} castShadow>
      <boxGeometry args={[0.45, 1.4, 0.45]} />
      <meshStandardMaterial {...MAT.stone} />
    </mesh>
  </group>
);

const TinyHouse = () => (
  <group>
    {/* trailer chassis */}
    <mesh position={[0, 0.3, 0]} castShadow>
      <boxGeometry args={[2.1, 0.18, 3.2]} />
      <meshStandardMaterial {...MAT.darkMetal} />
    </mesh>
    {/* timber body */}
    <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
      <boxGeometry args={[2, 1.5, 3]} />
      <meshStandardMaterial {...MAT.woodLight} />
    </mesh>
    {/* low gable roof with overhang */}
    <PitchedRoof w={2} d={3} rise={0.55} y={1.9} ov={0.22} mat={MAT.roofDark} gableMat={MAT.woodLight} />
    {/* door */}
    <group position={[-0.45, 0.95, 1.51]}>
      <Door w={0.55} h={1.1} />
    </group>
    {/* window */}
    <group position={[0.55, 1.25, 1.51]}>
      <Window w={0.6} h={0.55} frame={MAT.woodDark} />
    </group>
    {/* wheels */}
    {[[-0.7, 0.18, 1.1], [0.7, 0.18, 1.1], [-0.7, 0.18, -1.1], [0.7, 0.18, -1.1]].map((p, i) => (
      <mesh key={i} position={p as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.1, 14]} />
        <meshStandardMaterial {...MAT.rubber} />
      </mesh>
    ))}
  </group>
);

// ─── AGUA ───────────────────────────────────────────────

const Pool = () => (
  <group>
    <mesh position={[0, 0.05, 0]} receiveShadow>
      <boxGeometry args={[3, 0.1, 5]} />
      <meshStandardMaterial {...MAT.concrete} />
    </mesh>
    <mesh position={[0, -0.15, 0]}>
      <boxGeometry args={[2.6, 0.3, 4.6]} />
      <meshStandardMaterial {...MAT.water} />
    </mesh>
    {/* Pool edge tiles */}
    <mesh position={[0, 0.12, 0]}>
      <boxGeometry args={[3.2, 0.04, 5.2]} />
      <meshStandardMaterial {...MAT.stone} />
    </mesh>
  </group>
);

const RoundPool = () => (
  <group>
    <mesh position={[0, 0.05, 0]} receiveShadow>
      <cylinderGeometry args={[2.2, 2.2, 0.1, 24]} />
      <meshStandardMaterial {...MAT.concrete} />
    </mesh>
    <mesh position={[0, -0.15, 0]}>
      <cylinderGeometry args={[2, 2, 0.3, 24]} />
      <meshStandardMaterial {...MAT.water} />
    </mesh>
  </group>
);

const Jacuzzi = () => (
  <group>
    <mesh position={[0, 0.25, 0]} receiveShadow>
      <cylinderGeometry args={[1.2, 1.3, 0.5, 16]} />
      <meshStandardMaterial {...MAT.woodDark} />
    </mesh>
    <mesh position={[0, 0.15, 0]}>
      <cylinderGeometry args={[1, 1, 0.4, 16]} />
      <meshStandardMaterial {...MAT.water} />
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

// ─── INDUSTRIAL / PACKING ───────────────────────────────

const PackingWarehouse = () => (
  <group>
    {/* Concrete plinth */}
    <mesh position={[0, 0.15, 0]} receiveShadow>
      <boxGeometry args={[40.5, 0.3, 20.5]} />
      <meshStandardMaterial color="#9E9E9E" roughness={0.95} />
    </mesh>
    {/* Walls (sandwich panel white) */}
    <mesh position={[0, 3.3, 0]} castShadow receiveShadow>
      <boxGeometry args={[40, 6, 20]} />
      <meshStandardMaterial color="#F5F5F5" roughness={0.6} metalness={0.1} />
    </mesh>
    {/* Gable roof - two sloped planes */}
    <mesh position={[0, 7.3, 5]} rotation={[0.32, 0, 0]} castShadow>
      <boxGeometry args={[40.4, 0.15, 11]} />
      <meshStandardMaterial color="#78909C" metalness={0.5} roughness={0.4} />
    </mesh>
    <mesh position={[0, 7.3, -5]} rotation={[-0.32, 0, 0]} castShadow>
      <boxGeometry args={[40.4, 0.15, 11]} />
      <meshStandardMaterial color="#78909C" metalness={0.5} roughness={0.4} />
    </mesh>
    {/* Ridge */}
    <mesh position={[0, 8.85, 0]} castShadow>
      <boxGeometry args={[40.5, 0.2, 0.4]} />
      <meshStandardMaterial color="#546E7A" />
    </mesh>
    {/* Loading bay doors (front face) */}
    {Array.from({ length: 5 }).map((_, i) => (
      <mesh key={`door${i}`} position={[(i - 2) * 6.5, 1.8, 10.06]}>
        <planeGeometry args={[3, 3.2]} />
        <meshStandardMaterial color="#37474F" />
      </mesh>
    ))}
    {/* Side strip windows */}
    <mesh position={[20.06, 5, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={[18, 0.8]} />
      <meshStandardMaterial color="#4FC3F7" transparent opacity={0.6} />
    </mesh>
    <mesh position={[-20.06, 5, 0]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[18, 0.8]} />
      <meshStandardMaterial color="#4FC3F7" transparent opacity={0.6} />
    </mesh>
    {/* Brand stripe */}
    <mesh position={[0, 5.2, 10.06]}>
      <planeGeometry args={[40, 0.4]} />
      <meshStandardMaterial color="#0EA5E9" />
    </mesh>
  </group>
);

const LoadingDock = () => (
  <group>
    {/* Elevated platform 1.2m high */}
    <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
      <boxGeometry args={[16, 1.2, 4]} />
      <meshStandardMaterial color="#BDBDBD" roughness={0.9} />
    </mesh>
    {/* Edge buffer (yellow) */}
    <mesh position={[0, 1.22, 2]}>
      <boxGeometry args={[16, 0.04, 0.2]} />
      <meshStandardMaterial color="#FFC107" />
    </mesh>
    {/* Bumpers */}
    {[-6, -2, 2, 6].map((x, i) => (
      <mesh key={i} position={[x, 0.45, 2.15]} castShadow>
        <boxGeometry args={[0.5, 0.4, 0.2]} />
        <meshStandardMaterial color="#212121" />
      </mesh>
    ))}
    {/* Railing back */}
    {[-7.5, 7.5].map((x, i) => (
      <mesh key={`p${i}`} position={[x, 1.7, -1.9]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1, 8]} />
        <meshStandardMaterial color="#FFC107" />
      </mesh>
    ))}
    <mesh position={[0, 2.1, -1.9]} castShadow>
      <boxGeometry args={[15.2, 0.06, 0.06]} />
      <meshStandardMaterial color="#FFC107" />
    </mesh>
  </group>
);

const ColdRoom = () => (
  <group>
    {/* Insulated panel building 15x10x6 */}
    <mesh position={[0, 3, 0]} castShadow receiveShadow>
      <boxGeometry args={[15, 6, 10]} />
      <meshStandardMaterial color="#FAFAFA" roughness={0.5} metalness={0.2} />
    </mesh>
    {/* Flat roof slab */}
    <mesh position={[0, 6.1, 0]} castShadow>
      <boxGeometry args={[15.4, 0.2, 10.4]} />
      <meshStandardMaterial color="#90A4AE" metalness={0.4} />
    </mesh>
    {/* Refrigeration units on roof */}
    {[-4, 0, 4].map((x, i) => (
      <mesh key={i} position={[x, 6.7, -2]} castShadow>
        <boxGeometry args={[2.5, 1.2, 1.8]} />
        <meshStandardMaterial color="#607D8B" metalness={0.6} />
      </mesh>
    ))}
    {/* Insulated door */}
    <mesh position={[0, 1.8, 5.06]}>
      <planeGeometry args={[2.5, 3]} />
      <meshStandardMaterial color="#CFD8DC" metalness={0.5} />
    </mesh>
    {/* Snowflake-blue stripe */}
    <mesh position={[0, 5.2, 5.06]}>
      <planeGeometry args={[15, 0.3]} />
      <meshStandardMaterial color="#4DD0E1" />
    </mesh>
  </group>
);

const IndustrialOffice = () => (
  <group>
    {/* Two-story block */}
    <mesh position={[0, 3, 0]} castShadow receiveShadow>
      <boxGeometry args={[12, 6, 8]} />
      <meshStandardMaterial color="#ECEFF1" />
    </mesh>
    {/* Roof */}
    <mesh position={[0, 6.1, 0]} castShadow>
      <boxGeometry args={[12.4, 0.2, 8.4]} />
      <meshStandardMaterial color="#455A64" />
    </mesh>
    {/* Strip windows level 1 */}
    <mesh position={[0, 1.8, 4.06]}>
      <planeGeometry args={[10, 1.4]} />
      <meshStandardMaterial color="#4FC3F7" transparent opacity={0.6} />
    </mesh>
    {/* Strip windows level 2 */}
    <mesh position={[0, 4.5, 4.06]}>
      <planeGeometry args={[10, 1.4]} />
      <meshStandardMaterial color="#4FC3F7" transparent opacity={0.6} />
    </mesh>
    {/* Same on back */}
    <mesh position={[0, 1.8, -4.06]}>
      <planeGeometry args={[10, 1.4]} />
      <meshStandardMaterial color="#4FC3F7" transparent opacity={0.6} />
    </mesh>
    <mesh position={[0, 4.5, -4.06]}>
      <planeGeometry args={[10, 1.4]} />
      <meshStandardMaterial color="#4FC3F7" transparent opacity={0.6} />
    </mesh>
    {/* Entrance canopy */}
    <mesh position={[0, 2.5, 4.5]} castShadow>
      <boxGeometry args={[3.5, 0.1, 1.2]} />
      <meshStandardMaterial color="#37474F" />
    </mesh>
    {/* Door */}
    <mesh position={[0, 1, 4.07]}>
      <planeGeometry args={[1.6, 2]} />
      <meshStandardMaterial color="#263238" />
    </mesh>
  </group>
);

const TruckParking = () => (
  <group>
    {/* Asphalt base */}
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[24, 16]} />
      <meshStandardMaterial color="#37474F" roughness={0.95} />
    </mesh>
    {/* Yellow bay markings - 6 bays for semi-trailers */}
    {Array.from({ length: 7 }).map((_, i) => (
      <mesh key={i} position={[(i - 3) * 3.5, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.12, 14]} />
        <meshStandardMaterial color="#FFC107" />
      </mesh>
    ))}
    {/* End line */}
    <mesh position={[0, 0.04, -7]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[24, 0.15]} />
      <meshStandardMaterial color="#FFC107" />
    </mesh>
    {/* Bay numbers — yellow circles */}
    {Array.from({ length: 6 }).map((_, i) => (
      <mesh key={`n${i}`} position={[(i - 2.5) * 3.5, 0.04, 5.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshStandardMaterial color="#FFC107" />
      </mesh>
    ))}
  </group>
);

const ManeuverArea = () => (
  <group>
    {/* Circular asphalt pad 20m diameter */}
    <mesh position={[0, 0.02, 0]} receiveShadow>
      <cylinderGeometry args={[10, 10, 0.04, 48]} />
      <meshStandardMaterial color="#37474F" roughness={0.95} />
    </mesh>
    {/* Outer yellow ring */}
    <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[9.5, 9.7, 48]} />
      <meshStandardMaterial color="#FFC107" />
    </mesh>
    {/* Inner directional arrows */}
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * 6, 0.05, Math.sin(a) * 6]} rotation={[-Math.PI / 2, 0, -a]}>
          <planeGeometry args={[0.6, 0.15]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
      );
    })}
  </group>
);

const Weighbridge = () => (
  <group>
    {/* Concrete platform 18x3 */}
    <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
      <boxGeometry args={[18, 0.3, 3]} />
      <meshStandardMaterial color="#BDBDBD" roughness={0.9} />
    </mesh>
    {/* Steel deck overlay */}
    <mesh position={[0, 0.32, 0]} receiveShadow>
      <boxGeometry args={[17.6, 0.05, 2.8]} />
      <meshStandardMaterial color="#78909C" metalness={0.7} roughness={0.4} />
    </mesh>
    {/* Approach lines */}
    {[-1.2, 1.2].map((x, i) => (
      <mesh key={i} position={[x, 0.36, 0]}>
        <boxGeometry args={[18, 0.02, 0.1]} />
        <meshStandardMaterial color="#FFC107" />
      </mesh>
    ))}
    {/* Operator booth */}
    <mesh position={[10.5, 1.5, 2]} castShadow receiveShadow>
      <boxGeometry args={[3, 3, 2.5]} />
      <meshStandardMaterial color="#FF7043" />
    </mesh>
    <mesh position={[10.5, 3.15, 2]} castShadow>
      <boxGeometry args={[3.3, 0.15, 2.8]} />
      <meshStandardMaterial color="#37474F" />
    </mesh>
    {/* Booth window */}
    <mesh position={[9, 1.8, 2]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[1.8, 1.2]} />
      <meshStandardMaterial color="#4FC3F7" transparent opacity={0.6} />
    </mesh>
  </group>
);

const Gatehouse = () => (
  <group>
    {/* Booth 4x3 */}
    <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
      <boxGeometry args={[4, 2.8, 3]} />
      <meshStandardMaterial color="#ECEFF1" />
    </mesh>
    {/* Roof overhang */}
    <mesh position={[0, 2.95, 0]} castShadow>
      <boxGeometry args={[5, 0.15, 4]} />
      <meshStandardMaterial color="#D32F2F" />
    </mesh>
    {/* Windows wraparound */}
    <mesh position={[0, 1.7, 1.51]}>
      <planeGeometry args={[3.2, 1.4]} />
      <meshStandardMaterial color="#4FC3F7" transparent opacity={0.6} />
    </mesh>
    <mesh position={[2.01, 1.7, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={[2.2, 1.4]} />
      <meshStandardMaterial color="#4FC3F7" transparent opacity={0.6} />
    </mesh>
    {/* Boom barrier */}
    <mesh position={[3, 1.4, 0]} castShadow>
      <cylinderGeometry args={[0.1, 0.1, 2.8, 8]} />
      <meshStandardMaterial color="#D32F2F" />
    </mesh>
    <mesh position={[6.5, 1.6, 0]} rotation={[0, 0, 0]} castShadow>
      <boxGeometry args={[7, 0.1, 0.1]} />
      <meshStandardMaterial color="#FFFFFF" />
    </mesh>
    {/* Stripes on boom */}
    {[-2.5, 0, 2.5].map((x, i) => (
      <mesh key={i} position={[6.5 + x, 1.61, 0]}>
        <boxGeometry args={[0.6, 0.12, 0.12]} />
        <meshStandardMaterial color="#D32F2F" />
      </mesh>
    ))}
  </group>
);

const IndustrialFence = () => (
  <group>
    {/* Posts every meter */}
    {Array.from({ length: 11 }).map((_, i) => (
      <mesh key={i} position={[i * 1 - 5, 1.25, 0]} castShadow>
        <boxGeometry args={[0.08, 2.5, 0.08]} />
        <meshStandardMaterial color="#616161" metalness={0.6} />
      </mesh>
    ))}
    {/* Mesh panels (translucent grey) */}
    <mesh position={[0, 1.25, 0]}>
      <planeGeometry args={[10, 2.4]} />
      <meshStandardMaterial color="#9E9E9E" wireframe transparent opacity={0.7} />
    </mesh>
    {/* Top barbed wire suggestion */}
    <mesh position={[0, 2.6, 0]}>
      <boxGeometry args={[10.2, 0.04, 0.04]} />
      <meshStandardMaterial color="#424242" />
    </mesh>
  </group>
);

// Fallback for GLB custom objects (rendered by GLTFAssetLoader instead)
const FallbackGLBPlaceholder = () => (
  <mesh position={[0, 0.5, 0]} castShadow>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#9E9E9E" wireframe />
  </mesh>
);

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
  galpon_packing: PackingWarehouse,
  anden_carga: LoadingDock,
  camara_frio: ColdRoom,
  oficinas_industrial: IndustrialOffice,
  estacionamiento_camiones: TruckParking,
  area_maniobras: ManeuverArea,
  bascula: Weighbridge,
  porteria: Gatehouse,
  cerco_industrial: IndustrialFence,
  glb_custom: FallbackGLBPlaceholder,
};

export const ParcelaObject3D = ({ obj, isSelected, onClick }: ObjectProps) => {
  const ref = useRef<THREE.Group>(null);
  const Component = OBJECT_COMPONENTS[obj.type];

  return (
    <group
      ref={ref}
      name={obj.id}
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
