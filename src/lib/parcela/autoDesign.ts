import { OBJECT_CATALOG, type ParcelaObjectType } from '@/components/parcela/useParcelaState';

/**
 * Automatic parcela layout generator.
 *
 * Given the lot polygon in LOCAL meter coordinates (x = east, y = north —
 * the same `localCoords` produced by `normalizePolygon`), it lays out a
 * coherent residential program (house, driveway, gate, pool, quincho,
 * orchard, trees…) scaled to the lot area, keeping every piece inside the
 * boundary (with a setback) and non-overlapping.
 *
 * The result is deterministic for a given `seed`, so the same lot always
 * regenerates the same design and the UI can offer "regenerate" by bumping
 * the seed. Output positions are in THREE world space: `[x, y, z]` with
 * `z = -localY` (the terrain group is rotated -90° about X).
 */

export interface GeneratedObject {
  type: ParcelaObjectType;
  position: [number, number, number];
  rotation: number;
  scale: number;
}

export type AutoDesignProgram = 'residencial' | 'industrial';

export interface AutoDesignOptions {
  /** Deterministic seed; same seed → same layout. */
  seed?: number;
  /** Which program to lay out. Defaults to residential. */
  program?: AutoDesignProgram;
}

type Ring = [number, number][];

/** Signed-area shoelace, absolute value → polygon area in the ring's units. */
export function polygonArea(ring: Ring): number {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(a) / 2;
}

/** Shortest distance from point (px,py) to segment a→b. */
function pointToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * Shortest distance from a point to the polygon boundary. Unlike a bounding-box
 * inset this is correct for concave / L-shaped lots, so it's the real setback
 * guard that keeps footprints off re-entrant edges.
 */
export function distanceToBoundary(x: number, y: number, ring: Ring): number {
  let m = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const d = pointToSegment(x, y, ring[j][0], ring[j][1], ring[i][0], ring[i][1]);
    if (d < m) m = d;
  }
  return m;
}

/** Ray-casting point-in-polygon test. */
export function pointInPolygon(x: number, y: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Small, fast, seedable PRNG (deterministic across runs). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function bbox(ring: Ring) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}

const radiusOf = (t: ParcelaObjectType) => OBJECT_CATALOG[t]?.boundingRadius ?? 1.5;

/**
 * Scan a coarse grid for the interior point with the greatest clearance that
 * still fits a footprint of radius `r` — i.e. the most open spot in the lot.
 * Robust for irregular shapes where the centroid may be outside the polygon.
 */
function bestOpenSpot(ring: Ring, r: number): { x: number; y: number } | null {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const N = 14;
  let best: { x: number; y: number; d: number } | null = null;
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      const x = minX + ((maxX - minX) * i) / N;
      const y = minY + ((maxY - minY) * j) / N;
      if (!pointInPolygon(x, y, ring)) continue;
      const d = distanceToBoundary(x, y, ring);
      if (d < r * 0.85 + 0.8) continue;
      // prefer the most open spot; break ties toward the back (higher y)
      if (!best || d > best.d + 1e-6 || (Math.abs(d - best.d) < 1e-6 && y > best.y)) {
        best = { x, y, d };
      }
    }
  }
  return best ? { x: best.x, y: best.y } : null;
}

interface Item {
  type: ParcelaObjectType;
  lx: number;
  ly: number;
  rotation: number;
  scale: number;
  r: number;
}

/**
 * Lay out a residential program on the lot. Local coords: x east, y north.
 * The house is pushed toward the back (high y) with its door (model +Z →
 * world +Z → local −y) facing the front yard (low y).
 */
