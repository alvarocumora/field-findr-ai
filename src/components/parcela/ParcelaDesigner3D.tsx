import { useRef, useMemo, useCallback, useEffect, useState, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { ParcelaObject3D } from './ParcelaObjects';
import { GLTFAssetObject } from './GLTFAssetLoader';
import { ParcelaToolbar } from './ParcelaToolbar';
import { AssetCatalog, type GLBAsset } from './AssetCatalog';
import { ObjectPropertiesPanel } from './ObjectPropertiesPanel';
import { SolarLight } from './SolarLight';
import { MeasurementLine } from './MeasurementLine';
import { PedestrianCamera } from './PedestrianCamera';
import { RealisticTerrain, type TerrainHandle, type TerrainDebugInfo } from './RealisticTerrain';
import { useParcelaState, type ParcelaObjectType } from './useParcelaState';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { normalizePolygon } from '@/lib/polygonUtils';
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

function createTerrainShape(coords: [number, number][]): THREE.Shape {
  const shape = new THREE.Shape();
  if (coords.length === 0) {
    shape.moveTo(-10, -15); shape.lineTo(10, -15); shape.lineTo(10, 15); shape.lineTo(-10, 15);
    shape.closePath(); return shape;
  }
  shape.moveTo(coords[0][0], coords[0][1]);
  for (let i = 1; i < coords.length; i++) shape.lineTo(coords[i][0], coords[i][1]);
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

const ClickPlane = ({ onClick, size }: { onClick: (point: THREE.Vector3) => void; size: number }) => (
  <mesh
    rotation={[-Math.PI / 2, 0, 0]}
    position={[0, 0, 0]}
    visible={false}
    onClick={(e) => { e.stopPropagation(); onClick(e.point); }}
  >
    <planeGeometry args={[size * 2, size * 2]} />
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

const CameraController = ({
  viewMode,
  controlsRef,
  terrainSize,
}: {
  viewMode: string;
  controlsRef: React.MutableRefObject<any>;
  terrainSize: number;
}) => {
  const { camera } = useThree();
  useEffect(() => {
    const topHeight = Math.max(terrainSize * 0.95, 70);
    const orbitDistance = Math.max(terrainSize * 0.7, 55);
    const orbitHeight = Math.max(terrainSize * 0.42, 28);

    if (viewMode === 'top') {
      camera.position.set(0, topHeight, 0.01);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) { controlsRef.current.target.set(0, 0, 0); controlsRef.current.update(); }
    } else if (viewMode === 'orbit') {
      camera.position.set(orbitDistance, orbitHeight, orbitDistance);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) { controlsRef.current.target.set(0, 0, 0); controlsRef.current.update(); }
    }
  }, [viewMode, camera, controlsRef, terrainSize]);
  return null;
};

export const ParcelaDesigner3D = ({
  polygon, lotNumber, lotArea, lotPrice, latitude, longitude, savedDesign, onSave,
}: ParcelaDesigner3DProps) => {
  const ps = useParcelaState();
  const { token: mapboxToken } = useMapboxToken();
  const captureRef = useRef<(() => void) | null>(null);
  const pendingPlaceRef = useRef<ParcelaObjectType | null>(null);
  const pendingGLBRef = useRef<GLBAsset | null>(null);
  const controlsRef = useRef<any>(null);
  const terrainRef = useRef<TerrainHandle>(null);

  // Determine if polygon has valid geo data
  const hasGeoData = useMemo(() => {
    if (polygon && polygon.length >= 3) return true;
    if (latitude && longitude) return true;
    return false;
  }, [polygon, latitude, longitude]);

  const [useRealisticTerrain, setUseRealisticTerrain] = useState(hasGeoData);
  const [baseElevation, setBaseElevation] = useState(0);
  const [glbAssets, setGlbAssets] = useState<GLBAsset[]>([]);
  const [satelliteLoading, setSatelliteLoading] = useState(false);
  const [satelliteError, setSatelliteError] = useState(false);
  const [debugInfo, setDebugInfo] = useState<TerrainDebugInfo | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const terrainCoords = useMemo(() => polygonToLocalCoords(polygon || []), [polygon]);
  const terrainSize = useMemo(() => computeTerrainSize(terrainCoords), [terrainCoords]);

  // Load saved design on mount (useEffect instead of useMemo)
  useEffect(() => {
    if (savedDesign) ps.loadFromJSON(savedDesign);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); ps.undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); ps.redo(); }
      if (e.key === 'Delete' && ps.selectedId) ps.removeObject(ps.selectedId);
      if (e.key === 'Escape') ps.selectObject(null);
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
        {/* GLB Asset Catalog */}
        <Separator />
        <div className="p-2 flex-shrink-0 overflow-auto">
          <AssetCatalog
            onSelectAsset={handleAddGLBAsset}
            uploadedAssets={glbAssets}
            onAssetsChange={setGlbAssets}
            onAddPrimitive={handleAddObject}
          />
        </div>
      </div>

      <div className="flex-1 relative" style={{ minHeight: '100%' }}>
        <Canvas
          shadows
          camera={{ position: [25, 20, 25], fov: 50 }}
          gl={{ preserveDrawingBuffer: true }}
          style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #B0D4E8 60%, #D4E4D0 100%)' }}
        >
          <Suspense fallback={null}>
            <SceneCapture captureRef={captureRef} />
            <CameraController viewMode={ps.viewMode} controlsRef={controlsRef} terrainSize={terrainSize} />

            <SolarLight hour={ps.solarHour} latitude={latitude} longitude={longitude} />

            <Sky
              sunPosition={[
                50 * Math.cos((ps.solarHour - 12) * Math.PI / 12),
                50 * Math.sin(Math.max(0, (ps.solarHour - 6) * Math.PI / 15)),
                20,
              ]}
            />

            {/* Ambient light boost for meshBasicMaterial fallback visibility */}
            <ambientLight intensity={0.6} />

            {useRealisticTerrain ? (
              <RealisticTerrain
                ref={terrainRef}
                polygon={polygon}
                latitude={latitude}
                longitude={longitude}
                mapboxToken={mapboxToken || ''}
                onElevationLoaded={setBaseElevation}
                onTextureLoading={setSatelliteLoading}
                onTextureError={setSatelliteError}
                onDebugInfo={setDebugInfo}
              />
            ) : (
              <FlatTerrain polygon={polygon} />
            )}

            {/* Grid ONLY on flat terrain, never on realistic terrain */}
            {!useRealisticTerrain && (
              <gridHelper args={[terrainSize, Math.floor(terrainSize / (ps.snapEnabled ? 0.5 : 1)), '#A5D6A7', '#66BB6A']} position={[0, -0.01, 0]} />
            )}

            <ClickPlane onClick={handleGroundClick} size={terrainSize} />

            {/* Render objects */}
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
                minDistance={Math.max(terrainSize * 0.12, 12)}
                maxDistance={ps.viewMode === 'top' ? Math.max(terrainSize * 2.2, 140) : Math.max(terrainSize * 1.8, 120)}
                enableDamping
                dampingFactor={0.1}
                enableRotate={ps.viewMode !== 'top'}
              />
            )}

            <PedestrianCamera active={ps.viewMode === 'pedestrian'} />
          </Suspense>
        </Canvas>

        {/* Properties panel */}
        {selectedObj && (
          <ObjectPropertiesPanel
            obj={selectedObj}
            onUpdate={ps.updateObject}
            onRemove={ps.removeObject}
            onCenterInLot={handleCenterInLot}
          />
        )}

        {/* Terrain toggle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex gap-1">
          <button
            onClick={() => setUseRealisticTerrain(!useRealisticTerrain)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all backdrop-blur-sm ${
              useRealisticTerrain
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'bg-background/60 text-muted-foreground border-border/30 hover:bg-background/80'
            }`}
          >
            ⛰ {useRealisticTerrain ? 'Relieve Real' : 'Terreno Plano'}
          </button>
          {useRealisticTerrain && (
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-2 py-1.5 rounded-lg text-[10px] font-medium border border-border/30 bg-background/60 text-muted-foreground hover:bg-background/80 backdrop-blur-sm"
              title="Debug info"
            >
              🔍
            </button>
          )}
        </div>

        {/* Satellite loading */}
        {useRealisticTerrain && satelliteLoading && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 bg-primary/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-[10px] text-primary-foreground font-medium animate-pulse border border-primary/40">
            🛰️ Cargando imagen satelital (9 tiles)...
          </div>
        )}

        {/* Satellite error */}
        {useRealisticTerrain && !satelliteLoading && satelliteError && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 bg-destructive/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-[10px] text-destructive-foreground font-medium border border-destructive/40">
            ⚠️ No se pudo cargar imagen satelital — verificar token Mapbox
          </div>
        )}

        {/* Elevation badge */}
        {useRealisticTerrain && !satelliteLoading && !satelliteError && baseElevation > 0 && !showDebug && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 bg-background/70 backdrop-blur-sm rounded px-2 py-0.5 text-[9px] text-muted-foreground border border-border/30">
            📍 Elevación base: {Math.round(baseElevation)}m
          </div>
        )}

        {/* Debug HUD */}
        {showDebug && debugInfo && (
          <div className="absolute top-12 right-3 z-20 bg-background/95 backdrop-blur-sm rounded-lg p-3 text-[10px] font-mono border border-border/40 space-y-1 max-w-[220px]">
            <p className="font-bold text-foreground text-[11px]">🔍 Debug Satelital</p>
            <p>Lat: {debugInfo.lat.toFixed(6)}</p>
            <p>Lng: {debugInfo.lng.toFixed(6)}</p>
            <p>Zoom: {debugInfo.zoom}</p>
            <p>Tile size: {debugInfo.tileMeters}m</p>
            <p>Plane size: {debugInfo.planeSize}m</p>
            <p>Tiles: {debugInfo.tilesLoaded}/{debugInfo.tilesTotal}</p>
            <p>Textura: {debugInfo.textureApplied ? '✅ Aplicada' : '❌ No aplicada'}</p>
            <p>Elevación: {Math.round(baseElevation)}m</p>
            <p>Token: {mapboxToken ? `✅ ${mapboxToken.substring(0, 8)}...` : '❌ Sin token'}</p>
            {debugInfo.canvasDataUrl && (
              <div>
                <p className="mt-1">Preview satelital:</p>
                <img
                  src={debugInfo.canvasDataUrl}
                  alt="Satellite preview"
                  className="w-full rounded border border-border/40 mt-1"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            )}
          </div>
        )}

        {/* No geo data warning */}
        {!hasGeoData && useRealisticTerrain && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 bg-yellow-500/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-[10px] text-yellow-950 font-medium border border-yellow-600/40">
            ⚠️ Sin coordenadas GPS — usando terreno plano
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
        {ps.snapEnabled && !useRealisticTerrain && (
          <div className="absolute bottom-3 right-3 bg-background/60 backdrop-blur-sm rounded px-2 py-0.5 text-[9px] text-muted-foreground border border-border/30">
            ⊞ Snap 50cm
          </div>
        )}
      </div>
    </div>
  );
};
