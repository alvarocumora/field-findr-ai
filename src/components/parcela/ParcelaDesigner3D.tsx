import { useRef, useMemo, useCallback, useEffect, useState, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { ParcelaObject3D } from './ParcelaObjects';
import { GLTFAssetObject } from './GLTFAssetLoader';
import { ParcelaToolbar } from './ParcelaToolbar';
import { AssetCatalog, type GLBAsset } from './AssetCatalog';
import { ObjectPropertiesPanel } from './ObjectPropertiesPanel';
import { SolarLight } from './SolarLight';
import { MeasurementLine } from './MeasurementLine';
import { PedestrianCamera } from './PedestrianCamera';
import { RealisticTerrain, type TerrainHandle } from './RealisticTerrain';
import { useParcelaState, type ParcelaObjectType } from './useParcelaState';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

interface ParcelaDesigner3DProps {
  polygon: number[][] | null;
  lotNumber: string;
  lotArea: number;
  lotPrice?: number;
  latitude?: number;
  longitude?: number;
  savedDesign?: string | null;
  onSave?: (designJson: string) => void;
}

function polygonToLocalCoords(polygon: number[][]): [number, number][] {
  if (!polygon || polygon.length === 0) return [];
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

const FlatTerrain = ({ polygon }: { polygon: number[][] | null }) => {
  const localCoords = useMemo(() => polygonToLocalCoords(polygon || []), [polygon]);
  const shape = useMemo(() => createTerrainShape(localCoords), [localCoords]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh receiveShadow>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color="#7CB342" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
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

const ClickPlane = ({ onClick }: { onClick: (point: THREE.Vector3) => void }) => (
  <mesh
    rotation={[-Math.PI / 2, 0, 0]}
    position={[0, 0, 0]}
    visible={false}
    onClick={(e) => { e.stopPropagation(); onClick(e.point); }}
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

const CameraController = ({ viewMode, controlsRef }: { viewMode: string; controlsRef: React.MutableRefObject<any> }) => {
  const { camera } = useThree();
  useEffect(() => {
    if (viewMode === 'top') {
      camera.position.set(0, 60, 0.01);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) { controlsRef.current.target.set(0, 0, 0); controlsRef.current.update(); }
    } else if (viewMode === 'orbit') {
      camera.position.set(25, 20, 25);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) { controlsRef.current.target.set(0, 0, 0); controlsRef.current.update(); }
    }
  }, [viewMode, camera, controlsRef]);
  return null;
};

export const ParcelaDesigner3D = ({
  polygon, lotNumber, lotArea, lotPrice, latitude, longitude, savedDesign, onSave,
}: ParcelaDesigner3DProps) => {
  const ps = useParcelaState();
  const captureRef = useRef<(() => void) | null>(null);
  const pendingPlaceRef = useRef<ParcelaObjectType | null>(null);
  const pendingGLBRef = useRef<GLBAsset | null>(null);
  const controlsRef = useRef<any>(null);
  const terrainRef = useRef<TerrainHandle>(null);
  const [useRealisticTerrain, setUseRealisticTerrain] = useState(false);
  const [baseElevation, setBaseElevation] = useState(0);
  const [glbAssets, setGlbAssets] = useState<GLBAsset[]>([]);

  // Load saved design on mount
  useMemo(() => {
    if (savedDesign) ps.loadFromJSON(savedDesign);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts: Q/W/E for transform mode, Delete, Ctrl+Z/Y
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); ps.undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); ps.redo(); }
      if (e.key === 'Delete' && ps.selectedId) ps.removeObject(ps.selectedId);
      if (e.key === 'Escape') ps.selectObject(null);
      // Q/W/E for transform modes
      if (e.key === 'q' || e.key === 'Q') ps.setTransformMode('translate');
      if (e.key === 'w' || e.key === 'W') { if (!e.ctrlKey) ps.setTransformMode('rotate'); }
      if (e.key === 'e' || e.key === 'E') ps.setTransformMode('scale');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ps]);

  const snapToTerrain = useCallback((x: number, z: number): number => {
    if (useRealisticTerrain && terrainRef.current) {
      return terrainRef.current.getHeightAt(x, z);
    }
    return 0.01;
  }, [useRealisticTerrain]);

  const handleAddObject = useCallback((type: ParcelaObjectType) => {
    pendingPlaceRef.current = type;
    pendingGLBRef.current = null;
    toast.info('Haz clic en el terreno para colocar el objeto');
  }, []);

  const handleAddGLBAsset = useCallback((asset: GLBAsset) => {
    pendingGLBRef.current = asset;
    pendingPlaceRef.current = null;
    toast.info(`Haz clic en el terreno para colocar "${asset.name}"`);
  }, []);

  const handleGroundClick = useCallback((point: THREE.Vector3) => {
    if (ps.measureMode) {
      ps.addMeasurePoint([point.x, point.y, point.z]);
      return;
    }
    const y = snapToTerrain(point.x, point.z);
    if (pendingGLBRef.current) {
      const asset = pendingGLBRef.current;
      ps.addObject('glb_custom' as ParcelaObjectType, [point.x, y, point.z], {
        modelUrl: asset.url,
        modelName: asset.name,
      });
      pendingGLBRef.current = null;
    } else if (pendingPlaceRef.current) {
      ps.addObject(pendingPlaceRef.current, [point.x, y, point.z]);
      pendingPlaceRef.current = null;
    } else {
      ps.selectObject(null);
    }
  }, [ps, snapToTerrain]);

  const handleSave = useCallback(() => {
    const json = ps.toJSON();
    onSave?.(json);
    toast.success('Diseño guardado');
  }, [ps, onSave]);

  const handleCapture = useCallback(() => { captureRef.current?.(); }, []);

  const handleRemoveSelected = useCallback(() => {
    if (ps.selectedId) ps.removeObject(ps.selectedId);
  }, [ps]);

  const handleCenterInLot = useCallback((id: string) => {
    ps.updateObject(id, { position: [0, snapToTerrain(0, 0), 0] });
  }, [ps, snapToTerrain]);

  const selectedObj = ps.objects.find(o => o.id === ps.selectedId);

  return (
    <div className="flex h-[600px] sm:h-[700px] rounded-xl overflow-hidden border border-border/40 bg-card">
      {/* Left toolbar */}
      <div className="flex flex-col w-60 h-full overflow-hidden">
        <ParcelaToolbar
          onAddObject={handleAddObject}
          onRotate={ps.rotateSelected}
          onScale={ps.scaleSelected}
          onRemoveSelected={handleRemoveSelected}
          onCapture={handleCapture}
          onSave={handleSave}
          onReset={ps.resetAll}
          selectedId={ps.selectedId}
          lotInfo={{ lotNumber, area: lotArea, price: lotPrice }}
          onUndo={ps.undo}
          onRedo={ps.redo}
          canUndo={ps.canUndo}
          canRedo={ps.canRedo}
          snapEnabled={ps.snapEnabled}
          onToggleSnap={() => ps.setSnapEnabled(!ps.snapEnabled)}
          viewMode={ps.viewMode}
          onSetViewMode={ps.setViewMode}
          transformMode={ps.transformMode}
          onSetTransformMode={ps.setTransformMode}
          solarHour={ps.solarHour}
          onSetSolarHour={ps.setSolarHour}
          measureMode={ps.measureMode}
          onToggleMeasure={() => {
            ps.setMeasureMode(!ps.measureMode);
            ps.clearMeasure();
          }}
        />
        {/* GLB Asset Catalog at bottom of sidebar */}
        <Separator />
        <div className="p-2 flex-shrink-0">
          <AssetCatalog
            onSelectAsset={handleAddGLBAsset}
            uploadedAssets={glbAssets}
            onAssetsChange={setGlbAssets}
          />
        </div>
      </div>

      <div className="flex-1 relative">
        <Canvas
          shadows
          camera={{ position: [25, 20, 25], fov: 50 }}
          gl={{ preserveDrawingBuffer: true }}
        >
          <Suspense fallback={null}>
            <SceneCapture captureRef={captureRef} />
            <CameraController viewMode={ps.viewMode} controlsRef={controlsRef} />

            <SolarLight hour={ps.solarHour} latitude={latitude} longitude={longitude} />

            <Sky
              sunPosition={[
                50 * Math.cos((ps.solarHour - 12) * Math.PI / 12),
                50 * Math.sin(Math.max(0, (ps.solarHour - 6) * Math.PI / 15)),
                20,
              ]}
            />

            {useRealisticTerrain ? (
              <RealisticTerrain
                ref={terrainRef}
                polygon={polygon}
                latitude={latitude}
                longitude={longitude}
                onElevationLoaded={setBaseElevation}
              />
            ) : (
              <FlatTerrain polygon={polygon} />
            )}

            <Grid
              infiniteGrid
              cellSize={ps.snapEnabled ? 0.5 : 1}
              sectionSize={5}
              fadeDistance={60}
              cellColor="#A5D6A7"
              sectionColor="#66BB6A"
              cellThickness={0.5}
              sectionThickness={1}
              position={[0, -0.01, 0]}
            />

            <ClickPlane onClick={handleGroundClick} />

            {/* Render objects - GLB customs use GLTFAssetObject, others use ParcelaObject3D */}
            {ps.objects.map(obj => (
              obj.type === 'glb_custom' && obj.modelUrl ? (
                <GLTFAssetObject
                  key={obj.id}
                  obj={obj}
                  isSelected={obj.id === ps.selectedId}
                  onClick={() => ps.selectObject(obj.id)}
                />
              ) : (
                <ParcelaObject3D
                  key={obj.id}
                  obj={obj}
                  isSelected={obj.id === ps.selectedId}
                  onClick={() => ps.selectObject(obj.id)}
                />
              )
            ))}

            {ps.measureMode && ps.measurePoints.length > 0 && (
              <MeasurementLine points={ps.measurePoints} />
            )}

            {ps.viewMode !== 'pedestrian' && (
              <OrbitControls
                ref={controlsRef}
                maxPolarAngle={ps.viewMode === 'top' ? 0.01 : Math.PI / 2.2}
                minDistance={5}
                maxDistance={ps.viewMode === 'top' ? 120 : 80}
                enableDamping
                dampingFactor={0.1}
                enableRotate={ps.viewMode !== 'top'}
              />
            )}

            <PedestrianCamera active={ps.viewMode === 'pedestrian'} />
          </Suspense>
        </Canvas>

        {/* Properties panel for selected object */}
        {selectedObj && (
          <ObjectPropertiesPanel
            obj={selectedObj}
            onUpdate={ps.updateObject}
            onRemove={ps.removeObject}
            onCenterInLot={handleCenterInLot}
          />
        )}

        {/* Terrain toggle */}
        <button
          onClick={() => setUseRealisticTerrain(!useRealisticTerrain)}
          className={`absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all backdrop-blur-sm ${
            useRealisticTerrain
              ? 'bg-primary/20 text-primary border-primary/30'
              : 'bg-background/60 text-muted-foreground border-border/30 hover:bg-background/80'
          }`}
        >
          ⛰ {useRealisticTerrain ? 'Relieve Real' : 'Terreno Plano'}
        </button>

        {/* Elevation badge */}
        {useRealisticTerrain && baseElevation > 0 && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 bg-background/70 backdrop-blur-sm rounded px-2 py-0.5 text-[9px] text-muted-foreground border border-border/30">
            📍 Elevación base: {Math.round(baseElevation)}m
          </div>
        )}

        {/* Info overlays */}
        <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-muted-foreground border border-border/40">
          {ps.viewMode === 'pedestrian'
            ? 'Click para activar · WASD moverse · Mouse mirar · ESC salir'
            : ps.measureMode
              ? 'Click en 2 puntos para medir distancia'
              : 'Q=Mover W=Rotar E=Escalar · Click terreno para colocar'}
        </div>
        <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-foreground border border-border/40">
          {ps.objects.length} objetos
        </div>
        {ps.measureMode && ps.measurePoints.length === 2 && (
          <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-bold text-primary-foreground border border-primary/40 z-20">
            📏 {Math.sqrt(
              Math.pow(ps.measurePoints[1][0] - ps.measurePoints[0][0], 2) +
              Math.pow(ps.measurePoints[1][2] - ps.measurePoints[0][2], 2)
            ).toFixed(1)}m
          </div>
        )}
        {ps.snapEnabled && (
          <div className="absolute bottom-3 right-3 bg-background/60 backdrop-blur-sm rounded px-2 py-0.5 text-[9px] text-muted-foreground border border-border/30">
            ⊞ Snap 50cm
          </div>
        )}
      </div>
    </div>
  );
};
