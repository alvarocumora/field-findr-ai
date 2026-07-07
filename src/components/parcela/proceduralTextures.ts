import * as THREE from 'three';

/**
 * Lightweight procedural textures for the 3D designer.
 *
 * Every surface used to be a flat `meshStandardMaterial` colour, so walls,
 * roofs and ground all read as the same matte plastic. These generate small
 * tileable canvas textures (grass, roof tiles, stucco) entirely in-browser —
 * no network, no CORS, no asset pipeline — and cache them so they're built
 * once. In environments without a 2D canvas (SSR / jsdom tests) every getter
 * returns `undefined`, so callers just fall back to a plain colour.
 */

const SIZE = 256;
const canvasCache = new Map<string, HTMLCanvasElement | null>();
const textureCache = new Map<string, THREE.Texture | null>();

type Draw = (ctx: CanvasRenderingContext2D, s: number) => void;

function getCanvas(key: string, draw: Draw): HTMLCanvasElement | null {
  const cached = canvasCache.get(key);
  if (cached !== undefined) return cached;
  let canvas: HTMLCanvasElement | null = null;
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = c.height = SIZE;
    const ctx = c.getContext('2d');
    if (ctx) {
      draw(ctx, SIZE);
      canvas = c;
    }
  }
  canvasCache.set(key, canvas);
  return canvas;
}

function texture(key: string, draw: Draw, repeatX: number, repeatY: number): THREE.Texture | undefined {
  const cacheKey = `${key}:${repeatX}x${repeatY}`;
  const cached = textureCache.get(cacheKey);
  if (cached !== undefined) return cached ?? undefined;
  const canvas = getCanvas(key, draw);
  if (!canvas) {
    textureCache.set(cacheKey, null);
    return undefined;
  }
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, t);
  return t;
}

// ── Draw routines ─────────────────────────────────────────

const drawGrass: Draw = (ctx, s) => {
  ctx.fillStyle = '#6f9d47';
  ctx.fillRect(0, 0, s, s);
  // colour speckle so large planes don't read as flat felt
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * s;
    const y = Math.random() * s;
    const g = 120 + Math.floor(Math.random() * 70);
    ctx.fillStyle = `rgba(${Math.floor(g * 0.55)},${g},${Math.floor(g * 0.45)},0.5)`;
    ctx.fillRect(x, y, 2, 2);
  }
  // a few short blades
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * s;
    const y = Math.random() * s;
    ctx.strokeStyle = Math.random() < 0.5 ? 'rgba(60,110,40,0.5)' : 'rgba(150,190,110,0.4)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 3, y - 3 - Math.random() * 3);
    ctx.stroke();
  }
};

const drawRoofTiles: Draw = (ctx, s) => {
  ctx.fillStyle = '#8a4b36';
  ctx.fillRect(0, 0, s, s);
  const rows = 8;
  const cols = 8;
  const rh = s / rows;
  const cw = s / cols;
  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : cw / 2;
    for (let c = -1; c < cols; c++) {
      const x = c * cw + offset;
      const y = r * rh;
      // rounded terracotta tile with a subtle shade gradient
      const shade = 150 + Math.floor(Math.random() * 40);
      const grad = ctx.createLinearGradient(x, y, x, y + rh);
      grad.addColorStop(0, `rgb(${shade + 25},${Math.floor(shade * 0.55)},${Math.floor(shade * 0.4)})`);
      grad.addColorStop(1, `rgb(${Math.floor(shade * 0.8)},${Math.floor(shade * 0.4)},${Math.floor(shade * 0.28)})`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x, y + rh);
      ctx.lineTo(x, y + rh * 0.35);
      ctx.arc(x + cw / 2, y + rh * 0.35, cw / 2, Math.PI, 0);
      ctx.lineTo(x + cw, y + rh);
      ctx.closePath();
      ctx.fill();
    }
    // grout line
    ctx.strokeStyle = 'rgba(40,20,15,0.35)';
    ctx.beginPath();
    ctx.moveTo(0, r * rh);
    ctx.lineTo(s, r * rh);
    ctx.stroke();
  }
};

const drawStucco: Draw = (ctx, s) => {
  // near-white so the wall colour (material.color) still tints it
  ctx.fillStyle = '#f2f2f0';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * s;
    const y = Math.random() * s;
    const v = 205 + Math.floor(Math.random() * 50);
    ctx.fillStyle = `rgba(${v},${v},${v},0.4)`;
    ctx.fillRect(x, y, 2, 2);
  }
  // faint trowel streaks
  ctx.strokeStyle = 'rgba(180,180,175,0.18)';
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * s;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(s * 0.3, y + (Math.random() - 0.5) * 12, s * 0.6, y + (Math.random() - 0.5) * 12, s, y);
    ctx.stroke();
  }
};

// ── Public getters ────────────────────────────────────────

/** Tileable grass for large ground planes. `repeat` = tiles across the plane. */
export const grassTexture = (repeat = 8) => texture('grass', drawGrass, repeat, repeat);

/** Terracotta roof tiles. */
export const roofTileTexture = (repeatX = 3, repeatY = 2) => texture('roofTiles', drawRoofTiles, repeatX, repeatY);

/** Near-white stucco detail; multiply-tinted by the wall colour. */
export const stuccoTexture = (repeat = 2) => texture('stucco', drawStucco, repeat, repeat);
