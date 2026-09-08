import { Component, ReactNode, Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import dayAsset from '@/assets/brand/earth-day.jpg.asset.json';
import normalAsset from '@/assets/brand/earth-normal.jpg.asset.json';
import specularAsset from '@/assets/brand/earth-specular.jpg.asset.json';
import cloudsAsset from '@/assets/brand/earth-clouds.png.asset.json';

interface InteractiveEarthProps {
  reducedMotion: boolean;
  onReady?: () => void;
}

const CHILE_LAT = -33.45;
const CHILE_LON = -70.67;
const SOUTH_AMERICA_ROTATION = 0.72;
const assetUrl = (path: string) => path.startsWith('/__l5e/') ? `https://ofertaterrenos.com${path}` : path;

class EarthErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const latLonToVector = (latitude: number, longitude: number, radius: number) => {
  const phi = THREE.MathUtils.degToRad(90 - latitude);
  const theta = THREE.MathUtils.degToRad(longitude + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
};

const Atmosphere = () => (
  <mesh scale={1.075}>
    <sphereGeometry args={[1, 64, 64]} />
    <shaderMaterial
      transparent
      side={THREE.BackSide}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
      vertexShader={/* glsl */ `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={/* glsl */ `
        varying vec3 vNormal;
        void main() {
          float rim = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.05, 0.65, 0.85, rim * 0.72);
        }
      `}
    />
  </mesh>
);

interface EarthModelProps extends InteractiveEarthProps {
  pointer: React.MutableRefObject<{ x: number; y: number; active: boolean }>;
}

const EarthModel = ({ pointer, reducedMotion, onReady }: EarthModelProps) => {
  const earthRef = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const [day, normal, specular, clouds] = useTexture([
    assetUrl(dayAsset.url),
    assetUrl(normalAsset.url),
    assetUrl(specularAsset.url),
    assetUrl(cloudsAsset.url),
  ]);

  useEffect(() => {
    day.colorSpace = THREE.SRGBColorSpace;
    clouds.colorSpace = THREE.SRGBColorSpace;
    onReady?.();
  }, [clouds, day, onReady]);

  const chilePosition = useMemo(() => latLonToVector(CHILE_LAT, CHILE_LON, 1.025), []);
  const chileNormal = useMemo(() => chilePosition.clone().normalize(), [chilePosition]);
  const markerRotation = useMemo(() => {
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), chileNormal);
    return new THREE.Euler().setFromQuaternion(quaternion);
  }, [chileNormal]);

  useFrame((state, rawDelta) => {
    const earth = earthRef.current;
    if (!earth) return;
    const delta = Math.min(rawDelta, 0.05);
    const targetX = pointer.current.active && !reducedMotion ? pointer.current.y * 0.1 : 0;
    const targetY = pointer.current.active && !reducedMotion ? pointer.current.x * 0.18 : 0;
    const damping = 1 - Math.exp(-3.5 * delta);
    earth.rotation.x = THREE.MathUtils.lerp(earth.rotation.x, targetX, damping);
    earth.rotation.y = THREE.MathUtils.lerp(
      earth.rotation.y,
      SOUTH_AMERICA_ROTATION + targetY + (reducedMotion ? 0 : state.clock.elapsedTime * 0.018),
      damping,
    );
    if (cloudRef.current && !reducedMotion) cloudRef.current.rotation.y += delta * 0.012;
    if (pulseRef.current && !reducedMotion) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.18;
      pulseRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={earthRef} rotation={[0, SOUTH_AMERICA_ROTATION, -0.12]}>
      <mesh>
        <sphereGeometry args={[1, 96, 96]} />
        <meshPhongMaterial
          map={day}
          normalMap={normal}
          normalScale={new THREE.Vector2(0.35, 0.35)}
          specularMap={specular}
          specular={new THREE.Color(0x24485a)}
          shininess={18}
        />
      </mesh>
      <mesh ref={cloudRef} scale={1.008}>
        <sphereGeometry args={[1, 72, 72]} />
        <meshPhongMaterial map={clouds} transparent opacity={0.24} depthWrite={false} />
      </mesh>
      <Atmosphere />
      <group position={chilePosition} rotation={markerRotation}>
        <mesh position-z={0.018}>
          <sphereGeometry args={[0.018, 20, 20]} />
          <meshBasicMaterial color={new THREE.Color(0x22c55e)} toneMapped={false} />
        </mesh>
        <mesh ref={pulseRef} position-z={0.009}>
          <ringGeometry args={[0.026, 0.044, 32]} />
          <meshBasicMaterial color={new THREE.Color(0x22c55e)} transparent opacity={0.5} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
};

const Scene = (props: EarthModelProps) => {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.24} color={new THREE.Color(0x6ba8bd)} />
      <directionalLight position={[-3, 2, 5]} intensity={3.1} color={new THREE.Color(0xf7f7f2)} />
      <pointLight position={[3, -2, 2]} intensity={0.8} color={new THREE.Color(0x0ea5e9)} />
      <EarthModel {...props} />
    </>
  );
};

const InteractiveEarth = ({ reducedMotion, onReady }: InteractiveEarthProps) => {
  const pointer = useRef({ x: 0, y: 0, active: false });

  return (
    <div
      className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
      aria-hidden="true"
      onPointerEnter={() => { pointer.current.active = true; }}
      onPointerLeave={() => { pointer.current = { x: 0, y: 0, active: false }; }}
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        pointer.current = {
          x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
          y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
          active: true,
        };
      }}
    >
      <EarthErrorBoundary>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 3.05], fov: 39 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          frameloop={reducedMotion ? 'demand' : 'always'}
        >
          <Suspense fallback={null}>
            <Scene pointer={pointer} reducedMotion={reducedMotion} onReady={onReady} />
          </Suspense>
        </Canvas>
      </EarthErrorBoundary>
    </div>
  );
};

export default InteractiveEarth;