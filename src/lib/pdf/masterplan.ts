import type jsPDF from 'jspdf';

/**
 * Plano del loteo dibujado en vectores sobre la imagen satelital.
 *
 * La imagen estática de Mapbox se pide SIN overlays, con centro y zoom
 * calculados aquí; así sabemos exactamente dónde cae cada coordenada y los
 * polígonos se dibujan como vectores nítidos (colores por estado, números,
 * leyenda, norte y escala) en vez de rasterizados por la API.
 */

export type LotState = 'available' | 'reserved' | 'sold' | 'other';
export interface PlanLot {
  ring: [number, number][]; // [lng, lat]
  label: string;
  state: LotState;
}
export interface Box { x: number; y: number; w: number; h: number }
export interface MapView { lng: number; lat: number; zoom: number; wPx: number; hPx: number }

const TILE = 512; // Mapbox static images use 512 px tiles.
const MAX_STATIC_PX = 1280;

export const normalizeLotState = (status: string | null | undefined): LotState => {
  const s = (status ?? '').toLowerCase();
  if (s === 'available' || s === 'disponible') return 'available';
  if (s === 'reserved' || s === 'reservado') return 'reserved';
  if (s === 'sold' || s === 'vendido') return 'sold';
  return 'other';
};

/** Web Mercator normalizado a [0,1] (x hacia el este, y hacia el sur). */
export const lngLatToMerc = (lng: number, lat: number): [number, number] => {
  const x = (lng + 180) / 360;
  const s = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
  return [x, y];
};

export const mercToLngLat = (x: number, y: number): [number, number] => {
  const lng = x * 360 - 180;
  const n = Math.PI - 2 * Math.PI * y;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return [lng, lat];
};

/** Tamaño en px lógicos de la imagen, con el mismo aspecto que la caja del PDF. */
export const imageSizeForBox = (box: Box): { wPx: number; hPx: number } => {
  const aspect = box.w / box.h;
  return aspect >= 1
    ? { wPx: MAX_STATIC_PX, hPx: Math.max(64, Math.round(MAX_STATIC_PX / aspect)) }
    : { wPx: Math.max(64, Math.round(MAX_STATIC_PX * aspect)), hPx: MAX_STATIC_PX };
};

/** Centro + zoom (fraccionario) que encuadran todos los anillos con margen. */
export const fitView = (rings: [number, number][][], wPx: number, hPx: number, padFrac = 0.08): MapView | null => {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      const [x, y] = lngLatToMerc(lng, lat);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  if (!Number.isFinite(minX)) return null;
  const spanX = Math.max(maxX - minX, 1e-7);
  const spanY = Math.max(maxY - minY, 1e-7);
  const usableW = wPx * (1 - 2 * padFrac);
  const usableH = hPx * (1 - 2 * padFrac);
  const zoom = Math.min(Math.log2(usableW / (spanX * TILE)), Math.log2(usableH / (spanY * TILE)), 20);
  const [lng, lat] = mercToLngLat((minX + maxX) / 2, (minY + maxY) / 2);
  return { lng, lat, zoom: Math.floor(zoom * 100) / 100, wPx, hPx };
};

/** Coordenada geográfica → posición en mm dentro de la caja del PDF. */
export const projectToBox = (lng: number, lat: number, view: MapView, box: Box): [number, number] => {
  const [cx, cy] = lngLatToMerc(view.lng, view.lat);
  const [x, y] = lngLatToMerc(lng, lat);
  const scale = TILE * 2 ** view.zoom;
  const px = (x - cx) * scale + view.wPx / 2;
  const py = (y - cy) * scale + view.hPx / 2;
  return [box.x + (px / view.wPx) * box.w, box.y + (py / view.hPx) * box.h];
};

/** Metros representados por 1 mm del plano en la latitud del centro. */
export const metersPerMm = (view: MapView, box: Box): number => {
  const metersPerPx = (156543.03392 * Math.cos((view.lat * Math.PI) / 180)) / 2 ** view.zoom / (TILE / 256);
  return (metersPerPx * view.wPx) / box.w;
};

/** Largo "redondo" de barra de escala (1-2-5 × 10^n) cercano al objetivo. */
export const niceScaleLength = (targetM: number): number => {
  const pow = 10 ** Math.floor(Math.log10(targetM));
  const n = targetM / pow;
  return (n >= 5 ? 5 : n >= 2 ? 2 : 1) * pow;
};

/** Centroide de área (fórmula del polígono), con promedio como respaldo. */
export const ringCentroid = (pts: [number, number][]): [number, number] => {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    const f = x0 * y1 - x1 * y0;
    a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
  }
  if (Math.abs(a) < 1e-9) {
    const n = pts.length || 1;
    return [pts.reduce((s, p) => s + p[0], 0) / n, pts.reduce((s, p) => s + p[1], 0) / n];
  }
  return [cx / (3 * a), cy / (3 * a)];
};

