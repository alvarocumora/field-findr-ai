/**
 * Procedural layouts for cinematic hero overlay.
 * Buildings are clipped to the actual polygon (not its bounding box) and
 * aligned to the polygon's main axis. Each building can emit multiple
 * extrusion "parts" to fake gable roofs / volumetry.
 */
import type { PolygonBounds } from '@/lib/polygonUtils';
import {
  rect,
  house,
  warehouse,
  gableRoofStepped,
  hipRoofStepped,
  eaves,
  type BuildingPart,
} from './buildingPrimitives';

export type LayoutType = 'packing' | 'conjunto';
export type DetailLevel = 'low' | 'med' | 'high';
export type { BuildingPart };

/** Roof step counts per detail tier — directly drives draw call count. */
const ROOF_STEPS: Record<DetailLevel, { house: number; warehouse: number }> = {
  low:  { house: 2, warehouse: 2 },  // mobile / reduced motion
  med:  { house: 3, warehouse: 3 },  // tablet
  high: { house: 5, warehouse: 6 },  // desktop
};

export interface LayoutBuilding {
  id: string;
  type: string;
  label?: string;
  parts: BuildingPart[];
  /** centroid in local meters — used for stagger ordering */
  cx: number;
  cy: number;
}

export interface LayoutResult {
  buildings: LayoutBuilding[];
  legend: { color: string; label: string }[];
}

// ─── Geometry helpers (clipping + axis alignment) ────────────────────

/** Ray-casting point-in-polygon (local coords). */
const pointInPolygon = (
  pt: [number, number],
  poly: [number, number][],
): boolean => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect =
      yi > pt[1] !== yj > pt[1] &&
      pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

const distPointSeg = (
  p: [number, number],
  a: [number, number],
  b: [number, number],
): number => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-9) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
};

const distToBoundary = (p: [number, number], poly: [number, number][]): number => {
  let min = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const d = distPointSeg(p, poly[j], poly[i]);
    if (d < min) min = d;
  }
  return min;
};

/** Check rect corners are inside polygon AND have margin from boundary. */
const rectFitsInside = (
  corners: [number, number][],
  poly: [number, number][],
  margin = 4,
): boolean => {
  for (const c of corners) {
    if (!pointInPolygon(c, poly)) return false;
    if (distToBoundary(c, poly) < margin) return false;
  }
  const cx = corners.reduce((s, p) => s + p[0], 0) / corners.length;
  const cy = corners.reduce((s, p) => s + p[1], 0) / corners.length;
  if (!pointInPolygon([cx, cy], poly)) return false;
  return true;
};

/**
 * For roofs that overhang their walls, also verify the *expanded* footprint
 * (walls + eaves) fits inside the polygon to prevent eaves crossing the limit.
 */
const buildingFitsInside = (
  cx: number,
  cy: number,
  w: number,
  h: number,
  rot: number,
  poly: [number, number][],
  margin = 4,
  overhang = 1.0,
): boolean =>
  rectFitsInside(rect(cx, cy, w + overhang * 2, h + overhang * 2, rot), poly, margin);

/** Compute main-axis angle (rad) from longest edge of polygon. */
const mainAxisAngle = (poly: [number, number][]): number => {
  let bestLen = 0, bestAng = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len > bestLen) {
      bestLen = len;
      bestAng = Math.atan2(dy, dx);
    }
  }
  return bestAng;
};

// ─── Packing layout (industrial fruit/cold storage) ──────────────────

