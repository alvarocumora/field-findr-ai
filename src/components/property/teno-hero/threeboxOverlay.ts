/**
 * Threebox overlay for the cinematic hero.
 *
 * Replaces the flat Mapbox `fill-extrusion` cubes with real Three.js meshes
 * (triangular gable prisms, square hip pyramids, cone-canopy trees, beveled
 * walls) lit with PBR materials + sun + sky ambient. The geometry is derived
 * from the existing `LayoutBuilding[]` data so no schema changes are needed.
 *
 * Future drop-in: swap the procedural meshes for GLTF assets (Quaternius
 * Ultimate Buildings / Nature) by populating `MODEL_REGISTRY` with URLs of
 * GLB files in `/public/models/quaternius/`.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { LayoutBuilding } from './layouts';

// ─── Asset registry (drop GLBs here) ───────────────────────────────
// Default paths assume GLB files placed at /public/models/quaternius/.
// Pull from https://quaternius.com/packs/ultimatebuildings.html (CC0)
// and  https://quaternius.com/packs/ultimatenature.html (CC0).
// Set a key to `undefined` (or delete it) to force the procedural fallback
// for that asset class.
//
// Convention for casa_a/casa_b: A and B are visual variants picked
// alternately to break the row-of-clones look. Same for tree_pine/oak.
export const MODEL_REGISTRY: Record<string, string | undefined> = {
  casa_a: '/models/quaternius/house_a.glb',
  casa_b: '/models/quaternius/house_b.glb',
  galpon: '/models/quaternius/warehouse.glb',
  tree_pine: '/models/quaternius/tree_pine.glb',
  tree_oak: '/models/quaternius/tree_oak.glb',
  street_lamp: '/models/quaternius/street_lamp.glb',
};

/** Override the registry at runtime (e.g. host assets on a CDN). */
export function setModelRegistry(partial: Partial<typeof MODEL_REGISTRY>) {
  Object.assign(MODEL_REGISTRY, partial);
}

// ─── GLTF loader + cache ────────────────────────────────────────────
// Each URL is fetched once. Failed URLs are remembered so we don't retry
// every render — the procedural fallback takes over silently.
const gltfCache = new Map<string, Promise<THREE.Group | null>>();
const gltfLoader = new GLTFLoader();

function loadGLTF(url: string): Promise<THREE.Group | null> {
  let p = gltfCache.get(url);
  if (p) return p;
  p = new Promise<THREE.Group | null>((resolve) => {
    gltfLoader.load(
      url,
      (gltf) => {
        // Quaternius GLBs are Y-up; Threebox/Mapbox needs Z-up.
        // We bake the rotation into a wrapping group so per-instance clones
        // can apply their own Z rotation cleanly.
        const wrap = new THREE.Group();
        wrap.rotation.x = Math.PI / 2;
        wrap.add(gltf.scene);
        resolve(wrap);
      },
      undefined,
      (err) => {
        // Network 404 / asset missing → silent fallback to procedural
        if (typeof console !== 'undefined') {
          console.info('[threebox] GLTF not available, using procedural:', url, (err as Error)?.message ?? '');
        }
        resolve(null);
      },
    );
  });
  gltfCache.set(url, p);
  return p;
}

/**
 * Clone a preloaded GLTF group, normalize its bounding box so it sits with
 * its bottom at z=0 and centered on (x=0, y=0), then scale uniformly to fit
 * a target footprint of `targetW × targetH` (meters). Aspect is preserved
 * by using the larger of the two scale factors so the model never looks
 * squashed — small overflows are acceptable since visual realism wins.
 */
