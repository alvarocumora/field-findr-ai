import { useRef, useMemo, Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import earthTextureSrc from '@/assets/earth-dark-cartographic.jpg';

/* ─── Chile border outline (simplified ~20 points) ─── */
const CHILE_BORDER: [number, number][] = [
  [-17.5, -69.5], [-18.5, -70.0], [-20.0, -70.0], [-23.5, -70.5],
  [-27.0, -71.0], [-30.0, -71.5], [-33.0, -71.6], [-35.0, -72.0],
  [-38.0, -73.0], [-40.0, -73.5], [-42.0, -73.0], [-44.0, -72.0],
  [-46.0, -74.0], [-49.0, -75.0], [-52.0, -74.0], [-54.0, -70.0],
  [-52.0, -69.0], [-49.0, -73.0], [-46.0, -72.0], [-42.0, -71.5],
  [-38.0, -71.0], [-35.0, -70.0], [-33.0, -70.0], [-30.0, -69.5],
  [-27.0, -69.0], [-23.5, -67.5], [-20.0, -69.0], [-17.5, -69.5],
];

function latLngToSphere(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/* ─── Globe mesh ─── */
function Globe({ scrollProgress }: { scrollProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const tex = useLoader(THREE.TextureLoader, earthTextureSrc);

  // Chile outline geometry
  const chileGeom = useMemo(() => {
    const pts = CHILE_BORDER.map(([lat, lng]) => latLngToSphere(lat, lng, 2.005));
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    return geom;
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    // Slow idle rotation
    meshRef.current.rotation.y += 0.0008;
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          map={tex}
          roughness={0.9}
          metalness={0.05}
          emissive={new THREE.Color('#0a2e1a')}
          emissiveIntensity={0.08}
        />
      </mesh>
      {/* Chile highlight */}
      <lineLoop geometry={chileGeom}>
        <lineBasicMaterial color="#22c55e" linewidth={2} transparent opacity={0.8} />
      </lineLoop>
    </group>
  );
}

/* ─── Camera controller driven by scroll ─── */
function CameraRig({ scrollProgress }: { scrollProgress: number }) {
  const { camera } = useThree();

  useFrame(() => {
    const t = Math.min(Math.max(scrollProgress, 0), 1);
    // Orbital start → Chile close-up
    const startPos = new THREE.Vector3(0, 0, 6);
    const endPos = latLngToSphere(-33.4, -70.6, 3.2);
    
    camera.position.lerpVectors(startPos, endPos, t * t); // ease-in
    
    const lookTarget = new THREE.Vector3(0, 0, 0);
    camera.lookAt(lookTarget);
  });

  return null;
}

/* ─── Scroll progress bridge ─── */
function SceneContent({ scrollProgress }: { scrollProgress: number }) {
  return (
    <>
      <ambientLight intensity={0.15} color="#a0d8ef" />
      <directionalLight position={[5, 3, 5]} intensity={0.8} color="#e0f0ea" />
      <pointLight position={[-5, -2, -5]} intensity={0.2} color="#22c55e" />
      <Stars radius={50} depth={40} count={1500} factor={3} fade speed={0.5} />
      <Globe scrollProgress={scrollProgress} />
      <CameraRig scrollProgress={scrollProgress} />
    </>
  );
}

/* ─── Main component ─── */
const CartographicHero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.4, 0.9, 1], [1, 1, 0.6, 0]);
  const titleY = useTransform(scrollYProgress, [0, 0.5], ['0%', '-30%']);
  const coordOpacity = useTransform(scrollYProgress, [0.3, 0.6], [0, 1]);
  const coordY = useTransform(scrollYProgress, [0.3, 0.6], ['20px', '0px']);

  useEffect(() => {
    const unsub = scrollYProgress.on('change', (v) => setProgress(v));
    return unsub;
  }, [scrollYProgress]);

  return (
    <section ref={containerRef} className="relative h-[250vh]">
      {/* Sticky canvas */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-background">
        {/* 3D Canvas */}
        <motion.div className="absolute inset-0" style={{ opacity }}>
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-background">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
          }>
            <Canvas
              camera={{ position: [0, 0, 6], fov: 45 }}
              gl={{ antialias: true, alpha: true }}
              dpr={[1, 1.5]}
            >
              <SceneContent scrollProgress={progress} />
            </Canvas>
          </Suspense>
        </motion.div>

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(var(--background))_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />

        {/* Typography overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <motion.div
            className="text-center"
            style={prefersReducedMotion ? {} : { y: titleY }}
          >
            {/* Swiss-style label */}
            <motion.p
              className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.4em] text-primary/70 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              Plataforma de Inversión en Terrenos
            </motion.p>

            {/* Main headline */}
            <motion.h1
              className="text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-heading font-bold tracking-tight leading-[0.85] text-foreground"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
            >
              <span className="block">OFERTA</span>
              <span className="block gradient-text-hero">TERRENOS</span>
            </motion.h1>

            {/* Coordinates — appear as user scrolls */}
            <motion.div
              className="mt-8 font-mono text-xs sm:text-sm text-muted-foreground tracking-[0.2em]"
              style={prefersReducedMotion ? {} : { opacity: coordOpacity, y: coordY }}
            >
              <span className="text-primary">−33.4489° S</span>
              <span className="mx-3 text-border">|</span>
              <span className="text-primary">−70.6693° W</span>
              <span className="mx-3 text-border">|</span>
              <span>Santiago, Chile</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-muted-foreground">
            Scroll
          </span>
          <div className="w-px h-10 bg-gradient-to-b from-primary/60 to-transparent" />
        </motion.div>

        {/* Scroll progress line */}
        <motion.div
          className="absolute bottom-0 left-0 h-px bg-primary/40 z-20"
          style={{ width: useTransform(scrollYProgress, [0, 1], ['0%', '100%']) }}
        />
      </div>
    </section>
  );
};

export default CartographicHero;
