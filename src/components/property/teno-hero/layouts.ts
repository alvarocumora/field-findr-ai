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

  // ── Realistic neighbourhood layout ────────────────────────────────
  // Pattern: parallel street corridors. Between corridors sits a "block"
  // of two back-to-back rows of houses (front towards street, back yards
  // sharing a central garden strip). Perimeter loop street + sidewalks.

  // Lot/house dimensions (Chilean conjunto típico)
  const casaU = 9.5;          // frente de casa
  const casaV = 7.5;          // fondo de casa
  const frontYardV = 2.5;     // antejardín hacia la calle
  const backYardV = 5.0;      // patio trasero compartido
  const sideGapU = 2.5;       // distancia entre casas vecinas
  const stepU = casaU + sideGapU;
  const calleV = 7.0;         // calzada
  const aceraV = 1.6;         // acera + antejardín "público"
  // Module = street + sidewalk + frontyard + casa + backyard/2 (mirrored)
  const blockV = 2 * (aceraV + frontYardV + casaV) + backYardV;
  const moduleV = blockV + calleV;

  // Perimeter setback (vereda perimetral)
  const perim = 4.0;
  const innerUmin = pminU + perim;
  const innerUmax = pmaxU - perim;
  const innerVmin = pminV + perim;
  const innerVmax = pmaxV - perim;
  const innerU = innerUmax - innerUmin;
  const innerV = innerVmax - innerVmin;

  // How many blocks fit along V?
  const nBlocks = Math.max(1, Math.floor((innerV + calleV) / moduleV));
  const totalLayoutV = nBlocks * blockV + (nBlocks + 1) * calleV; // streets between & around blocks
  const startV = innerVmin + Math.max(0, (innerV - totalLayoutV) / 2);

  // Columns of houses
  const nCols = Math.max(3, Math.floor((innerU + sideGapU) / stepU));
  const houseStripU = nCols * stepU - sideGapU;
  const startU = innerUmin + Math.max(0, (innerU - houseStripU) / 2);

  const wallColors = ['#fef3c7', '#fde68a', '#fed7aa', '#fee2e2', '#e0f2fe', '#ede9fe', '#ecfccb'];
  const roofColors = ['#b91c1c', '#9a3412', '#7c2d12', '#a16207', '#78350f'];

  // Reserve a "plaza central" position: middle column of middle block
  const plazaBlock = Math.floor(nBlocks / 2);
  const plazaColStart = Math.max(0, Math.floor(nCols / 2) - 1);
  const plazaColEnd = Math.min(nCols - 1, plazaColStart + 1);

  let id = 0;

  // ── Streets (horizontal corridors along U) + sidewalks + street trees ─
  const streetTreeColors = ['#15803d', '#166534', '#16a34a', '#22c55e'];
  for (let s = 0; s <= nBlocks; s++) {
    const sv = startV + s * (blockV + calleV) + calleV / 2;
    const [sx, sy] = toLocal(pminU + usableU / 2, sv);
    const calleW = houseStripU + perim * 1.2;
    const calleCand = rect(sx, sy, calleW, calleV, rot);
    if (rectFitsInside(calleCand, poly, 1)) {
      const parts: BuildingPart[] = [
        { coords: calleCand, base: 0, height: 0.18, color: '#1f2937' },
        // línea central discontinua simulada con segmentos
      ];
      // Línea central segmentada
      const dashCount = Math.max(6, Math.floor(houseStripU / 4));
      const dashLen = houseStripU / (dashCount * 2);
      for (let d = 0; d < dashCount; d++) {
        const du = startU + (d * 2 + 0.5) * dashLen + houseStripU * 0;
        const dCu = startU - houseStripU / 2 + (d * 2 + 0.5) * dashLen * 2;
        const [dx, dy] = toLocal(dCu, sv);
        parts.push({
          coords: rect(dx, dy, dashLen, 0.22, rot),
          base: 0.18, height: 0.22, color: '#fde047',
        });
      }
      // Aceras a ambos lados
      const aceraOffset = calleV / 2 + aceraV / 2;
      for (const sign of [-1, 1] as const) {
        const [ax, ay] = toLocal(pminU + usableU / 2, sv + sign * aceraOffset);
        const aceraCand = rect(ax, ay, calleW * 0.96, aceraV * 0.9, rot);
        if (rectFitsInside(aceraCand, poly, 0.5)) {
          parts.push({ coords: aceraCand, base: 0, height: 0.22, color: '#cbd5e1' });
        }
      }
      buildings.push({
        id: `calle-${s}`,
        type: 'calle',
        label: s === 0 || s === nBlocks ? 'Calle perimetral' : 'Calle interior',
        cx: sx, cy: sy,
        parts,
      });
    }

    // Arbolado urbano: árboles entre veredas y calzada, alternando
    const treeOffset = calleV / 2 + aceraV * 0.15;
    for (let c = 0; c < nCols; c++) {
      if ((c + s) % 2 !== 0) continue; // alternar para no saturar
      const cu = startU + c * stepU + casaU / 2;
      for (const sign of [-1, 1] as const) {
        const [tx, ty] = toLocal(cu, sv + sign * treeOffset);
        const trunkCand = rect(tx, ty, 0.6, 0.6, 0);
        const canopyCand = rect(tx, ty, 2.2, 2.2, 0);
        if (!rectFitsInside(canopyCand, poly, 0.3)) continue;
        buildings.push({
          id: `arbol-c${s}-${c}-${sign}`,
          type: 'arbol',
          cx: tx, cy: ty,
          parts: [
            { coords: trunkCand, base: 0, height: 1.8, color: '#78350f' },
            { coords: canopyCand, base: 1.8, height: 4.2, color: streetTreeColors[(c + s) % streetTreeColors.length] },
          ],
        });
      }
    }
  }

  // ── Casas (dos hileras por bloque) ─────────────────────────────────
  for (let b = 0; b < nBlocks; b++) {
    const blockBaseV = startV + calleV + b * (blockV + calleV);
    // row 0: front faces street BELOW (toward -V), so house centre offset
    // row 1: front faces street ABOVE
    for (const rowIdx of [0, 1] as const) {
      const rowV = rowIdx === 0
        ? blockBaseV + aceraV + frontYardV + casaV / 2
        : blockBaseV + blockV - (aceraV + frontYardV + casaV / 2);

      for (let c = 0; c < nCols; c++) {
        // Skip houses where plaza will be
        if (b === plazaBlock && c >= plazaColStart && c <= plazaColEnd) continue;

        const cu = startU + c * stepU + casaU / 2;
        const [cx, cy] = toLocal(cu, rowV);
        const cand = rect(cx, cy, casaU, casaV, rot);
        if (!rectFitsInside(cand, poly, 2.5)) continue;
        if (!buildingFitsInside(cx, cy, casaU, casaV, rot, poly, 1.5, 0.5)) continue;

        const variant = (b * 7 + c * 3 + rowIdx) % wallColors.length;
        const wall = wallColors[variant];
        const roof = roofColors[(variant + rowIdx) % roofColors.length];

        // Antejardín (césped frente a la casa)
        const yardV = aceraV + frontYardV;
        const yardCv = rowIdx === 0
          ? rowV - casaV / 2 - yardV / 2
          : rowV + casaV / 2 + yardV / 2;
        const [yx, yy] = toLocal(cu, yardCv);
        const yardCand = rect(yx, yy, casaU * 0.95, yardV * 0.85, rot);
        if (rectFitsInside(yardCand, poly, 1)) {
          buildings.push({
            id: `jardin-${id}`,
            type: 'jardin',
            cx: yx, cy: yy,
            parts: [{ coords: yardCand, base: 0, height: 0.18, color: '#4ade80' }],
          });
        }

        buildings.push({
          id: `casa-${id++}`,
          type: 'casa',
          label: `Casa ${id}`,
          cx, cy,
          parts: house(cx, cy, casaU, casaV, rot, {
            wallColor: wall,
            roofColor: roof,
            withChimney: (b + c) % 4 === 0,
            steps: steps.house,
            baseHeight: 3.0 + ((b + c) % 2) * 0.6, // alguna casa de 2 pisos
            ridgeHeight: 2.4 + ((c) % 3) * 0.3,
          }),
        });
      }
    }

    // Patio trasero compartido (franja verde en el centro del bloque)
    const backCv = blockBaseV + blockV / 2;
    const [bx, by] = toLocal(pminU + usableU / 2, backCv);
    const backCand = rect(bx, by, houseStripU * 0.95, backYardV * 0.7, rot);
    if (rectFitsInside(backCand, poly, 2)) {
      buildings.push({
        id: `backyards-${b}`,
        type: 'jardin',
        cx: bx, cy: by,
        parts: [{ coords: backCand, base: 0, height: 0.15, color: '#86efac' }],
      });
    }
  }

  // ── Plaza central con árboles + juegos ─────────────────────────────
  if (nBlocks > 0) {
    const plazaBaseV = startV + calleV + plazaBlock * (blockV + calleV);
    const plazaCv = plazaBaseV + blockV / 2;
    const plazaCu = startU + ((plazaColStart + plazaColEnd) / 2 + 0.5) * stepU;
    const plazaW = (plazaColEnd - plazaColStart + 1) * stepU - sideGapU;
    const plazaH = blockV - aceraV * 2;
    const [pX, pY] = toLocal(plazaCu, plazaCv);
    const plazaCand = rect(pX, pY, plazaW, plazaH, rot);
    if (rectFitsInside(plazaCand, poly, 2)) {
      const treeColors = ['#15803d', '#166534', '#14532d', '#16a34a'];
      const treeParts: BuildingPart[] = [
        { coords: plazaCand, base: 0, height: 0.3, color: '#16a34a' },
        // sendero diagonal
        { coords: rect(pX, pY, plazaW * 0.7, 1.2, rot), base: 0.3, height: 0.4, color: '#d6d3d1' },
        { coords: rect(pX, pY, 1.2, plazaH * 0.7, rot), base: 0.3, height: 0.4, color: '#d6d3d1' },
      ];
      // Árboles distribuidos
      for (let t = 0; t < 6; t++) {
        const ang = (t / 6) * Math.PI * 2;
        const rU = plazaW * 0.32 * Math.cos(ang);
        const rV = plazaH * 0.32 * Math.sin(ang);
        const [tx, ty] = toLocal(plazaCu + rU, plazaCv + rV);
        treeParts.push({
          coords: rect(tx, ty, 2.4, 2.4, 0),
          base: 0.3,
          height: 4.5 + (t % 2) * 1.2,
          color: treeColors[t % treeColors.length],
        });
      }
      buildings.push({
        id: 'plaza-central',
        type: 'plaza',
        label: 'Plaza central',
        cx: pX, cy: pY,
        parts: treeParts,
      });
    }
  }

  // ── Sede comunitaria + multicancha (en plaza si hay espacio extra) ─
  // Buscar primer bloque distinto al de la plaza para colocar sede
  const sedeBlockIdx = plazaBlock === 0 ? Math.min(nBlocks - 1, 1) : 0;
  if (sedeBlockIdx !== plazaBlock && nBlocks > 1) {
    const sedeBaseV = startV + calleV + sedeBlockIdx * (blockV + calleV);
    const sedeCv = sedeBaseV + blockV / 2;
    const sedeCu = startU + houseStripU - stepU * 0.5;
    const [sX, sY] = toLocal(sedeCu, sedeCv);
    const sedeCand = rect(sX, sY, casaU * 1.4, casaV * 1.6, rot);
    if (rectFitsInside(sedeCand, poly, 3)) {
      buildings.push({
        id: 'sede',
        type: 'equipamiento',
        label: 'Sede comunitaria',
        cx: sX, cy: sY,
        parts: [
          { coords: sedeCand, base: 0, height: 4.5, color: '#e9d5ff' },
          eaves(sX, sY, casaU * 1.4, casaV * 1.6, rot, 4.5, 0.6, 0.25, '#1f2937'),
          ...hipRoofStepped(sX, sY, casaU * 1.4, casaV * 1.6, rot, 4.7, 2.2, '#7e22ce', steps.house),
        ],
      });
    }

    // Multicancha al lado
    const canchaCu = startU + stepU * 0.6;
    const [ccx, ccy] = toLocal(canchaCu, sedeCv);
    const canchaCand = rect(ccx, ccy, casaU * 1.6, casaV * 1.5, rot);
    if (rectFitsInside(canchaCand, poly, 3)) {
      buildings.push({
        id: 'cancha',
        type: 'equipamiento',
        label: 'Multicancha',
        cx: ccx, cy: ccy,
        parts: [
          { coords: canchaCand, base: 0, height: 0.25, color: '#0ea5e9' },
          { coords: rect(ccx, ccy, casaU * 1.55, 0.2, rot), base: 0.25, height: 0.32, color: '#f8fafc' },
          { coords: rect(ccx, ccy, 0.2, casaV * 1.45, rot), base: 0.25, height: 0.32, color: '#f8fafc' },
        ],
      });
    }
  }

  // ── Acceso principal: portería al borde inferior ───────────────────
  const accessCu = startU + houseStripU * 0.5;
  const accessCv = startV + calleV * 0.5;
  const [aX, aY] = toLocal(accessCu, accessCv - calleV * 0.6);
  const accessCand = rect(aX, aY, casaU * 0.7, casaV * 0.5, rot);
  if (rectFitsInside(accessCand, poly, 2)) {
    buildings.push({
      id: 'acceso',
      type: 'equipamiento',
      label: 'Acceso / Portería',
      cx: aX, cy: aY,
      parts: [
        { coords: accessCand, base: 0, height: 3.2, color: '#f1f5f9' },
        ...hipRoofStepped(aX, aY, casaU * 0.7, casaV * 0.5, rot, 3.2, 1.4, '#475569', steps.house),
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
  detail: DetailLevel = 'high',
): LayoutResult {
  return type === 'packing'
    ? buildPackingLayout(bounds, poly, detail)
    : buildConjuntoLayout(bounds, poly, detail);
}