function cloneAndFit(
  template: THREE.Group,
  targetW: number,
  targetH: number,
  rotZ: number,
): THREE.Group {
  const inst = template.clone(true);
  // Materials shared (cheap clones); only geometry topology is shared.
  const wrapper = new THREE.Group();
  wrapper.add(inst);
  // Apply normalized rotation BEFORE measuring bbox
  const bbox = new THREE.Box3().setFromObject(wrapper);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  // After the wrapper.rotation.x baked into loadGLTF, model is Z-up.
  // size.x = width along X, size.y = depth along Y, size.z = height along Z.
  const modelW = Math.max(0.01, size.x);
  const modelD = Math.max(0.01, size.y);
  // Pick the larger of (w/modelW, h/modelD) so the building fills its plot.
  // For house meshes whose long side ≈ targetW, this gives a natural fit.
  const sx = targetW / modelW;
  const sy = targetH / modelD;
  const s = Math.max(sx, sy) * 0.95; // 5% margin to avoid eaves overshoot
  inst.scale.setScalar(s);
  // Re-measure after scale to translate bottom to z=0 + center on XY
  const bbox2 = new THREE.Box3().setFromObject(inst);
  const c2 = new THREE.Vector3();
  bbox2.getCenter(c2);
  inst.position.x -= c2.x;
  inst.position.y -= c2.y;
  inst.position.z -= bbox2.min.z;
  wrapper.rotation.z = rotZ;
  return wrapper;
}

/** Resolve an asset URL by key; returns null if not registered. */
function modelUrl(key: keyof typeof MODEL_REGISTRY): string | null {
  return MODEL_REGISTRY[key] ?? null;
}