export const staticImageUrl = (view: MapView, token: string): string =>
  `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/` +
  `${view.lng.toFixed(6)},${view.lat.toFixed(6)},${view.zoom},0/${view.wPx}x${view.hPx}@2x?access_token=${token}`;

type RGB = [number, number, number];
export interface MasterplanStyle {
  available: RGB;
  reserved: RGB;
  sold: RGB;
  outline: RGB;
  labelDark: RGB;
  paper: RGB;
  font: string;
  fontBold: string;
}

const polygonPath = (doc: jsPDF, pts: [number, number][], style: 'F' | 'S' | 'FD') => {
  if (pts.length < 3) return;
  const deltas = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]] as [number, number]);
  doc.lines(deltas, pts[0][0], pts[0][1], [1, 1], style, true);
};

const withOpacity = (doc: jsPDF, opacity: number, fn: () => void) => {
  const gs = (doc as unknown as { GState: new (o: { opacity: number; 'stroke-opacity'?: number }) => unknown }).GState;
  doc.saveGraphicsState();
  try {
    if (gs) doc.setGState(new gs({ opacity, 'stroke-opacity': 1 }) as Parameters<jsPDF['setGState']>[0]);
    fn();
  } finally {
    doc.restoreGraphicsState();
  }
};

/**
 * Dibuja el plano en la caja: fondo (satélite o papel), parcelas por estado,
 * números en las disponibles, norte y barra de escala. Devuelve los conteos
 * por estado para la leyenda.
 */
export const drawMasterplan = (
  doc: jsPDF,
  lots: PlanLot[],
  view: MapView,
  box: Box,
  style: MasterplanStyle,
  imageData?: string | null,
): Record<LotState, number> => {
  const counts: Record<LotState, number> = { available: 0, reserved: 0, sold: 0, other: 0 };

  doc.saveGraphicsState();
  doc.rect(box.x, box.y, box.w, box.h, null);
  doc.clip();
  doc.discardPath();

  if (imageData) {
    doc.addImage(imageData, 'JPEG', box.x, box.y, box.w, box.h);
  } else {
    doc.setFillColor(...style.paper);
    doc.rect(box.x, box.y, box.w, box.h, 'F');
  }

  const projected = lots.map((l) => ({ ...l, pts: l.ring.map(([lng, lat]) => projectToBox(lng, lat, view, box)) }));

  // Sold/other first (muted), then reserved, then available on top.
  const order: LotState[] = ['other', 'sold', 'reserved', 'available'];
  for (const state of order) {
    for (const lot of projected.filter((l) => l.state === state)) {
      counts[state] += 1;
      const fill = state === 'available' ? style.available : state === 'reserved' ? style.reserved : style.sold;
      const opacity = state === 'available' ? 0.82 : state === 'reserved' ? 0.7 : imageData ? 0.45 : 0.25;
      withOpacity(doc, opacity, () => {
        doc.setFillColor(...fill);
        polygonPath(doc, lot.pts, 'F');
      });
      doc.setDrawColor(...style.outline);
      doc.setLineWidth(state === 'available' ? 0.3 : 0.18);
      polygonPath(doc, lot.pts, 'S');
    }
  }

  // Lot numbers on available parcels, sized to the parcel on paper.
  for (const lot of projected.filter((l) => l.state === 'available')) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of lot.pts) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    const minSide = Math.min(maxX - minX, maxY - minY);
    if (minSide < 2.2 || !lot.label) continue;
    const size = Math.max(4, Math.min(9, minSide * 1.6));
    const [cx, cy] = ringCentroid(lot.pts);
    doc.setFont(style.fontBold, 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...style.labelDark);
    doc.text(lot.label, cx, cy + size * 0.12, { align: 'center' });
  }

  doc.restoreGraphicsState();

  // North arrow (top-right) on a paper chip.
  const nx = box.x + box.w - 11;
  const ny = box.y + 5;
  doc.setFillColor(...style.paper);
  doc.roundedRect(nx - 1, ny - 1, 9, 12, 1.5, 1.5, 'F');
  doc.setFillColor(...style.labelDark);
  doc.triangle(nx + 3.5, ny + 1, nx + 1.2, ny + 7, nx + 5.8, ny + 7, 'F');
  doc.setFont(style.fontBold, 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...style.labelDark);
  doc.text('N', nx + 3.5, ny + 10.2, { align: 'center' });

  // Scale bar (bottom-left) on a paper chip.
  const mpm = metersPerMm(view, box);
  const lengthM = niceScaleLength(mpm * 30);
  const barMm = lengthM / mpm;
  const sx = box.x + 5;
  const sy = box.y + box.h - 7;
  doc.setFillColor(...style.paper);
  doc.roundedRect(sx - 2, sy - 5, barMm + 22, 9, 1.5, 1.5, 'F');
  doc.setFillColor(...style.labelDark);
  doc.rect(sx, sy, barMm, 1.2, 'F');
  doc.setFont(style.font, 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...style.labelDark);
  doc.text(lengthM >= 1000 ? `${lengthM / 1000} km` : `${lengthM} m`, sx + barMm + 2, sy + 1.2);

  return counts;
};