export function buildPackingLayout(
  bounds: PolygonBounds,
  poly: [number, number][],
  detail: DetailLevel = 'high',
): LayoutResult {
  const steps = ROOF_STEPS[detail];
  const buildings: LayoutBuilding[] = [];
  const rot = mainAxisAngle(poly);
  const cosR = Math.cos(rot), sinR = Math.sin(rot);

  // Project polygon onto axis-aligned frame to size the grid
  const proj = poly.map<[number, number]>(([x, y]) => [
    x * cosR + y * sinR,
    -x * sinR + y * cosR,
  ]);
  let pminU = Infinity, pmaxU = -Infinity, pminV = Infinity, pmaxV = -Infinity;
  for (const [u, v] of proj) {
    if (u < pminU) pminU = u; if (u > pmaxU) pmaxU = u;
    if (v < pminV) pminV = v; if (v > pmaxV) pmaxV = v;
  }
  const usableU = pmaxU - pminU;
  const usableV = pmaxV - pminV;

  const toLocal = (u: number, v: number): [number, number] => [
    u * cosR - v * sinR,
    u * sinR + v * cosR,
  ];

  // Galpón long-side dimensions (in axis frame: u = long axis, v = perp)
  const galponLongU = Math.min(usableU * 0.18, 60);
  const galponWideV = Math.min(usableV * 0.13, 22);
  const gapU = galponLongU * 0.35;
  const gapV = galponWideV * 0.7; // street between rows
  const stepU = galponLongU + gapU;
  const stepV = galponWideV + gapV;

  // How many fit
  const nCols = Math.max(1, Math.floor((usableU - galponLongU) / stepU) + 1);
  const nRows = Math.max(1, Math.floor((usableV - galponWideV) / stepV) + 1);

  const gridW_U = (nCols - 1) * stepU + galponLongU;
  const gridH_V = (nRows - 1) * stepV + galponWideV;
  const startU = pminU + (usableU - gridW_U) / 2;
  const startV = pminV + (usableV - gridH_V) / 2;

  let id = 0;
  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      const cu = startU + c * stepU + galponLongU / 2;
      const cv = startV + r * stepV + galponWideV / 2;
      const [cx, cy] = toLocal(cu, cv);

      // Verify both walls AND roof eaves fit (overhang ~0.9m)
      const candidate = rect(cx, cy, galponLongU, galponWideV, rot);
      if (!rectFitsInside(candidate, poly, 5)) continue;
      if (!buildingFitsInside(cx, cy, galponLongU, galponWideV, rot, poly, 3, 0.9)) continue;

      // Alternate skylight on every other galpón for variation
      const withSkylight = ((c + r) % 2) === 0;
      buildings.push({
        id: `galpon-${id++}`,
        type: 'galpon',
        label: `Galpón ${id}`,
        cx, cy,
        parts: warehouse(cx, cy, galponLongU, galponWideV, rot, {
          baseHeight: 7.5,
          ridgeHeight: 3.2,
          withSkylight,
          steps: steps.warehouse,
        }),
      });
    }
  }

  // Andén perimetral: long thin strip along the FIRST row's outer edge
  const andenCu = startU + (gridW_U) / 2;
  const andenCv = startV - galponWideV * 0.55;
  const [andenX, andenY] = toLocal(andenCu, andenCv);
  const andenCandidate = rect(andenX, andenY, gridW_U * 0.95, galponWideV * 0.35, rot);
  if (rectFitsInside(andenCandidate, poly, 4)) {
    buildings.push({
      id: 'anden-1',
      type: 'anden',
      label: 'Andén de carga',
      cx: andenX, cy: andenY,
      parts: [
        { coords: andenCandidate, base: 0, height: 1.2, color: '#0ea5e9' },
        { coords: rect(andenX, andenY, gridW_U * 0.95, galponWideV * 0.18, rot), base: 1.2, height: 4.5, color: '#0284c7' },
      ],
    });
  }

  // Cámaras de frío: 2 grandes en el borde lejano
  for (let i = 0; i < 2; i++) {
    const camCu = startU + gridW_U * (i === 0 ? 0.25 : 0.75);
    const camCv = startV + gridH_V + galponWideV * 0.6;
    const [camX, camY] = toLocal(camCu, camCv);
    const camW = galponLongU * 0.7;
    const camH = galponWideV * 1.1;
    const cand = rect(camX, camY, camW, camH, rot);
    if (rectFitsInside(cand, poly, 5)) {
      buildings.push({
        id: `camara-${i}`,
        type: 'camara',
        label: 'Cámara de frío',
        cx: camX, cy: camY,
        parts: [
          { coords: cand, base: 0, height: 11, color: '#67e8f9' },
          { coords: rect(camX, camY, camW * 0.85, camH * 0.85, rot), base: 11, height: 12.2, color: '#22d3ee' },
        ],
      });
    }
  }

  // Oficinas: bloque pequeño esquina inicial
  const ofiCu = startU - stepU * 0.4;
  const ofiCv = startV + gridH_V / 2;
  const [ofiX, ofiY] = toLocal(ofiCu, ofiCv);
  const ofiCand = rect(ofiX, ofiY, galponLongU * 0.55, galponWideV * 1.2, rot);
  if (rectFitsInside(ofiCand, poly, 5)) {
    buildings.push({
      id: 'oficinas',
      type: 'oficina',
      label: 'Oficinas',
      cx: ofiX, cy: ofiY,
      parts: [
        { coords: ofiCand, base: 0, height: 4, color: '#f1f5f9' },
        { coords: rect(ofiX, ofiY, galponLongU * 0.5, galponWideV * 1.1, rot), base: 4, height: 7.5, color: '#f59e0b' },
      ],
    });
  }

  return {
    buildings,
    legend: [
      { color: '#475569', label: 'Galpones' },
      { color: '#22d3ee', label: 'Cámaras de frío' },
      { color: '#0284c7', label: 'Andén' },
      { color: '#f59e0b', label: 'Oficinas' },
    ],
  };
}

