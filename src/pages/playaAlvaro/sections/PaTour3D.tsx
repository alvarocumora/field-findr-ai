import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Html, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Compass, Waves, Mountain, MapPin, Eye } from 'lucide-react';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { PLAYA_ALVARO_PROJECT } from '../data/project';
import { PLAYA_ALVARO_LOTS, type PaLot } from '../data/lots';
import { PLAYA_ALVARO_POIS, type PaPoi } from '../data/pois';

/* ───────── Constants & geo helpers ───────── */
const TERRAIN_RES = 192;       // plane segments
const ELEV_ZOOM = 13;          // mapbox terrain-rgb zoom (3-tile grid)
const SAT_ZOOM = 14;           // satellite zoom (3-tile grid)
const TILE_PX = 512;
const GRID = 3;
const HEIGHT_EXAG = 1.6;
const SCALE = 0.01;            // meters → world units (1 unit = 100m)

const { bounds, center } = PLAYA_ALVARO_PROJECT;
const SPAN_LNG = bounds.maxLng - bounds.minLng;
const SPAN_LAT = bounds.maxLat - bounds.minLat;
// Real-world width/height in meters
function metersPerDegLat() { return 111320; }
function metersPerDegLng(lat: number) { return 111320 * Math.cos((lat * Math.PI) / 180); }
const SCENE_W_M = SPAN_LNG * metersPerDegLng(center.lat);
const SCENE_H_M = SPAN_LAT * metersPerDegLat();
const PLANE_W = SCENE_W_M * SCALE;
const PLANE_H = SCENE_H_M * SCALE;

// Project lng/lat to local plane coords (centered on bounds center)
function projectXY(lng: number, lat: number): [number, number] {
  const x = ((lng - center.lng) * metersPerDegLng(center.lat)) * SCALE;
  const z = -((lat - center.lat) * metersPerDegLat()) * SCALE;
  return [x, z];
}

function lngLatToTile(lng: number, lat: number, zoom: number) {
  const n = Math.pow(2, zoom);
  return {
    x: Math.floor(((lng + 180) / 360) * n),
    y: Math.floor(
      ((1 -
        Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) /
          Math.PI) /
        2) *
        n,
    ),
  };
}

function decodeRGB(r: number, g: number, b: number) {
  return -10000 + (r * 65536 + g * 256 + b) * 0.1;
}

/* ───────── Terrain loader ───────── */
async function loadTerrainData(token: string) {
  const { x: tx, y: ty } = lngLatToTile(center.lng, center.lat, ELEV_ZOOM);
  const stitch = document.createElement('canvas');
  const px = 256 * GRID;
  stitch.width = px;
  stitch.height = px;
  const ctx = stitch.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, px, px);

  const promises: Promise<void>[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const url = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${ELEV_ZOOM}/${tx + dx}/${ty + dy}.pngraw?access_token=${token}`;
      promises.push(
        new Promise((res) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => { ctx.drawImage(img, (dx + 1) * 256, (dy + 1) * 256, 256, 256); res(); };
          img.onerror = () => res();
          img.src = url;
        }),
      );
    }
  }
  await Promise.all(promises);

  // Sample heights
  const img = ctx.getImageData(0, 0, px, px).data;
  const heights = new Float32Array(TERRAIN_RES * TERRAIN_RES);
  let minH = Infinity;
  let maxH = -Infinity;
  for (let i = 0; i < TERRAIN_RES; i++) {
    for (let j = 0; j < TERRAIN_RES; j++) {
      const sx = Math.floor((j / (TERRAIN_RES - 1)) * (px - 1));
      const sy = Math.floor((i / (TERRAIN_RES - 1)) * (px - 1));
      const idx = (sy * px + sx) * 4;
      const h = decodeRGB(img[idx], img[idx + 1], img[idx + 2]);
      heights[i * TERRAIN_RES + j] = h;
      if (h < minH) minH = h;
      if (h > maxH) maxH = h;
    }
  }
  // Normalize to start at 0
  for (let i = 0; i < heights.length; i++) heights[i] = (heights[i] - minH) * SCALE * HEIGHT_EXAG;
  return { heights, minH, maxH };
}

async function loadSatTexture(token: string): Promise<THREE.CanvasTexture | null> {
  const { x: tx, y: ty } = lngLatToTile(center.lng, center.lat, SAT_ZOOM);
  const c = document.createElement('canvas');
  const px = TILE_PX * GRID;
  c.width = px;
  c.height = px;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#5cc4d6';
  ctx.fillRect(0, 0, px, px);
  const promises: Promise<void>[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const url = `https://api.mapbox.com/v4/mapbox.satellite/${SAT_ZOOM}/${tx + dx}/${ty + dy}@2x.png?access_token=${token}`;
      promises.push(
        new Promise((res) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => { ctx.drawImage(img, (dx + 1) * TILE_PX, (dy + 1) * TILE_PX, TILE_PX, TILE_PX); res(); };
          img.onerror = () => res();
          img.src = url;
        }),
      );
    }
  }
  await Promise.all(promises);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/* ───────── Scene parts ───────── */