export function generateParcelaDesign(localCoords: Ring, opts: AutoDesignOptions = {}): GeneratedObject[] {
  const ring = localCoords;
  if (!ring || ring.length < 3) return [];

  const rng = mulberry32(((opts.seed ?? 1) * 2654435761) >>> 0);
  const { minX, maxX, minY, maxY } = bbox(ring);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const span = Math.max(spanX, spanY);
  const area = polygonArea(ring);
  const setback = clamp(span * 0.1, 1.5, 5);

  const items: Item[] = [];

  /**
   * Does a footprint of radius `r` centered at (x,y) sit inside the lot with a
   * real clearance from every edge? Using the true distance-to-boundary (not a
   * bbox inset) keeps pieces off re-entrant edges on irregular / L-shaped lots.
   */
  const fits = (x: number, y: number, r: number): boolean => {
    if (!pointInPolygon(x, y, ring)) return false;
    return distanceToBoundary(x, y, ring) >= r * 0.85 + 0.8;
  };

  const tryPlace = (type: ParcelaObjectType, x: number, y: number, rotation = 0, scale = 1): boolean => {
    const r = radiusOf(type) * scale;
    if (!fits(x, y, r)) return false;
    for (const it of items) {
      if (Math.hypot(it.lx - x, it.ly - y) < (it.r + r) * 0.6) return false;
    }
    items.push({ type, lx: x, ly: y, rotation, scale, r });
    return true;
  };

  const toWorld = (): GeneratedObject[] =>
    items.map((it) => ({
      type: it.type,
      position: [it.lx, 0.02, -it.ly] as [number, number, number],
      rotation: it.rotation,
      scale: it.scale,
    }));

  // ── Industrial / packing program ─────────────────────────
  if (opts.program === 'industrial') {
    const galpY = clamp(cy + spanY * 0.1, minY, maxY);
    let g = tryPlace('galpon_packing', cx, galpY) ? items[items.length - 1] : undefined;
    if (!g) g = tryPlace('galpon_packing', cx, cy) ? items[items.length - 1] : undefined;

    if (g) {
      // Cold room + offices flanking the warehouse
      tryPlace('camara_frio', g.lx + g.r + 11, g.ly);
      tryPlace('oficinas_industrial', g.lx - g.r - 9, g.ly - 4);
      tryPlace('bodega', g.lx - g.r - 9, g.ly + 8);
      // Loading dock, truck maneuver + parking in the front apron (toward −y)
      tryPlace('anden_carga', g.lx, g.ly - g.r - 9);
      tryPlace('area_maniobras', g.lx, g.ly - g.r - 24);
      tryPlace('estacionamiento_camiones', g.lx - 16, g.ly - g.r - 22);
      // Weighbridge + gatehouse at the entrance
      tryPlace('bascula', g.lx + 14, minY + setback + 14);
      tryPlace('porteria', g.lx, minY + setback + 3);
      // A small solar field along the east edge
      for (let i = 0; i < 6; i++) {
        tryPlace('panel_solar', g.lx + g.r + 8 + (i % 3) * 4, g.ly + 8 + Math.floor(i / 3) * 4);
      }
    } else {
      // Lot too small for a warehouse — place a compact facility instead
      tryPlace('oficinas_industrial', cx, cy);
      tryPlace('estacionamiento_camiones', cx, cy - 12);
      tryPlace('porteria', cx, minY + setback + 3);
      tryPlace('bodega', cx + 8, cy);
    }

    // Sparse perimeter landscaping
    const trees: ParcelaObjectType[] = ['arbol_pino', 'arbusto'];
    for (let attempt = 0, placed = 0; attempt < 40 && placed < 6; attempt++) {
      const x = minX + setback + rng() * (spanX - 2 * setback);
      const y = minY + setback + rng() * (spanY - 2 * setback);
      if (tryPlace(trees[Math.floor(rng() * trees.length)], x, y, rng() * Math.PI * 2)) placed++;
    }

    return toWorld();
  }

  // ── House ────────────────────────────────────────────────
  let houseType: ParcelaObjectType;
  if (area < 120) houseType = 'tiny_house';
  else if (area < 300) houseType = 'casa_50';
  else if (area < 650) houseType = 'casa_80';
  else if (area < 1500) houseType = rng() < 0.5 ? 'casa_120' : 'casa_moderna';
  else houseType = rng() < 0.5 ? 'casa_moderna' : 'casa_120';

  const houseR = radiusOf(houseType);
  const houseX = cx;
  const houseY = clamp(cy + spanY * 0.16, minY + setback + houseR, maxY - setback - houseR);
  let hasHouse = tryPlace(houseType, houseX, houseY, 0);
  if (!hasHouse) hasHouse = tryPlace(houseType, cx, cy, 0);
  // Irregular / L-shaped lots: fall back to the most open interior spot so a
  // house is still placed even when the centroid lands on a re-entrant corner.
  if (!hasHouse) {
    const spot = bestOpenSpot(ring, houseR);
    if (spot) hasHouse = tryPlace(houseType, spot.x, spot.y, 0);
  }
  if (!hasHouse) {
    const spot = bestOpenSpot(ring, radiusOf('tiny_house'));
    if (spot) hasHouse = tryPlace('tiny_house', spot.x, spot.y, 0);
  }
  const house = items[0];

  // ── Front-yard access (toward −y) ────────────────────────
  if (house) {
    const frontY = house.ly - house.r - 2.5;
    tryPlace('estacionamiento', house.lx - 2.6, frontY, 0);
    tryPlace('sendero', house.lx + 1.6, house.ly - house.r - 1.5, 0);
    tryPlace('camino', house.lx - 2.6, frontY - 4, 0);
    tryPlace('entrada', house.lx - 2.6, minY + setback * 0.6, 0);
  }

  // ── Amenities, area-gated, placed relative to the house ──
  if (house && area > 400) {
    // Pool + deck on the east side yard
    if (!tryPlace('piscina', house.lx + house.r + 3.5, house.ly - 1, 0)) {
      tryPlace('piscina', house.lx - house.r - 3.5, house.ly - 1, 0);
    }
    tryPlace('deck', house.lx + house.r + 3.5, house.ly + 3, 0);
  }
  if (house && area > 350) {
    tryPlace('quincho', maxX - setback - 3, maxY - setback - 3, 0);
    tryPlace('fogata', maxX - setback - 3, maxY - setback - 7, 0);
  }
  if (area > 500) {
    tryPlace('huerto', minX + setback + 2.5, maxY - setback - 2.5, 0);
  }
  if (area > 900) {
    tryPlace('invernadero', minX + setback + 2.5, maxY - setback - 7, 0);
    if (house) tryPlace('pergola', house.lx - house.r - 3, house.ly + 3, 0);
  }

  // ── Trees & shrubs scattered inside the setback ──────────
  const TREES: ParcelaObjectType[] = ['arbol_pino', 'arbol_frutal', 'arbol_palma', 'arbusto', 'arbusto'];
  const treeTarget = clamp(Math.round(area / 180), 3, 16);
  let placedTrees = 0;
  for (let attempt = 0; attempt < treeTarget * 6 && placedTrees < treeTarget; attempt++) {
    const x = minX + setback + rng() * (spanX - 2 * setback);
    const y = minY + setback + rng() * (spanY - 2 * setback);
    const type = TREES[Math.floor(rng() * TREES.length)];
    if (tryPlace(type, x, y, rng() * Math.PI * 2)) placedTrees++;
  }

  // A couple of lawn patches to soften open ground.
  for (let i = 0; i < 3; i++) {
    const x = minX + setback + rng() * (spanX - 2 * setback);
    const y = minY + setback + rng() * (spanY - 2 * setback);
    tryPlace('cesped', x, y, 0);
  }

  return toWorld();
}
