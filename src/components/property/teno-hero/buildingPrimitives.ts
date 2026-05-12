/**
 * Reusable 3D building primitives for cinematic hero overlays.
 *
 * Mapbox `fill-extrusion` only supports vertical extrusions of flat polygons,
 * so realistic pitched roofs are faked with **stepped slabs** that shrink
 * along the short axis as height increases — when viewed at the canonical
 * 60° pitch they read as a pitched gable / hip roof.
 *
 * This file is the canonical primitive library used by every cinematic hero
 * (per `docs/GUIA_HERO_CINEMATICO.md`). New listings should consume these
 * factories instead of inventing their own geometry.
 */

export interface BuildingPart {
  coords: [number, number][]; // local meters, CCW
  base: number;
  height: number;
  color: string;
}

// ─── Geometry helpers ────────────────────────────────────────────────

export const rect = (
  cx: number,
  cy: number,
  w: number,
  h: number,
  rotRad: number,
): [number, number][] => {
  const cos = Math.cos(rotRad), sin = Math.sin(rotRad);
  const corners: [number, number][] = [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [-w / 2, h / 2],
  ];
  return corners.map(([x, y]) => [cx + x * cos - y * sin, cy + x * sin + y * cos]);
};

// ─── Roof primitives (stepped extrusion = faux pitch) ────────────────

interface SteppedRoofOpts {
  /** number of stepped slabs (more = smoother slope, more draw calls) */
  steps?: number;
  /** shrink amount per step on the short axis (0..1, default 0.22) */
  shrink?: number;
  /** ridge runs along the longer side by default; force with this flag */
  ridgeAlongLong?: boolean;
}

/**
 * Gable roof: ridge along longest side, shrinks symmetrically only on the
 * short axis, producing two visible "slopes".
 */
export const gableRoofStepped = (
  cx: number,
  cy: number,
  w: number,
  h: number,
  rot: number,
  baseHeight: number,
  ridgeHeight: number,
  color: string,
  opts: SteppedRoofOpts = {},
): BuildingPart[] => {
  const steps = opts.steps ?? 5;
  const shrink = opts.shrink ?? 0.22;
  const ridgeAlongX = opts.ridgeAlongLong !== false ? w >= h : h > w;
  const slabH = ridgeHeight / steps;
  const parts: BuildingPart[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps; // 0..(steps-1)/steps
    const factor = 1 - shrink * (i + 0.5);
    const sw = ridgeAlongX ? w * 0.98 : w * Math.max(0.05, factor);
    const sh = ridgeAlongX ? h * Math.max(0.05, factor) : h * 0.98;
    parts.push({
      coords: rect(cx, cy, sw, sh, rot),
      base: baseHeight + i * slabH,
      height: baseHeight + (i + 1) * slabH,
      // Slightly darker towards ridge for depth
      color: shadeColor(color, -i * 6),
    });
  }
  return parts;
};

/**
 * Hip roof: shrinks on BOTH axes — pyramid-like, four visible slopes.
 */
export const hipRoofStepped = (
  cx: number,
  cy: number,
  w: number,
  h: number,
  rot: number,
  baseHeight: number,
  ridgeHeight: number,
  color: string,
  steps = 5,
  shrink = 0.18,
): BuildingPart[] => {
  const slabH = ridgeHeight / steps;
  const parts: BuildingPart[] = [];
  for (let i = 0; i < steps; i++) {
    const factor = 1 - shrink * (i + 0.5);
    const sw = w * Math.max(0.05, factor);
    const sh = h * Math.max(0.05, factor);
    parts.push({
      coords: rect(cx, cy, sw, sh, rot),
      base: baseHeight + i * slabH,
      height: baseHeight + (i + 1) * slabH,
      color: shadeColor(color, -i * 6),
    });
  }
  return parts;
};

/** Eave: thin overhanging slab just above wall top (sits at baseHeight). */
export const eaves = (
  cx: number,
  cy: number,
  w: number,
  h: number,
  rot: number,
  baseHeight: number,
  overhang = 0.6,
  thickness = 0.3,
  color = '#1f2937',
): BuildingPart => ({
  coords: rect(cx, cy, w + overhang * 2, h + overhang * 2, rot),
  base: Math.max(0, baseHeight - thickness),
  height: baseHeight,
  color,
});