// ─── Material cache (re-use across all buildings) ───────────────────
const matCache = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string, roughness = 0.85, metalness = 0): THREE.MeshStandardMaterial {
  const key = `${color}|${roughness}|${metalness}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    matCache.set(key, m);
  }
  return m;
}

// ─── Geometry helpers ───────────────────────────────────────────────

interface RectInfo { cx: number; cy: number; w: number; h: number; rot: number; }

function rectInfoFromCoords(coords: [number, number][]): RectInfo {
  // rect() emits 4 CCW corners. width = |c1-c0|, height = |c2-c1|, rot = atan2((c1-c0).y, (c1-c0).x).
  const [a, b, c] = coords;
  const w = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const h = Math.hypot(c[0] - b[0], c[1] - b[1]);
  const cx = (a[0] + c[0]) / 2;
  const cy = (a[1] + c[1]) / 2;
  const rot = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return { cx, cy, w, h, rot };
}

/** Build a triangular gable roof prism (real geometry, 2 visible slopes). */
function makeGableRoof(
  w: number,
  h: number,
  ridgeHeight: number,
  color: string,
  eaveOverhang = 0.5,
): THREE.Mesh {
  const ridgeAlongX = w >= h;
  const halfX = (ridgeAlongX ? w : w) / 2 + eaveOverhang;
  const halfY = (ridgeAlongX ? h : h) / 2 + eaveOverhang;
  // 6 vertices: 4 base + 2 ridge
  let v: number[];
  let idx: number[];
  if (ridgeAlongX) {
    // ridge runs along X axis
    v = [
      -halfX, -halfY, 0,  //0 front-left-bot
       halfX, -halfY, 0,  //1 front-right-bot
      -halfX,  halfY, 0,  //2 back-left-bot
       halfX,  halfY, 0,  //3 back-right-bot
      -halfX,    0,    ridgeHeight, //4 ridge-left
       halfX,    0,    ridgeHeight, //5 ridge-right
    ];
    idx = [
      0, 1, 5,  0, 5, 4,   // front slope
      3, 2, 4,  3, 4, 5,   // back slope
      0, 4, 2,             // left gable end (triangle)
      1, 3, 5,             // right gable end
    ];
  } else {
    // ridge runs along Y axis
    v = [
      -halfX, -halfY, 0,
       halfX, -halfY, 0,
      -halfX,  halfY, 0,
       halfX,  halfY, 0,
       0,    -halfY,  ridgeHeight,
       0,     halfY,  ridgeHeight,
    ];
    idx = [
      0, 4, 1,  1, 4, 5,   // ... rotated
      2, 3, 5,  2, 5, 4,
      0, 2, 4,
      1, 5, 3,
    ];
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geom.setIndex(idx);
  geom.computeVertexNormals();
  return new THREE.Mesh(geom, mat(color, 0.6));
}

/** Square pyramid (hip roof). */
function makeHipRoof(w: number, h: number, ridgeHeight: number, color: string, eave = 0.5): THREE.Mesh {
  const halfX = w / 2 + eave;
  const halfY = h / 2 + eave;
  const v = [
    -halfX, -halfY, 0,
     halfX, -halfY, 0,
     halfX,  halfY, 0,
    -halfX,  halfY, 0,
     0,      0,     ridgeHeight,
  ];
  const idx = [
    0, 1, 4,
    1, 2, 4,
    2, 3, 4,
    3, 0, 4,
  ];
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geom.setIndex(idx);
  geom.computeVertexNormals();
  return new THREE.Mesh(geom, mat(color, 0.6));
}

/** Walls box (centered at origin, base at z=0). */
function makeWalls(w: number, h: number, height: number, color: string): THREE.Mesh {
  const geom = new THREE.BoxGeometry(w, h, height);
  geom.translate(0, 0, height / 2);
  return new THREE.Mesh(geom, mat(color, 0.92));
}

/** Eave slab (thin overhanging plane). */
function makeEave(w: number, h: number, color = '#1f2937'): THREE.Mesh {
  const geom = new THREE.BoxGeometry(w + 1, h + 1, 0.18);
  geom.translate(0, 0, 0.09);
  return new THREE.Mesh(geom, mat(color, 0.7));
}

/** Cone-canopy tree. */
function makeTree(canopyColor = '#15803d'): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.35, 1.6, 8),
    mat('#5a3a22', 0.95),
  );
  trunk.rotation.x = Math.PI / 2;
  trunk.position.z = 0.8;
  g.add(trunk);
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(1.6, 3.8, 10),
    mat(canopyColor, 0.85),
  );
  canopy.rotation.x = Math.PI / 2;
  canopy.position.z = 1.6 + 1.9;
  g.add(canopy);
  return g;
}

/** Flat patch (grass / asphalt / sidewalk). */
function makeFlat(w: number, h: number, color: string, thickness = 0.12): THREE.Mesh {
  const geom = new THREE.BoxGeometry(w, h, thickness);
  geom.translate(0, 0, thickness / 2);
  return new THREE.Mesh(geom, mat(color, color === '#1e293b' ? 0.95 : 0.8));
}

// ─── Builders per LayoutBuilding type ───────────────────────────────

function buildHouse(b: LayoutBuilding, gltfTemplate?: THREE.Group | null): THREE.Group | null {
  const wall0 = b.parts[0];
  if (wall0 && gltfTemplate) {
    const i0 = rectInfoFromCoords(wall0.coords);
    return cloneAndFit(gltfTemplate, i0.w, i0.h, i0.rot);
  }
  // parts[0] = walls box; subsequent stepped slabs were faux-roof
  const wall = b.parts[0];
  if (!wall) return null;
  const info = rectInfoFromCoords(wall.coords);
  const baseHeight = wall.height;
  const ridgeHeight = Math.max(2.2, (b.parts[b.parts.length - 1]?.height ?? baseHeight + 2.5) - baseHeight);
  // Detect chimney: small square part at the top
  const lastPart = b.parts[b.parts.length - 1];
  const isChimney = lastPart && lastPart.height - lastPart.base > 1 && rectInfoFromCoords(lastPart.coords).w < 1.5;
  // Wall color = first part color; roof color = a stepped-roof part if available
  const wallColor = wall.color;
  const roofPart = b.parts.find((p) => p.base > baseHeight + 0.1 && p !== lastPart) ?? b.parts[2];
  const roofColor = roofPart?.color ?? '#9a3412';

  const g = new THREE.Group();
  g.add(makeWalls(info.w, info.h, baseHeight, wallColor));
  g.add(makeEave(info.w, info.h));
  const roof = makeGableRoof(info.w, info.h, ridgeHeight, roofColor);
  roof.position.z = baseHeight + 0.18;
  g.add(roof);
  if (isChimney) {
    const chim = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.7, 1.4),
      mat('#78716c', 0.95),
    );
    chim.position.set(info.w * 0.25, 0, baseHeight + ridgeHeight * 0.7);
    g.add(chim);
  }
  g.rotation.z = info.rot;
  return g;
}

function buildWarehouse(b: LayoutBuilding): THREE.Group | null {
  const wall = b.parts[0];
  if (!wall) return null;
  const info = rectInfoFromCoords(wall.coords);
  const baseHeight = wall.height;
  const ridgeHeight = Math.max(2.0, (b.parts.find((p) => p.base > baseHeight + 0.2)?.height ?? baseHeight + 2.5) - baseHeight);
  const wallColor = wall.color;
  const roofPart = b.parts.find((p) => p.base > baseHeight + 0.1);
  const roofColor = roofPart?.color ?? '#475569';
  const skylightPart = b.parts.find((p) => p.color === '#bae6fd');

  const g = new THREE.Group();
  // Walls — slightly metallic
  const walls = makeWalls(info.w, info.h, baseHeight, wallColor);
  (walls.material as THREE.MeshStandardMaterial).metalness = 0.25;
  (walls.material as THREE.MeshStandardMaterial).roughness = 0.65;
  g.add(walls);
  g.add(makeEave(info.w, info.h, '#0f172a'));
  const roof = makeGableRoof(info.w, info.h, ridgeHeight, roofColor, 0.8);
  (roof.material as THREE.MeshStandardMaterial).metalness = 0.35;
  (roof.material as THREE.MeshStandardMaterial).roughness = 0.5;
  roof.position.z = baseHeight + 0.35;
  g.add(roof);
  if (skylightPart) {
    const slInfo = rectInfoFromCoords(skylightPart.coords);
    const sky = new THREE.Mesh(
      new THREE.BoxGeometry(slInfo.w, slInfo.h, 0.3),
      new THREE.MeshStandardMaterial({
        color: '#bae6fd',
        roughness: 0.1,
        metalness: 0.05,
        transparent: true,
        opacity: 0.7,
      }),
    );
    sky.position.set(0, 0, baseHeight + ridgeHeight - 0.1);
    g.add(sky);
  }
  g.rotation.z = info.rot;
  return g;
}

/** Generic part-by-part renderer for plaza/calle/jardin/equipamiento etc. */
function buildGenericByParts(b: LayoutBuilding): THREE.Group {
  const g = new THREE.Group();
  // Use the centroid of parts[0] as anchor; offset others relative to it
  const anchor = b.parts[0] ? rectInfoFromCoords(b.parts[0].coords) : { cx: b.cx, cy: b.cy, rot: 0, w: 0, h: 0 };
  const baseRot = anchor.rot;
  const cosR = Math.cos(-baseRot), sinR = Math.sin(-baseRot);

  for (const p of b.parts) {
    const info = rectInfoFromCoords(p.coords);
    const dx = info.cx - anchor.cx;
    const dy = info.cy - anchor.cy;
    const localX = dx * cosR - dy * sinR;
    const localY = dx * sinR + dy * cosR;
    const partRot = info.rot - baseRot;

    const partHeight = p.height - p.base;
    let mesh: THREE.Object3D;

    // Heuristic: tall narrow part (≈square footprint, height > 3) → tree
    const isTreeLike =
      info.w < 4 && info.h < 4 && Math.abs(info.w - info.h) < 1 &&
      partHeight > 2.5 && p.base < 1.5;

    if (isTreeLike) {
      mesh = makeTree(p.color);
      mesh.position.set(localX, localY, p.base);
    } else if (partHeight < 0.6) {
      // Flat patch (grass, road, sidewalk)
      mesh = makeFlat(info.w, info.h, p.color, Math.max(0.08, partHeight));
      mesh.position.set(localX, localY, p.base);
      mesh.rotation.z = partRot;
    } else {
      // Generic box
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(info.w, info.h, partHeight),
        mat(p.color, 0.85),
      );
      box.position.set(localX, localY, p.base + partHeight / 2);
      box.rotation.z = partRot;
      mesh = box;
    }
    g.add(mesh);
  }

  // For 'sede' / 'acceso' (equipamiento) parts include a hipRoofStepped.
  // Detect if last parts form a stepped roof (multiple thin slabs of same shrinking pattern) — otherwise leave as boxes (good fallback).

  g.rotation.z = baseRot;
  return g;
}

// ─── Main entry point ───────────────────────────────────────────────

export interface ThreeboxHandle {
  destroy: () => void;
  fadeIn: (durationMs?: number) => void;
}

/**
 * Mount the Threebox custom layer on a Mapbox map and place all buildings.
 * Returns a handle to fade-in / cleanup.
 */
export async function mountThreeboxOverlay(
  map: mapboxgl.Map,
  buildings: LayoutBuilding[],
  localToLngLat: (x: number, y: number) => [number, number],
): Promise<ThreeboxHandle | null> {
  // Dynamic import — threebox is ~250KB, only loaded when hero is shown
  let Threebox: any;
  try {
    const mod = await import('threebox-plugin');
    Threebox = (mod as any).Threebox ?? (mod as any).default?.Threebox ?? (window as any).Threebox;
  } catch (e) {
    console.warn('[threebox] failed to load', e);
    return null;
  }
  if (!Threebox) return null;

  const tb = new Threebox(map, map.getCanvas().getContext('webgl'), {
    defaultLights: true,
    enableSelectingObjects: false,
    enableTooltips: false,
    enableHelpTooltips: false,
    realSunlight: false,
    sky: false,
  });
  // Make Threebox globally available (Threebox internals require this)
  (window as any).tb = tb;

  const LAYER_ID = 'teno-threebox-layer';
  if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
  map.addLayer({
    id: LAYER_ID,
    type: 'custom',
    renderingMode: '3d',
    onAdd: () => {},
    render: () => tb.update(),
  });

  // Track all added objects so we can clear them on rebuild
  const placed: any[] = [];
  // For fade-in animation
  const meshAnimRefs: THREE.Group[] = [];

  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i];
    let group: THREE.Group | null = null;
    if (b.type === 'casa') group = buildHouse(b);
    else if (b.type === 'galpon') group = buildWarehouse(b);
    else group = buildGenericByParts(b);
    if (!group) continue;

    // Cast shadows where supported
    group.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        (o as THREE.Mesh).castShadow = true;
        (o as THREE.Mesh).receiveShadow = true;
      }
    });

    // Initial scale 0 for fade-in
    group.scale.set(1, 1, 0.001);
    meshAnimRefs.push(group);

    const obj = tb.Object3D({ obj: group, units: 'meters', anchor: 'center' });
    const [lng, lat] = localToLngLat(b.cx, b.cy);
    obj.setCoords([lng, lat, 0]);
    tb.add(obj);
    placed.push(obj);
  }

  let rafId: number | null = null;
  const fadeIn = (durationMs = 1600) => {
    const start = performance.now();
    const stagger = Math.min(80, durationMs / Math.max(1, meshAnimRefs.length));
    const rise = Math.max(400, durationMs * 0.45);
    const tick = (now: number) => {
      const t = now - start;
      let allDone = true;
      meshAnimRefs.forEach((g, i) => {
        const local = (t - i * stagger) / rise;
        const eased = Math.max(0, Math.min(1, local));
        // ease-out cubic
        const v = 1 - Math.pow(1 - eased, 3);
        g.scale.z = Math.max(0.001, v);
        if (eased < 1) allDone = false;
      });
      if (!allDone && !(map as any)._removed) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
  };

  return {
    fadeIn,
    destroy: () => {
      if (rafId) cancelAnimationFrame(rafId);
      try {
        for (const o of placed) tb.remove?.(o);
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
        tb.dispose?.();
      } catch (e) {
        console.warn('[threebox] cleanup error', e);
      }
    },
  };
}
