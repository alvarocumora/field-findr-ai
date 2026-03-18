import { useRef, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Sky, Environment, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ParcelaObject3D } from './ParcelaObjects';
import { ParcelaToolbar } from './ParcelaToolbar';
import { useParcelaState, type ParcelaObjectType } from './useParcelaState';
import { toast } from 'sonner';

interface ParcelaDesigner3DProps {
  polygon: number[][] | null; // [[lng, lat], ...] from lot.polygon
  lotNumber: string;
  lotArea: number;
  lotPrice?: number;
  savedDesign?: string | null;
  onSave?: (designJson: string) => void;
}

/**
 * Convert geo polygon coordinates to local meter-based coordinates.
 * Centers the polygon and projects lat/lng to approximate meters.
 */
function polygonToLocalCoords(polygon: number[][]): [number, number][] {
  if (!polygon || polygon.length === 0) return [];

  // Find centroid
  const cx = polygon.reduce((s, p) => s + p[0], 0) / polygon.length;
  const cy = polygon.reduce((s, p) => s + p[1], 0) / polygon.length;

  const metersPerDegLng = 111320 * Math.cos((cy * Math.PI) / 180);
  const metersPerDegLat = 110540;

  return polygon.map(([lng, lat]) => [
    (lng - cx) * metersPerDegLng,
    (lat - cy) * metersPerDegLat,
  ]);
}

function createTerrainShape(coords: [number, number][]): THREE.Shape {
  const shape = new THREE.Shape();
  if (coords.length === 0) {
    // Default 20x30 rectangle
    shape.moveTo(-10, -15);
    shape.lineTo(10, -15);
    shape.lineTo(10, 15);
    shape.lineTo(-10, 15);
    shape.closePath();
    return shape;
  }
  shape.moveTo(coords[0][0], coords[0][1]);
  for (let i = 1; i < coords.length; i++) {
    shape.lineTo(coords[i][0], coords[i][1]);
  }
  shape.closePath();
  return shape;
}

const Terrain = ({ polygon }: { polygon: number[][] | null }) => {
  const localCoords = useMemo(() => polygonToLocalCoords(polygon || []), [polygon]);
  const shape = useMemo(() => createTerrainShape(localCoords), [localCoords]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh receiveShadow>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color="#7CB342" side={THREE.DoubleSide} />
      </mesh>
      {/* Border */}
      <lineLoop>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={localCoords.length || 4}
            array={new Float32Array(
              (localCoords.length > 0
                ? localCoords.flatMap(([x, y]) => [x, y, 0.05])
                : [-10, -15, 0.05, 10, -15, 0.05, 10, 15, 0.05, -10, 15, 0.05])
            )}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#33691E" linewidth={2} />
      </lineLoop>
    </group>
  );
};

const ClickPlane = ({ onClickGround }: { onClickGround: (point: THREE.Vector3) => void }) => (
  <mesh
    rotation={[-Math.PI / 2, 0, 0]}
    position={[0, 0, 0]}
    visible={false}
    onClick={(e) => {
      e.stopPropagation();
      onClickGround(e.point);
    }}
  >
    <planeGeometry args={[200, 200]} />
    <meshBasicMaterial transparent opacity={0} />
  </mesh>
);

const SceneCapture = ({ captureRef }: { captureRef: React.MutableRefObject<(() => void) | null> }) => {
  const { gl, scene, camera } = useThree();
  captureRef.current = () => {
    gl.render(scene, camera);
    const dataUrl = gl.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'mi-parcela-3d.png';
    link.href = dataUrl;
    link.click();
    toast.success('Captura guardada');
  };
  return null;
};

export const ParcelaDesigner3D = ({
  polygon, lotNumber, lotArea, lotPrice, savedDesign, onSave,
}: ParcelaDesigner3DProps) => {
  const parcelaState = useParcelaState();
  const captureRef = useRef<(() => void) | null>(null);
  const pendingPlaceRef = useRef<ParcelaObjectType | null>(null);

  // Load saved design on mount
  useMemo(() => {
    if (savedDesign) {
      parcelaState.loadFromJSON(savedDesign);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddObject = useCallback((type: ParcelaObjectType) => {
    pendingPlaceRef.current = type;
    toast.info('Haz clic en el terreno para colocar el objeto');
  }, []);

  const handleGroundClick = useCallback((point: THREE.Vector3) => {
    if (pendingPlaceRef.current) {
      parcelaState.addObject(pendingPlaceRef.current, [point.x, 0.01, point.z]);
      pendingPlaceRef.current = null;
    } else {
      parcelaState.selectObject(null);
    }
  }, [parcelaState]);

  const handleSave = useCallback(() => {
    const json = parcelaState.toJSON();
    onSave?.(json);
    toast.success('Diseño guardado');
  }, [parcelaState, onSave]);

  const handleCapture = useCallback(() => {
    captureRef.current?.();
  }, []);

  const handleRemoveSelected = useCallback(() => {
    if (parcelaState.selectedId) {
      parcelaState.removeObject(parcelaState.selectedId);
    }
  }, [parcelaState]);

  return (
    <div className="flex h-[600px] sm:h-[700px] rounded-xl overflow-hidden border border-border/40 bg-card">
      {/* Sidebar */}
      <ParcelaToolbar
        onAddObject={handleAddObject}
        onRotate={parcelaState.rotateSelected}
        onScale={parcelaState.scaleSelected}
        onRemoveSelected={handleRemoveSelected}
        onCapture={handleCapture}
        onSave={handleSave}
        onReset={parcelaState.resetAll}
        selectedId={parcelaState.selectedId}
        lotInfo={{ lotNumber, area: lotArea, price: lotPrice }}
      />

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Canvas
          shadows
          camera={{ position: [25, 20, 25], fov: 50 }}
          gl={{ preserveDrawingBuffer: true }}
        >
          <Suspense fallback={null}>
            <SceneCapture captureRef={captureRef} />

            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[20, 30, 10]}
              intensity={1.2}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-far={100}
              shadow-camera-left={-40}
              shadow-camera-right={40}
              shadow-camera-top={40}
              shadow-camera-bottom={-40}
            />

            {/* Sky */}
            <Sky sunPosition={[50, 30, 20]} />

            {/* Terrain */}
            <Terrain polygon={polygon} />

            {/* Grid */}
            <Grid
              infiniteGrid
              cellSize={1}
              sectionSize={5}
              fadeDistance={60}
              cellColor="#A5D6A7"
              sectionColor="#66BB6A"
              cellThickness={0.5}
              sectionThickness={1}
              position={[0, -0.01, 0]}
            />

            {/* Invisible click plane */}
            <ClickPlane onClickGround={handleGroundClick} />

            {/* Placed objects */}
            {parcelaState.objects.map(obj => (
              <ParcelaObject3D
                key={obj.id}
                obj={obj}
                isSelected={obj.id === parcelaState.selectedId}
                onClick={() => parcelaState.selectObject(obj.id)}
              />
            ))}

            {/* Controls */}
            <OrbitControls
              maxPolarAngle={Math.PI / 2.2}
              minDistance={5}
              maxDistance={80}
              enableDamping
              dampingFactor={0.1}
            />
          </Suspense>
        </Canvas>

        {/* Overlay info */}
        <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-muted-foreground border border-border/40">
          Click en terreno para colocar · Arrastra para rotar vista · Scroll para zoom
        </div>
        <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-foreground border border-border/40">
          {parcelaState.objects.length} objetos
        </div>
      </div>
    </div>
  );
};