/** Small chimney bump on top of a roof. */
export const chimney = (
  cx: number,
  cy: number,
  rot: number,
  baseHeight: number,
  size = 0.8,
  height = 1.6,
  color = '#78716c',
): BuildingPart => ({
  coords: rect(cx, cy, size, size, rot),
  base: baseHeight,
  height: baseHeight + height,
  color,
});

// ─── Composite buildings ─────────────────────────────────────────────

export interface HouseOpts {
  wallColor?: string;
  roofColor?: string;
  eaveColor?: string;
  withChimney?: boolean;
  baseHeight?: number;
  ridgeHeight?: number;
  steps?: number;
}

/** Realistic house: walls + eaves + stepped gable roof + optional chimney. */
export const house = (
  cx: number,
  cy: number,
  w: number,
  h: number,
  rot: number,
  opts: HouseOpts = {},
): BuildingPart[] => {
  const wallColor = opts.wallColor ?? '#fef3c7';
  const roofColor = opts.roofColor ?? '#b91c1c';
  const eaveColor = opts.eaveColor ?? '#1f2937';
  const baseH = opts.baseHeight ?? 3.2;
  const ridgeH = opts.ridgeHeight ?? 2.6;
  const parts: BuildingPart[] = [
    { coords: rect(cx, cy, w, h, rot), base: 0, height: baseH, color: wallColor },
    eaves(cx, cy, w, h, rot, baseH, 0.5, 0.18, eaveColor),
    ...gableRoofStepped(cx, cy, w, h, rot, baseH + 0.18, ridgeH, roofColor, {
      steps: opts.steps ?? 5,
    }),
  ];
  if (opts.withChimney) {
    // Place chimney slightly off-center along the ridge
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const off = (w >= h ? w : h) * 0.25;
    const cxC = cx + off * cos;
    const cyC = cy + off * sin;
    parts.push(chimney(cxC, cyC, rot, baseH + ridgeH * 0.85));
  }
  return parts;
};

export interface WarehouseOpts {
  wallColor?: string;
  roofColor?: string;
  eaveColor?: string;
  baseHeight?: number;
  ridgeHeight?: number;
  steps?: number;
  withSkylight?: boolean;
}

/**
 * Industrial warehouse / galpón: tall metal walls + wide eaves + low-slope
 * stepped gable roof. Optional skylight ridge cap.
 */
export const warehouse = (
  cx: number,
  cy: number,
  w: number,
  h: number,
  rot: number,
  opts: WarehouseOpts = {},
): BuildingPart[] => {
  const wallColor = opts.wallColor ?? '#cbd5e1';
  const roofColor = opts.roofColor ?? '#475569';
  const eaveColor = opts.eaveColor ?? '#0f172a';
  const baseH = opts.baseHeight ?? 7.5;
  const ridgeH = opts.ridgeHeight ?? 3.2;
  const parts: BuildingPart[] = [
    { coords: rect(cx, cy, w, h, rot), base: 0, height: baseH, color: wallColor },
    eaves(cx, cy, w, h, rot, baseH, 0.9, 0.35, eaveColor),
    ...gableRoofStepped(cx, cy, w, h, rot, baseH + 0.35, ridgeH, roofColor, {
      steps: opts.steps ?? 6,
      shrink: 0.16, // shallower slope = industrial
    }),
  ];
  if (opts.withSkylight) {
    const ridgeAlongX = w >= h;
    const skyW = ridgeAlongX ? w * 0.6 : w * 0.06;
    const skyH = ridgeAlongX ? h * 0.06 : h * 0.6;
    parts.push({
      coords: rect(cx, cy, skyW, skyH, rot),
      base: baseH + ridgeH + 0.05,
      height: baseH + ridgeH + 0.6,
      color: '#bae6fd',
    });
  }
  return parts;
};

// ─── Color helper ────────────────────────────────────────────────────

/** Lighten/darken a hex color by `percent` (-100..100). */
export function shadeColor(hex: string, percent: number): string {
  const h = hex.replace('#', '');
  const num = parseInt(
    h.length === 3 ? h.split('').map((c) => c + c).join('') : h,
    16,
  );
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const f = percent / 100;
  const adj = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c + (f >= 0 ? 255 - c : c) * f)));
  r = adj(r); g = adj(g); b = adj(b);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
