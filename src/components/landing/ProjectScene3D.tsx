import { Suspense, useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Procedural terrain tile ─── */
function TerrainTile({ seed = 0 }: { seed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const size = 4;
    const segments = 32;
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    const positions = geom.attributes.position;

    // Simple noise-like terrain using sin waves
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const height =
        Math.sin(x * 1.5 + seed) * 0.2 +
        Math.sin(y * 2.0 + seed * 0.7) * 0.15 +
        Math.sin((x + y) * 3 + seed * 1.3) * 0.08;
      positions.setZ(i, height);
    }

    geom.computeVertexNormals();
    return geom;
  }, [seed]);

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial
        color="#1a3a2a"
        roughness={0.85}
        metalness={0.05}
        wireframe={false}
        flatShading
      />
    </mesh>
  );
}

/* ─── Grid overlay ─── */
function GridOverlay() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <planeGeometry args={[4, 4, 16, 16]} />
      <meshBasicMaterial color="#22c55e" wireframe transparent opacity={0.08} />
    </mesh>
  );
}

/* ─── Lot pins ─── */
function LotPins({ seed }: { seed: number }) {
  const pins = useMemo(() => {
    const count = 4 + Math.floor(seed % 3);
    return Array.from({ length: count }, (_, i) => ({
      x: (Math.sin(seed * (i + 1) * 0.7) * 1.2),
      z: (Math.cos(seed * (i + 1) * 0.5) * 1.2),
      h: 0.15 + Math.sin(seed + i) * 0.1,
    }));
  }, [seed]);

  return (
    <group>
      {pins.map((pin, i) => (
        <group key={i} position={[pin.x, pin.h + 0.08, pin.z]}>
          <mesh>
            <cylinderGeometry args={[0.03, 0.03, 0.15, 8]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── Auto-rotating scene ─── */
function Scene({ seed }: { seed: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <TerrainTile seed={seed} />
      <GridOverlay />
      <LotPins seed={seed} />
    </group>
  );
}

/* ─── Main component ─── */
interface ProjectScene3DProps {
  latitude?: number | null;
  longitude?: number | null;
}

const ProjectScene3D = ({ latitude, longitude }: ProjectScene3DProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const seed = useMemo(
    () => Math.abs((latitude ?? 0) * 100 + (longitude ?? 0) * 50),
    [latitude, longitude]
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      {isVisible ? (
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
          </div>
        }>
          <Canvas
            camera={{ position: [3, 2.5, 3], fov: 35 }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 1.5]}
            style={{ background: 'transparent' }}
          >
            <ambientLight intensity={0.3} color="#a0d8ef" />
            <directionalLight position={[4, 6, 3]} intensity={0.7} color="#e0f0ea" castShadow />
            <pointLight position={[-3, 1, -2]} intensity={0.15} color="#22c55e" />
            <Scene seed={seed} />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate={false}
              maxPolarAngle={Math.PI / 2.5}
              minPolarAngle={Math.PI / 4}
            />
          </Canvas>
        </Suspense>
      ) : (
        <div className="w-full h-full bg-background grid-topo" />
      )}
    </div>
  );
};

export default ProjectScene3D;