function Terrain({ heights, texture }: { heights: Float32Array; texture: THREE.Texture | null }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(PLANE_W, PLANE_H, TERRAIN_RES - 1, TERRAIN_RES - 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, heights[i]);
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, [heights]);

  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      {texture ? (
        <meshStandardMaterial map={texture} roughness={0.95} metalness={0.05} />
      ) : (
        <meshStandardMaterial color="#3a7d5e" roughness={0.95} />
      )}
    </mesh>
  );
}

function sampleHeight(heights: Float32Array, x: number, z: number): number {
  const u = (x + PLANE_W / 2) / PLANE_W;
  const v = (-z + PLANE_H / 2) / PLANE_H;
  const gx = Math.max(0, Math.min(TERRAIN_RES - 1, Math.round(u * (TERRAIN_RES - 1))));
  const gy = Math.max(0, Math.min(TERRAIN_RES - 1, Math.round(v * (TERRAIN_RES - 1))));
  return heights[gy * TERRAIN_RES + gx] || 0;
}

const STATUS_COLORS: Record<PaLot['status'], string> = {
  available: '#10b981',
  reserved: '#f59e0b',
  sold: '#64748b',
};

function LotMarkers({
  heights,
  onSelect,
  selectedId,
}: {
  heights: Float32Array;
  onSelect: (lot: PaLot) => void;
  selectedId: string | null;
}) {
  return (
    <group>
      {PLAYA_ALVARO_LOTS.map((lot) => {
        const [x, z] = projectXY(lot.centroid[0], lot.centroid[1]);
        const y = sampleHeight(heights, x, z);
        const r = lot.radius_m * SCALE * 0.9;
        const h = Math.max(0.05, Math.log10(lot.area_ha + 1) * 0.18);
        const isSel = selectedId === lot.id;
        return (
          <group key={lot.id} position={[x, y, z]}>
            <mesh
              position={[0, h / 2, 0]}
              onClick={(e) => { e.stopPropagation(); onSelect(lot); }}
              onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { document.body.style.cursor = 'auto'; }}
              castShadow
            >
              <cylinderGeometry args={[r, r, h, 24]} />
              <meshStandardMaterial
                color={STATUS_COLORS[lot.status]}
                transparent
                opacity={isSel ? 0.95 : 0.7}
                emissive={STATUS_COLORS[lot.status]}
                emissiveIntensity={isSel ? 0.4 : 0.12}
              />
            </mesh>
            {isSel && (
              <Html position={[0, h + 0.15, 0]} center distanceFactor={6}>
                <div className="pointer-events-none rounded-md bg-black/85 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-white whitespace-nowrap">
                  LOTE {lot.lot_number} · {lot.area_ha} ha
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

function PoiMarkers({ heights }: { heights: Float32Array }) {
  return (
    <group>
      {PLAYA_ALVARO_POIS.map((poi: PaPoi, i) => {
        const [x, z] = projectXY(poi.lng, poi.lat);
        const y = sampleHeight(heights, x, z);
        return (
          <group key={i} position={[x, y, z]}>
            <mesh position={[0, 0.35, 0]}>
              <coneGeometry args={[0.08, 0.3, 8]} />
              <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
            </mesh>
            <Html position={[0, 0.65, 0]} center distanceFactor={8}>
              <div className="pointer-events-none rounded bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide text-black whitespace-nowrap">
                {poi.name}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* Simple ocean plane (west side) */
function Ocean() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-PLANE_W * 0.6, -0.05, 0]}>
      <planeGeometry args={[PLANE_W * 1.2, PLANE_H * 2]} />
      <meshStandardMaterial color="#0e3a5f" transparent opacity={0.85} roughness={0.3} metalness={0.6} />
    </mesh>
  );
}

/* Camera orbit / flyTo */
function CameraRig({ target }: { target: THREE.Vector3 | null }) {
  const controlsRef = useRef<any>(null);
  useFrame(() => {
    if (target && controlsRef.current) {
      const ctl = controlsRef.current;
      ctl.target.lerp(target, 0.08);
      ctl.update();
    }
  });
  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={1.5}
      maxDistance={Math.max(PLANE_W, PLANE_H) * 1.5}
      maxPolarAngle={Math.PI / 2.1}
    />
  );
}

/* ───────── Main component ───────── */
export default function PaTour3D() {
  const { token, loading: tokenLoading } = useMapboxToken();
  const [heights, setHeights] = useState<Float32Array | null>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PaLot | null>(null);
  const [orbitTarget, setOrbitTarget] = useState<THREE.Vector3 | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'beach' | 'lotes'>('overview');

  useEffect(() => {
    if (!token || tokenLoading) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const [t, tex] = await Promise.all([loadTerrainData(token), loadSatTexture(token)]);
        if (!alive) return;
        setHeights(t.heights);
        setTexture(tex);
        setLoading(false);
      } catch (e) {
        if (!alive) return;
        console.error('PaTour3D load error', e);
        setError('No se pudo cargar el terreno.');
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [token, tokenLoading]);

  const focusOn = (lng: number, lat: number) => {
    const [x, z] = projectXY(lng, lat);
    const y = heights ? sampleHeight(heights, x, z) : 0;
    setOrbitTarget(new THREE.Vector3(x, y, z));
  };

  const presetViews = [
    {
      id: 'overview' as const,
      label: 'Panorámica',
      icon: Compass,
      action: () => { setActiveView('overview'); setOrbitTarget(new THREE.Vector3(0, 0, 0)); },
    },
    {
      id: 'beach' as const,
      label: 'Frente costero',
      icon: Waves,
      action: () => {
        setActiveView('beach');
        focusOn(bounds.minLng + 0.002, (bounds.minLat + bounds.maxLat) / 2);
      },
    },
    {
      id: 'lotes' as const,
      label: 'Núcleo de lotes',
      icon: Mountain,
      action: () => {
        setActiveView('lotes');
        const lot = PLAYA_ALVARO_LOTS[0];
        if (lot) focusOn(lot.centroid[0], lot.centroid[1]);
      },
    },
  ];

  return (
    <section id="tour-3d" className="relative w-full bg-[var(--hue-forest)] py-20 sm:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--hue-amber)] mb-3 font-mono">
            03 · Tour Virtual 3D
          </p>
          <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight mb-4">
            Recorre el terreno antes de visitarlo
          </h2>
          <p className="text-sm sm:text-base text-white/60 max-w-2xl mx-auto leading-relaxed">
            Renderizado 3D procedural sobre el relieve real de Mapbox. Explora 87 lotes,
            costa, miradores y caminos internos en tiempo real.
          </p>
        </motion.div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8">
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
          {/* Loading / error */}
          <AnimatePresence>
            {(loading || tokenLoading) && (
              <motion.div
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[var(--hue-forest)] text-white/70 gap-3"
              >
                <Loader2 className="w-6 h-6 animate-spin text-[var(--hue-amber)]" />
                <p className="text-xs font-mono uppercase tracking-widest">
                  Cargando terreno + satélite…
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="absolute inset-0 z-30 flex items-center justify-center text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Canvas */}
          {heights && (
            <Canvas
              shadows
              camera={{ position: [PLANE_W * 0.6, PLANE_H * 0.7, PLANE_H * 0.9], fov: 45, near: 0.1, far: 200 }}
              gl={{ antialias: true, powerPreference: 'high-performance' }}
            >
              <color attach="background" args={['#0a2540']} />
              <fog attach="fog" args={['#0a2540', PLANE_W * 1.2, PLANE_W * 3]} />

              <ambientLight intensity={0.55} />
              <directionalLight
                position={[PLANE_W, PLANE_H * 1.5, PLANE_W * 0.5]}
                intensity={1.4}
                castShadow
                shadow-mapSize={[2048, 2048]}
              />
              <Sky sunPosition={[100, 40, 100]} turbidity={6} rayleigh={2} />

              <Suspense fallback={null}>
                <Terrain heights={heights} texture={texture} />
                <Ocean />
                <LotMarkers
                  heights={heights}
                  onSelect={(l) => {
                    setSelected(l);
                    focusOn(l.centroid[0], l.centroid[1]);
                  }}
                  selectedId={selected?.id ?? null}
                />
                <PoiMarkers heights={heights} />
              </Suspense>

              <CameraRig target={orbitTarget} />
            </Canvas>
          )}

          {/* Preset views overlay */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            {presetViews.map((v) => (
              <button
                key={v.id}
                onClick={v.action}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md text-xs font-mono uppercase tracking-wider transition-all border ${
                  activeView === v.id
                    ? 'bg-[var(--hue-amber)]/90 text-black border-[var(--hue-amber)]'
                    : 'bg-black/50 text-white/80 border-white/10 hover:bg-black/70'
                }`}
              >
                <v.icon className="w-3.5 h-3.5" />
                {v.label}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-3 bg-black/60 backdrop-blur-md rounded-lg px-3 py-2 border border-white/10">
            {(['available', 'reserved', 'sold'] as const).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[s] }} />
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/80">
                  {s === 'available' ? 'Disponible' : s === 'reserved' ? 'Reservado' : 'Vendido'}
                </span>
              </div>
            ))}
          </div>

          {/* Hint */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/10">
            <Eye className="w-3.5 h-3.5 text-white/60" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">
              Click + arrastrar · Scroll para zoom
            </span>
          </div>

          {/* Selected lot panel */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="absolute bottom-4 right-4 z-20 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 p-4 w-64"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--hue-amber)]">
                    Lote seleccionado
                  </span>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-white/40 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
                <h4 className="text-white text-lg font-light mb-1">LOTE {selected.lot_number}</h4>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-wider">Superficie</p>
                    <p className="text-white font-mono">{selected.area_ha} ha</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-wider">Precio</p>
                    <p className="text-white font-mono">{selected.price_uf.toLocaleString()} UF</p>
                  </div>
                </div>
                <a
                  href="#contacto"
                  className="mt-4 block text-center bg-[var(--hue-amber)] text-black text-xs font-mono uppercase tracking-wider py-2 rounded hover:bg-[var(--hue-amber)]/80 transition"
                >
                  Reservar
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          {[
            { k: 'Lotes navegables', v: '87' },
            { k: 'Superficie total', v: '400 ha' },
            { k: 'Resolución DEM', v: `${TERRAIN_RES}²` },
            { k: 'POIs', v: String(PLAYA_ALVARO_POIS.length) },
          ].map((s) => (
            <div key={s.k} className="border-l border-[var(--hue-amber)]/40 pl-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">
                {s.k}
              </p>
              <p className="text-white text-xl font-light">{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