// ─── Conjunto habitacional ───────────────────────────────────────────

export function buildConjuntoLayout(
  bounds: PolygonBounds,
  poly: [number, number][],
  detail: DetailLevel = 'high',
): LayoutResult {
  const steps = ROOF_STEPS[detail];
  const buildings: LayoutBuilding[] = [];
  const rot = mainAxisAngle(poly);
  const cosR = Math.cos(rot), sinR = Math.sin(rot);
  const proj = poly.map<[number, number]>(([x, y]) => [
    x * cosR + y * sinR,
    -x * sinR + y * cosR,
  ]);
  let pminU = Infinity, pmaxU = -Infinity, pminV = Infinity, pmaxV = -Infinity;
  for (const [u, v] of proj) {
    if (u < pminU) pminU = u; if (u > pmaxU) pmaxU = u;
    if (v < pminV) pminV = v; if (v > pmaxV) pmaxV = v;
  }
  const usableU = pmaxU - pminU;
  const usableV = pmaxV - pminV;
  const toLocal = (u: number, v: number): [number, number] => [
    u * cosR - v * sinR,
    u * sinR + v * cosR,
  ];

  // Casa dimensions: ~10m × 8m typical Chilean lot
  const casaU = 11, casaV = 8;
  const gapU = 4; // jardín lateral
  const stepU = casaU + gapU;
  const calleV = 8; // calle central

  // Two rows of houses around a central street
  const rowOffsetV = (calleV / 2) + (casaV / 2) + 2;
  const nCols = Math.max(2, Math.floor(usableU / stepU));
  const startU = pminU + (usableU - (nCols * stepU - gapU)) / 2;
  const centerV = pminV + usableV / 2;

  let id = 0;
  for (const rowSign of [-1, 1] as const) {
    for (let c = 0; c < nCols; c++) {
      const cu = startU + c * stepU + casaU / 2;
      const cv = centerV + rowSign * rowOffsetV;
      const [cx, cy] = toLocal(cu, cv);
      const cand = rect(cx, cy, casaU, casaV, rot);
      if (!rectFitsInside(cand, poly, 4)) continue;
      if (!buildingFitsInside(cx, cy, casaU, casaV, rot, poly, 2, 0.5)) continue;
      const wallColors = ['#fef3c7', '#fde68a', '#fed7aa', '#fee2e2', '#e0f2fe'];
      const roofColors = ['#b91c1c', '#9a3412', '#7c2d12', '#a16207'];
      const wall = wallColors[(id + (rowSign === -1 ? 0 : 2)) % wallColors.length];
      const roof = roofColors[id % roofColors.length];
      buildings.push({
        id: `casa-${id++}`,
        type: 'casa',
        label: `Casa ${id}`,
        cx, cy,
        parts: house(cx, cy, casaU, casaV, rot, {
          wallColor: wall,
          roofColor: roof,
          withChimney: id % 3 === 0,
        }),
      });
    }
  }

  // Calle central (asphalt strip)
  const calleCand = rect(
    ...toLocal(pminU + usableU / 2, centerV),
    Math.min(usableU * 0.88, nCols * stepU - gapU),
    calleV,
    rot,
  );
  buildings.push({
    id: 'calle-central',
    type: 'calle',
    label: 'Vía principal',
    cx: 0, cy: 0,
    parts: [{ coords: calleCand, base: 0, height: 0.25, color: '#1e293b' }],
  });

  // 2 plazas en los extremos
  for (let i = 0; i < 2; i++) {
    const cu = startU + (i === 0 ? -stepU * 0.4 : nCols * stepU - gapU + stepU * 0.4);
    const cv = centerV;
    const [px, py] = toLocal(cu, cv);
    const cand = rect(px, py, casaU * 1.5, casaV * 2.5, rot);
    if (rectFitsInside(cand, poly, 3)) {
      buildings.push({
        id: `plaza-${i}`,
        type: 'plaza',
        label: 'Área verde',
        cx: px, cy: py,
        parts: [
          { coords: cand, base: 0, height: 0.5, color: '#16a34a' },
          // Algunos "árboles" puntuales
          { coords: rect(px - casaU * 0.3, py - casaV * 0.5, 2.5, 2.5, 0), base: 0.5, height: 4, color: '#15803d' },
          { coords: rect(px + casaU * 0.3, py + casaV * 0.5, 2.5, 2.5, 0), base: 0.5, height: 4, color: '#166534' },
          { coords: rect(px, py, 2.5, 2.5, 0), base: 0.5, height: 4.5, color: '#15803d' },
        ],
      });
    }
  }

  // Sede comunitaria
  const sedeCu = pminU + usableU / 2;
  const sedeCv = centerV + (rowOffsetV + casaV * 1.4) * (usableV > rowOffsetV * 2 + casaV * 2 ? 1 : 0.6);
  const [sX, sY] = toLocal(sedeCu, sedeCv);
  const sedeCand = rect(sX, sY, casaU * 1.6, casaV * 1.4, rot);
  if (rectFitsInside(sedeCand, poly, 4)) {
    buildings.push({
      id: 'sede',
      type: 'equipamiento',
      label: 'Sede comunitaria',
      cx: sX, cy: sY,
      parts: [
        { coords: sedeCand, base: 0, height: 5, color: '#a855f7' },
        { coords: rect(sX, sY, casaU * 1.5, casaV * 0.4, rot), base: 5, height: 7.5, color: '#7e22ce' },
      ],
    });
  }

  return {
    buildings,
    legend: [
      { color: '#b91c1c', label: 'Viviendas' },
      { color: '#16a34a', label: 'Áreas verdes' },
      { color: '#a855f7', label: 'Equipamiento' },
      { color: '#1e293b', label: 'Vialidad' },
    ],
  };
}

export function buildLayout(
  type: LayoutType,
  bounds: PolygonBounds,
  poly: [number, number][],
): LayoutResult {
  return type === 'packing'
    ? buildPackingLayout(bounds, poly)
    : buildConjuntoLayout(bounds, poly);
}
