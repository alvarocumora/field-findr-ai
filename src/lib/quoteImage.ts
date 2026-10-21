import type { PolygonOverlay, TourScene } from '@/hooks/useTourScenes';

export type QuoteImageSource = 'tour-lot' | 'tour' | 'project';
export interface QuoteImage { dataUrl: string; caption: string; source: QuoteImageSource }

const TAU = Math.PI * 2;
export const BANNER = 1280 / 516;

/** Equirectangular projection (Photo Sphere Viewer convention: yaw 0 = image centre, radians). */
export const yawPitchToPixel = (yaw: number, pitch: number, w: number, h: number) => {
  const u = (((yaw / TAU) + 0.5) % 1 + 1) % 1;
  return { x: u * w, y: (0.5 - pitch / Math.PI) * h };
};

/** Bounding box of an overlay in panorama pixels, padded, keeping a 16:9 frame. */
export const overlayCropBox = (overlay: Pick<PolygonOverlay, 'points'>, w: number, h: number) => {
  const pts = overlay.points.map(p => yawPitchToPixel(p.yaw, p.pitch, w, h));
  // Unwrap points that straddle the seam relative to the first point.
  const ref = pts[0]?.x ?? 0;
  const xs = pts.map(p => (p.x - ref > w / 2 ? p.x - w : ref - p.x > w / 2 ? p.x + w : p.x));
  const ys = pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  let cw = Math.max((maxX - minX) * 2.2, w * 0.08);
  let ch = Math.max((maxY - minY) * 2.2, h * 0.08);
  if (cw / ch > BANNER) ch = cw / BANNER; else cw = ch * BANNER;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const sy = Math.min(Math.max(0, cy - ch / 2), Math.max(0, h - ch));
  return { sx: cx - cw / 2, sy, sw: cw, sh: Math.min(ch, h), points: xs.map((x, i) => ({ x, y: ys[i] })) };
};

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

const OUT_W = 1280, OUT_H = 516; // ~2.48:1 banner used by the quote PDF and preview card

async function cropOverlay(scene: TourScene, overlay: PolygonOverlay): Promise<string> {
  const img = await loadImage(scene.panorama_url);
  const { sx, sy, sw, sh, points } = overlayCropBox(overlay, img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = OUT_W; canvas.height = OUT_H;
  const ctx = canvas.getContext('2d')!;
  const scale = OUT_W / sw;
  // Draw (twice when the crop crosses the panorama seam).
  for (const shift of [-img.naturalWidth, 0, img.naturalWidth]) {
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, (shift - sx) * scale, -sy * (OUT_H / sh), img.naturalWidth * scale, img.naturalHeight * (OUT_H / sh));
  }
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = (p.x - sx) * scale, y = (p.y - sy) * (OUT_H / sh);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(34,197,94,0.22)'; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.stroke();
  return canvas.toDataURL('image/jpeg', 0.85); // throws if canvas is tainted
}

async function coverDataUrl(src: string): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = OUT_W; canvas.height = OUT_H;
  const ctx = canvas.getContext('2d')!;
  const r = Math.max(OUT_W / img.naturalWidth, OUT_H / img.naturalHeight);
  const dw = img.naturalWidth * r, dh = img.naturalHeight * r;
  ctx.drawImage(img, (OUT_W - dw) / 2, (OUT_H - dh) / 2, dw, dh);
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Picks the best image for a quote: the lot's framed area in the 360 tour,
 * otherwise the tour's aerial view, otherwise the project's photo. Never throws.
 */
export async function resolveQuoteImage(opts: { lotId?: string | null; lotNumber?: string; scenes?: TourScene[]; projectImages?: string[] }): Promise<QuoteImage | null> {
  const scenes = opts.scenes ?? [];
  if (opts.lotId) {
    for (const scene of scenes) {
      const overlay = (scene.polygon_overlays ?? []).find(o => o.lot_id === opts.lotId && o.points?.length >= 3);
      if (!overlay) continue;
      try {
        return { dataUrl: await cropOverlay(scene, overlay), caption: `Lote ${opts.lotNumber ?? ''} en el tour 360 · ${scene.name} · delimitación referencial`.replace('  ', ' '), source: 'tour-lot' };
      } catch { /* fall through */ }
    }
  }
  const scene = scenes[0];
  if (scene) {
    try { return { dataUrl: await coverDataUrl(scene.thumbnail_url || scene.panorama_url), caption: `Vista del tour 360 · ${scene.name}`, source: 'tour' }; } catch { /* fall through */ }
  }
  for (const src of opts.projectImages ?? []) {
    try { return { dataUrl: await coverDataUrl(src), caption: 'Entorno del proyecto', source: 'project' }; } catch { /* next */ }
  }
  return null;
}
