import QRCode from 'qrcode';
import {
  BRAND, createFichaDoc, drawBrandLogo, fetchImageAsBase64, publicUrl, getPublicOrigin,
  scriptFont, semiboldFont, themeFont,
} from '@/lib/pdf/fichaShell';
import { getFichaTemplate, renderFicha } from '@/lib/pdf/fichaTemplates';
import type { FichaDoc } from '@/lib/pdf/fichaShell';
import { ensureFichaFonts } from '@/lib/pdf/fichaFonts';
import { fittedImage, safePdfLink } from '@/lib/pdf/media';
import {
  drawMasterplan, fitView, imageSizeForBox, normalizeLotState, projectToBox, staticImageUrl,
  type Box, type LotState, type MapView, type MasterplanStyle, type PlanLot, type PlanRoad,
} from '@/lib/pdf/masterplan';
import { projectCanonicalUrl, SITE_URL } from '@/lib/landing/paths';
import { referenceProjectMedia } from './projectMedia';
import type { SentinelImageryResult } from '@/lib/satellite/sentinel';
import { formatSentinelDate, sentinelCloudLabel } from '@/lib/satellite/sentinel';
import { renderSentinelMapViewSnapshot } from '@/lib/satellite/renderSentinelMapViewSnapshot';

/**
 * Kit único de material descargable por proyecto (OFERTA TERRENOS).
 *
 * Cualquier proyecto — con landing genérica (/p/:slug) o a medida — genera el
 * mismo set: dossier comercial, lista de precios (PDF y CSV) y lámina del
 * plano. Todo sobre el shell de fichas, así el branding editable
 * (/admin/branding-fichas) se aplica sin tocar código.
 */

export interface KitLot {
  id?: string;
  lot_number?: string | null;
  area?: number | null;
  price?: number | null;
  status?: string | null;
  polygon?: unknown;
  latitude?: number | null;
  longitude?: number | null;
}

export interface KitProject {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  location?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images?: string[] | null;
  /** Optional captions; illustrative images must be explicitly labelled. */
  media?: { src: string; caption: string }[];
  highlights?: string[];
  /** Puntos de interés: nombre + distancia legible. */
  pois?: { name: string; detail: string }[];
  conditions?: {
    min_down_payment_pct?: number | null;
    max_term_months?: number | null;
    interest_rate?: number | null;
    payment_methods?: string[] | null;
    includes_urbanization?: boolean | null;
    delivery_date?: string | null;
    reservation_deposit?: number | null;
  } | null;
  contact?: { phone?: string | null; whatsapp?: string | null; email?: string | null } | null;
  spatial?: {
    source_file_name?: string;
    source_file_url?: string | null;
    parser_version?: string;
    roads?: number;
    roads_geojson?: GeoJSON.FeatureCollection<GeoJSON.LineString>;
  } | null;
}

export interface KitOptions {
  mapboxToken?: string | null;
  sentinelImagery?: SentinelImageryResult | null;
  /** Ruta pública del proyecto; por defecto /p/:slug. */
  path?: string;
  output?: 'download' | 'blob';
  editorial?: {
    headline?: string;
    pitch?: string;
    sections?: { title: string; text: string }[];
    projection?: string;
    specs?: { label: string; value: string }[];
  };
}

const clp = (n: number | null | undefined) =>
  n == null || !Number.isFinite(Number(n)) || Number(n) <= 0 ? 'Consultar' : '$' + Math.round(Number(n)).toLocaleString('es-CL');
const m2 = (n: number | null | undefined) =>
  n == null || !Number.isFinite(Number(n)) || Number(n) <= 0 ? '—' : `${Math.round(Number(n)).toLocaleString('es-CL')} m²`;

const STATUS_LABEL: Record<string, string> = {
  available: 'Disponible',
  reserved: 'Reservado',
  sold: 'Vendido',
};

const statusOf = (l: KitLot) => STATUS_LABEL[l.status ?? ''] ?? 'Por confirmar';

const sortLots = (lots: KitLot[]) =>
  [...lots].sort((a, b) => {
    const na = Number(String(a.lot_number ?? '').replace(/\D/g, ''));
    const nb = Number(String(b.lot_number ?? '').replace(/\D/g, ''));
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    return String(a.lot_number ?? '').localeCompare(String(b.lot_number ?? ''), 'es');
  });

export const projectPath = (p: KitProject, o: KitOptions = {}) =>
  o.path ?? projectCanonicalUrl(p).slice(SITE_URL.length);

export const projectActions = (project: KitProject, options: KitOptions = {}) => {
  const path = projectPath(project, options);
  const actions = [{ label: 'Ver proyecto y disponibilidad', url: path }];
  const lat = project.latitude;
  const lng = project.longitude;
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    actions.push({ label: 'Cómo llegar · Google Maps', url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` });
  }
  const digits = project.contact?.whatsapp?.replace(/\D/g, '');
  if (digits && /^\d{8,15}$/.test(digits)) {
    actions.push({ label: 'Consultar por WhatsApp', url: `https://wa.me/${digits}?text=${encodeURIComponent(`Hola, quiero información de ${project.name}.`)}` });
  }
  const email = project.contact?.email?.trim();
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) actions.push({ label: 'Escribir al equipo comercial', url: `mailto:${email}?subject=${encodeURIComponent(project.name)}` });
  return actions;
};

const toRing = (polygon: unknown): [number, number][] | null => {
  const raw = Array.isArray(polygon) ? polygon : null;
  if (!raw || raw.length < 3) return null;
  const ring = raw
    .map((pt) => {
      if (Array.isArray(pt) && pt.length >= 2) return [Number(pt[0]), Number(pt[1])] as [number, number];
      const o = pt as { lng?: number; lat?: number; longitude?: number; latitude?: number };
      const lng = o?.lng ?? o?.longitude;
      const lat = o?.lat ?? o?.latitude;
      return lng == null || lat == null ? null : ([Number(lng), Number(lat)] as [number, number]);
    })
    .filter((p): p is [number, number] => !!p && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (ring.length < 3) return null;
  const [f] = ring;
  const last = ring[ring.length - 1];
  if (f[0] !== last[0] || f[1] !== last[1]) ring.push(f);
  return ring.map(([lng, lat]) => [Number(lng.toFixed(5)), Number(lat.toFixed(5))]);
};

const centerOf = (project: KitProject, lots: KitLot[]) => {
  if (project.latitude != null && project.longitude != null) {
    return { lng: Number(project.longitude), lat: Number(project.latitude) };
  }
  const pts = lots
    .filter((l) => l.latitude != null && l.longitude != null)
    .map((l) => [Number(l.longitude), Number(l.latitude)] as [number, number]);
  if (!pts.length) return null;
  return {
    lng: pts.reduce((s, p) => s + p[0], 0) / pts.length,
    lat: pts.reduce((s, p) => s + p[1], 0) / pts.length,
  };
};

/** Codifica un número en el formato polyline de Google/Mapbox (precisión 5). */
const encodeNumber = (value: number): string => {
  let num = value < 0 ? ~(value << 1) : value << 1;
  let out = '';
  while (num >= 0x20) {
    out += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }
  return out + String.fromCharCode(num + 63);
};

/** Convierte un anillo [lng,lat][] en polyline codificada. */
const encodeRing = (ring: [number, number][]): string => {
  const pts = [...ring];
  if (pts.length && (pts[0][0] !== pts[pts.length - 1][0] || pts[0][1] !== pts[pts.length - 1][1])) {
    pts.push(pts[0]);
  }
  let lat = 0;
  let lng = 0;
  let out = '';
  for (const [x, y] of pts) {
    const la = Math.round(y * 1e5);
    const ln = Math.round(x * 1e5);
    out += encodeNumber(la - lat) + encodeNumber(ln - lng);
    lat = la;
    lng = ln;
  }
  return out;
};

/** URL de mapa satelital estático con los polígonos del loteo. */
export const buildProjectMapUrl = (
  project: KitProject,
  lots: KitLot[],
  token: string,
  size: { w: number; h: number } = { w: 900, h: 560 }
): string | null => {
  const center = centerOf(project, lots);
  const rings = lots.map((l) => toRing(l.polygon)).filter(Boolean) as [number, number][][];

  let overlay = '';
  if (rings.length) {
    // Polyline codificada: ~7x más compacto que GeoJSON, permite dibujar todo el loteo.
    let used = rings.map((ring, i) => {
      const status = lots[i]?.status ?? 'available';
      const fill = status === 'available' ? '0.25' : '0.1';
      return `path-1.2+22c55e-1+22c55e-${fill}(${encodeURIComponent(encodeRing(ring))})`;
    });
    overlay = used.join(',');
    while (overlay.length > 6800 && used.length > 1) {
      used = used.filter((_, i) => i % 2 === 0);
      overlay = used.join(',');
    }
    if (overlay.length > 6800) overlay = '';
  }
  if (!overlay) {
    if (!center) return null;
    overlay = `pin-l+22c55e(${center.lng},${center.lat})`;
  }

  const view = rings.length ? 'auto' : `${center!.lng},${center!.lat},13,0`;
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${overlay}/${view}/${size.w}x${size.h}@2x?padding=40&access_token=${token}`;
};


/** Tabla simple con cabecera de marca y filas zebra. */
const table = (
  f: FichaDoc,
  headers: string[],
  rows: string[][],
  widths: number[],
  align: ('left' | 'right')[] = []
) => {
  const { doc, margin, contentW } = f;
  const cols = widths.map((w) => (w / widths.reduce((a, b) => a + b, 0)) * contentW);
  const rowH = 6.2;

  const head = () => {
    f.ensure(rowH * 3);
    doc.setFillColor(...BRAND.forest);
    doc.rect(margin, f.y, contentW, rowH, 'F');
    doc.setFontSize(7.5);
    doc.setFont(themeFont('heading'), 'bold');
    doc.setTextColor(255, 255, 255);
    let x = margin;
    headers.forEach((h, i) => {
      const right = align[i] === 'right';
      doc.text(h, right ? x + cols[i] - 3 : x + 3, f.y + 4.2, { align: right ? 'right' : 'left' });
      x += cols[i];
    });
    f.y += rowH;
  };

  head();
  rows.forEach((r, idx) => {
    if (f.y + rowH > f.H - 24) {
      f.newPage();
      head();
    }
    if (idx % 2 === 1) {
      doc.setFillColor(...BRAND.soft);
      doc.rect(margin, f.y, contentW, rowH, 'F');
    }
    doc.setFontSize(7.5);
    doc.setFont(themeFont('body'), 'normal');
    doc.setTextColor(...BRAND.dark);
    let x = margin;
    r.forEach((cell, i) => {
      const right = align[i] === 'right';
      const text = doc.splitTextToSize(cell, cols[i] - 6)[0] ?? '';
      doc.text(text, right ? x + cols[i] - 3 : x + 3, f.y + 4.2, { align: right ? 'right' : 'left' });
      x += cols[i];
    });
    f.y += rowH;
  });
  f.y += 5;
};

export const summarize = (lots: KitLot[]) => {
  const priced = lots.filter((l) => l.status === 'available' && Number.isFinite(Number(l.price)) && Number(l.price) > 0).map((l) => Number(l.price));
  const areas = lots.filter((l) => Number.isFinite(Number(l.area)) && Number(l.area) > 0).map((l) => Number(l.area));
  const count = (s: string) => lots.filter((l) => l.status === s).length;
  return {
    total: lots.length,
    available: count('available'),
    reserved: count('reserved'),
    sold: count('sold'),
    priceMin: priced.length ? Math.min(...priced) : null,
    priceMax: priced.length ? Math.max(...priced) : null,
    areaMin: areas.length ? Math.min(...areas) : null,
    areaMax: areas.length ? Math.max(...areas) : null,
    areaTotal: areas.reduce((a, b) => a + b, 0),
  };
};

const conditionLines = (project: KitProject): string[] => {
  const c = project.conditions;
  if (!c) return [];
  const out: string[] = [];
  if (c.reservation_deposit) out.push(`Reserva desde ${clp(c.reservation_deposit)}.`);
  if (c.min_down_payment_pct) out.push(`Pie mínimo ${c.min_down_payment_pct}%.`);
  if (c.max_term_months) out.push(`Financiamiento directo hasta ${c.max_term_months} meses.`);
  if (c.interest_rate != null) out.push(`Tasa referencial ${c.interest_rate}%. Confirmar periodicidad con el equipo comercial.`);
  if (c.includes_urbanization) out.push('Precio incluye urbanización comprometida.');
  if (c.delivery_date) out.push(`Entrega estimada: ${c.delivery_date}.`);
  if (c.payment_methods?.length) out.push(`Medios de pago: ${c.payment_methods.join(', ')}.`);
  return out;
};

const safeName = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ------------------------------------------------------------------ */
/* Plano vectorial del loteo                                            */
/* ------------------------------------------------------------------ */

export const planLotsOf = (lots: KitLot[]): PlanLot[] =>
  lots
    .map((l) => ({ ring: toRing(l.polygon), label: String(l.lot_number ?? ''), state: normalizeLotState(l.status) }))
    .filter((l): l is PlanLot => !!l.ring && l.ring.length >= 4);

const planStyle = (onSatellite: boolean): MasterplanStyle => ({
  available: BRAND.leaf,
  reserved: [224, 164, 58],
  sold: onSatellite ? [20, 26, 18] : BRAND.gray,
  outline: onSatellite ? [255, 255, 255] : BRAND.forest,
  labelDark: BRAND.forest,
  paper: BRAND.soft,
  font: themeFont('body'),
  fontBold: themeFont('heading') === 'montserrat' ? 'montserrat' : themeFont('heading'),
});

interface PreparedPlan {
  lots: PlanLot[];
  roads: PlanRoad[];
  view: MapView;
  image: string | null;
  satelliteSource: 'sentinel' | 'mapbox' | null;
  sentinelDate: string | null;
  sentinelCloudCover: number | null;
}

const planRoadsOf = (project: KitProject): PlanRoad[] =>
  (project.spatial?.roads_geojson?.features ?? [])
    .map((feature) => ({
      line: (feature.geometry?.coordinates ?? [])
        .map((p) => [Number(p[0]), Number(p[1])] as [number, number])
        .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])),
      label: typeof feature.properties?.name === 'string' ? feature.properties.name : undefined,
    }))
    .filter((road) => road.line.length >= 2);

/** Encuadre + imagen satelital (sin overlays) para una caja dada. */
const preparePlan = async (
  project: KitProject,
  lots: KitLot[],
  box: Box,
  token?: string | null,
  sentinelImagery?: SentinelImageryResult | null,
): Promise<PreparedPlan | null> => {
  const planLots = planLotsOf(lots);
  const { wPx, hPx } = imageSizeForBox(box);
  let frame = planLots.map((l) => l.ring);
  if (!frame.length) {
    // No drawn boundaries: still deliver the satellite view around the project centre.
    const c = centerOf(project, lots);
    if (!c) return null;
    const dLat = 0.004, dLng = 0.004 / Math.max(0.2, Math.cos((c.lat * Math.PI) / 180));
    frame = [[[c.lng - dLng, c.lat - dLat], [c.lng + dLng, c.lat - dLat], [c.lng + dLng, c.lat + dLat], [c.lng - dLng, c.lat + dLat], [c.lng - dLng, c.lat - dLat]]];
  }
  const view = fitView(frame, wPx, hPx);
  if (!view) return null;

  let image: string | null = null;
  let satelliteSource: PreparedPlan['satelliteSource'] = null;

  if (sentinelImagery?.available) {
    image = await renderSentinelMapViewSnapshot(view, sentinelImagery, { mapboxToken: token });
    if (image) satelliteSource = 'sentinel';
  }
  if (!image && token) {
    image = await fetchImageAsBase64(staticImageUrl(view, token));
    if (image) satelliteSource = 'mapbox';
  }

  return {
    lots: planLots,
    roads: planRoadsOf(project),
    view,
    image,
    satelliteSource,
    sentinelDate: sentinelImagery?.acquisition_datetime ?? null,
    sentinelCloudCover: sentinelImagery?.cloud_cover ?? null,
  };
};

const STATE_LABEL: Record<Exclude<LotState, 'other'>, string> = {
  available: 'Disponible',
  reserved: 'Reservada',
  sold: 'Vendida',
};

const drawSelectedLotOutline = (
  f: FichaDoc,
  plan: PreparedPlan,
  box: Box,
  lotLabel?: string | null,
) => {
  if (!lotLabel) return;
  const selected = plan.lots.find((lot) => lot.label === lotLabel);
  if (!selected || selected.ring.length < 3) return;

  const pts = selected.ring.map(([lng, lat]) => projectToBox(lng, lat, plan.view, box));
  const first = pts[0];
  const deltas = pts.slice(1).map((point, index) => [
    point[0] - pts[index][0],
    point[1] - pts[index][1],
  ] as [number, number]);

  const { doc } = f;
  doc.saveGraphicsState();
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.8);
  doc.lines(deltas, first[0], first[1], [1, 1], 'S', true);
  doc.setDrawColor(246, 198, 78);
  doc.setLineWidth(0.9);
  doc.lines(deltas, first[0], first[1], [1, 1], 'S', true);
  doc.restoreGraphicsState();
};

/** Dibuja plano + marco + leyenda con conteos. Devuelve el alto usado. */
const drawPlanBlock = (
  f: FichaDoc,
  plan: PreparedPlan,
  box: Box,
  selectedLotLabel?: string | null,
): number => {
  const { doc } = f;
  const style = planStyle(Boolean(plan.image));
  const counts = drawMasterplan(doc, plan.lots, plan.view, box, style, plan.image, plan.roads);
  drawSelectedLotOutline(f, plan, box, selectedLotLabel);
  doc.setDrawColor(...BRAND.line);
  doc.setLineWidth(0.4);
  doc.roundedRect(box.x, box.y, box.w, box.h, 2, 2, 'S');

  // Legend chips
  let lx = box.x;
  const ly = box.y + box.h + 5;
  (['available', 'reserved', 'sold'] as const).forEach((state) => {
    if (!counts[state]) return;
    const fill = state === 'available' ? style.available : state === 'reserved' ? style.reserved : BRAND.gray;
    const text = `${STATE_LABEL[state]} · ${counts[state]}`;
    doc.setFont(semiboldFont(), 'normal');
    doc.setFontSize(8);
    const w = doc.getTextWidth(text) + 12;
    doc.setFillColor(...BRAND.soft);
    doc.setDrawColor(...BRAND.line);
    doc.roundedRect(lx, ly, w, 7, 3.5, 3.5, 'FD');
    doc.setFillColor(...fill);
    doc.circle(lx + 4, ly + 3.5, 1.6, 'F');
    doc.setTextColor(...BRAND.dark);
    doc.text(text, lx + 7, ly + 4.8);
    lx += w + 3;
  });
  doc.setFont(themeFont('body'), 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...BRAND.gray);
  const satelliteAttribution = plan.satelliteSource === 'sentinel'
    ? ` · Sentinel-2 ${formatSentinelDate(plan.sentinelDate)} · ${sentinelCloudLabel(plan.sentinelCloudCover)} · Microsoft Planetary Computer`
    : plan.satelliteSource === 'mapbox'
      ? ' · © Mapbox · © Maxar'
      : '';
  doc.text(
    plan.image
      ? `Deslindes referenciales sobre imagen satelital${plan.roads.length ? ' · caminos/servidumbres KMZ' : ''}${satelliteAttribution}`
      : `Deslindes referenciales${plan.roads.length ? ' · caminos/servidumbres KMZ' : ''}`,
    box.x + box.w, ly + 4.6, { align: 'right' },
  );
  return box.h + 14;
};

/* ------------------------------------------------------------------ */
/* Portada                                                              */
/* ------------------------------------------------------------------ */

const withOpacity = (f: FichaDoc, opacity: number, draw: () => void) => {
  const { doc } = f;
  const GState = (doc as unknown as { GState: new (o: { opacity: number }) => unknown }).GState;
  doc.saveGraphicsState();
  try {
    if (GState) doc.setGState(new GState({ opacity }) as Parameters<typeof doc.setGState>[0]);
    draw();
  } finally {
    doc.restoreGraphicsState();
  }
};

const drawCover = async (
  f: FichaDoc,
  o: {
    project: KitProject; s: ReturnType<typeof summarize>; hero: string | null; heroCaption?: string;
    location: string; path: string; agendarUrl: string;
  },
) => {
  const { doc, W, H, margin, contentW } = f;
  const heroH = 158;

  doc.setFillColor(...BRAND.forest);
  doc.rect(0, 0, W, H, 'F');
  if (o.hero) {
    try { fittedImage(doc, o.hero, 0, 0, W, heroH, 'cover'); } catch { /* sin hero */ }
    withOpacity(f, 0.18, () => { doc.setFillColor(...BRAND.forest); doc.rect(0, 0, W, heroH, 'F'); });
    // Fade hero → forest (jsPDF has no gradients: stacked bands).
    const steps = 14;
    for (let i = 0; i < steps; i++) {
      withOpacity(f, (i + 1) / steps, () => {
        doc.setFillColor(...BRAND.forest);
        doc.rect(0, heroH - 42 + (i * 42) / steps, W, 42 / steps + 0.3, 'F');
      });
    }
  }

  // Illustrative/satellite heroes must say so, like every gallery image.
  if (o.hero && o.heroCaption) {
    doc.setFont(themeFont('body'), 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...BRAND.paper);
    doc.text(o.heroCaption, W - margin, heroH - 4, { align: 'right' });
  }

  // Logo on a translucent chip for legibility over any photo.
  withOpacity(f, 0.72, () => { doc.setFillColor(...BRAND.forest); doc.roundedRect(margin - 3, 9, 72, 17, 8.5, 8.5, 'F'); });
  drawBrandLogo(doc, margin, 12, { size: 11 });

  let y = heroH + 6;
  doc.setFont(scriptFont(), 'normal');
  doc.setFontSize(f.brandFonts ? 22 : 10);
  doc.setTextColor(...BRAND.leaf);
  doc.text(f.brandFonts ? 'dossier comercial' : 'DOSSIER COMERCIAL', margin, y);
  y += 11;

  doc.setFont(themeFont('heading'), 'bold');
  let titleSize = 32;
  doc.setFontSize(titleSize);
  let lines: string[] = doc.splitTextToSize(o.project.name, contentW);
  while (lines.length > 2 && titleSize > 20) {
    titleSize -= 2;
    doc.setFontSize(titleSize);
    lines = doc.splitTextToSize(o.project.name, contentW);
  }
  lines = lines.slice(0, 2);
  doc.setTextColor(255, 255, 255);
  doc.text(lines, margin, y);
  y += lines.length * titleSize * 0.3528 * 1.1 + 1;

  if (o.location) {
    doc.setFont(themeFont('body'), 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.paper);
    doc.text(o.location, margin, y);
    y += 10;
  }

  // Stat chips
  const stats: [string, string][] = [
    ['Disponibles', `${o.s.available} de ${o.s.total}`],
    ['Precio desde', clp(o.s.priceMin)],
    ['Superficies', o.s.areaMin ? `${m2(o.s.areaMin).replace(' m²', '')}–${m2(o.s.areaMax)}` : '—'],
  ];
  const chipW = (contentW - 8) / 3;
  stats.forEach(([label, value], i) => {
    const x = margin + i * (chipW + 4);
    doc.setFillColor(...BRAND.accent);
    doc.setDrawColor(...BRAND.leaf);
    doc.setLineWidth(0.35);
    doc.roundedRect(x, y, chipW, 20, 4, 4, 'FD');
    doc.setFont(semiboldFont(), 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...BRAND.leaf);
    doc.setCharSpace(0.25);
    doc.text(label.toUpperCase(), x + 5, y + 7);
    doc.setCharSpace(0);
    doc.setFont(themeFont('heading'), 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(doc.splitTextToSize(value, chipW - 9)[0], x + 5, y + 15);
  });
  y += 30;

  // Primary CTA + project link
  const origin = getPublicOrigin();
  const agenda = safePdfLink(o.agendarUrl, origin);
  doc.setFillColor(...BRAND.leaf);
  doc.roundedRect(margin, y, 62, 13, 6.5, 6.5, 'F');
  doc.setFont(themeFont('heading'), 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.forest);
  doc.text('Agenda tu reunión', margin + 31, y + 8.3, { align: 'center' });
  if (agenda) doc.link(margin, y, 62, 13, { url: agenda });
  doc.setFont(themeFont('body'), 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.paper);
  const projectUrl = publicUrl(o.path);
  doc.text(projectUrl.replace(/^https?:\/\//, ''), margin + 68, y + 8.3);
  const link = safePdfLink(projectUrl, origin);
  if (link) doc.link(margin + 68, y + 3, 80, 7, { url: link });

  // QR bottom-right
  try {
    const qr = await QRCode.toDataURL(projectUrl, { margin: 1, width: 360, color: { dark: '#203D27', light: '#F7F1E1' } });
    const size = 30;
    const qx = W - margin - size;
    const qy = H - margin - size - 8;
    doc.setFillColor(...BRAND.soft);
    doc.roundedRect(qx - 3, qy - 3, size + 6, size + 6, 3, 3, 'F');
    doc.addImage(qr, 'PNG', qx, qy, size, size);
    if (link) doc.link(qx - 3, qy - 3, size + 6, size + 6, { url: link });
    doc.setFont(themeFont('body'), 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.paper);
    doc.text('Disponibilidad en línea', qx + size / 2, qy + size + 8, { align: 'center' });
  } catch { /* QR opcional */ }

  doc.setFont(themeFont('body'), 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...BRAND.leaf);
  doc.text(`ofertaterrenos.com · Material generado el ${new Date().toLocaleDateString('es-CL')}`, margin, H - margin);
};

/* ------------------------------------------------------------------ */
/* Tabla compacta en dos columnas                                       */
/* ------------------------------------------------------------------ */

const twoColumnTable = (f: FichaDoc, headers: string[], rows: string[][], widths: number[], align: ('left' | 'right')[]) => {
  const { doc, margin, contentW, H } = f;
  const gap = 6;
  const colW = (contentW - gap) / 2;
  const cols = widths.map((w) => (w / widths.reduce((a, b) => a + b, 0)) * colW);
  const rowH = 6;
  const bottom = H - 24;

  const head = (x: number, y: number) => {
    doc.setFillColor(...BRAND.forest);
    doc.roundedRect(x, y, colW, rowH, 1.5, 1.5, 'F');
    doc.setFont(semiboldFont(), 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    let cx = x;
    headers.forEach((h, i) => {
      const right = align[i] === 'right';
      doc.text(h, right ? cx + cols[i] - 3 : cx + 3, y + 4.1, { align: right ? 'right' : 'left' });
      cx += cols[i];
    });
  };
  const row = (x: number, y: number, r: string[], zebra: boolean) => {
    if (zebra) { doc.setFillColor(...BRAND.soft); doc.rect(x, y, colW, rowH, 'F'); }
    doc.setFont(themeFont('body'), 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.dark);
    let cx = x;
    r.forEach((cell, i) => {
      const right = align[i] === 'right';
      if (i === 0) doc.setFont(themeFont('heading'), 'bold');
      doc.text(cell, right ? cx + cols[i] - 3 : cx + 3, y + 4.1, { align: right ? 'right' : 'left' });
      if (i === 0) doc.setFont(themeFont('body'), 'normal');
      cx += cols[i];
    });
  };

  let i = 0;
  while (i < rows.length) {
    f.ensure(rowH * 3);
    const top = f.y;
    const perCol = Math.max(1, Math.floor((bottom - top - rowH) / rowH));
    let maxY = top;
    for (let c = 0; c < 2 && i < rows.length; c++) {
      const x = margin + c * (colW + gap);
      head(x, top);
      let y = top + rowH;
      for (let k = 0; k < perCol && i < rows.length; k++, i++) {
        row(x, y, rows[i], k % 2 === 1);
        y += rowH;
      }
      maxY = Math.max(maxY, y);
    }
    f.y = maxY + 4;
    if (i < rows.length) f.newPage();
  }
};

/** Pasos numerados en círculos (proceso de compra). */
const purchaseSteps = (f: FichaDoc, steps: [string, string][]) => {
  const { doc, margin, contentW } = f;
  steps.forEach(([title, text], i) => {
    doc.setFont(themeFont('body'), 'normal');
    doc.setFontSize(8.5);
    const lines: string[] = doc.splitTextToSize(text, contentW - 16);
    const h = Math.max(12, 6 + lines.length * 4.2);
    f.ensure(h + 2);
    const y = f.y;
    doc.setFillColor(...BRAND.forest);
    doc.circle(margin + 4.5, y + 4.5, 4.5, 'F');
    doc.setFont(themeFont('heading'), 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.leaf);
    doc.text(String(i + 1), margin + 4.5, y + 6, { align: 'center' });
    doc.setTextColor(...BRAND.forest);
    doc.setFontSize(10);
    doc.text(title, margin + 13, y + 4);
    doc.setFont(themeFont('body'), 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND.dark);
    doc.text(lines, margin + 13, y + 9);
    f.y = y + h + 2;
  });
  f.y += 3;
};

/* ------------------------------------------------------------------ */
/* Dossier comercial                                                    */
/* ------------------------------------------------------------------ */

export const agendarPath = (project: KitProject) =>
  `/agendar?source=${encodeURIComponent(`dossier-${project.slug ?? project.id}`)}`;

/** Dossier comercial completo del proyecto (identidad de marca). */
export const generateProjectDossierPdf = async (
  project: KitProject,
  lots: KitLot[],
  options: KitOptions = {}
) => {
  await ensureFichaFonts();
  const s = summarize(lots);
  const path = projectPath(project, options);
  const location = [project.location, project.region].filter(Boolean).join(', ');
  const t = getFichaTemplate('proyecto');

  // Load concurrently, bounded to five assets. No invented replacement photos.
  const configuredMedia = [...(project.media ?? []), ...(project.images ?? []).map(src => ({ src, caption: 'Imagen del proyecto · referencial' }))].filter(item => item.src);
  const sourceMedia = configuredMedia.length ? configuredMedia : referenceProjectMedia(project.slug);
  const uniqueMedia = sourceMedia.filter((item, i, all) => item.src && all.findIndex(other => other.src === item.src) === i).slice(0, 5);

  const f = createFichaDoc({ footerNote: t.footerNote, cover: true });
  const planBox: Box = { x: f.margin, y: f.margin + 11 + 16, w: f.contentW, h: f.H - (f.margin + 11 + 16) - 42 };
  const [loaded, plan] = await Promise.all([
    Promise.all(uniqueMedia.map(async item => ({ ...item, data: await fetchImageAsBase64(item.src) }))),
    preparePlan(project, lots, planBox, options.mapboxToken, options.sentinelImagery),
  ]);
  const media = loaded.filter((item): item is typeof item & { data: string } => Boolean(item.data));

  f.doc.setProperties({ title: `Dossier · ${project.name}`, author: 'OFERTA TERRENOS', subject: 'Dossier comercial' });
  await drawCover(f, {
    project, s, location, path,
    hero: media[0]?.data ?? plan?.image ?? null,
    heroCaption: media[0]?.caption ?? (plan?.image ? 'Imagen satelital del sector · referencial' : undefined),
    agendarUrl: agendarPath(project),
  });

  // ---- El proyecto
  f.newPage();
  if (options.editorial?.headline) f.paragraph(options.editorial.headline, { size: 13, color: BRAND.forest });
  f.section('El proyecto');
  if (options.editorial?.pitch || project.description) f.paragraph(options.editorial?.pitch || project.description!, { size: 9.5 });
  f.kpis(
    [
      ['Parcelas', String(s.total), `${s.available} disponibles`],
      ['Superficies', s.areaMin ? `${m2(s.areaMin)} – ${m2(s.areaMax)}` : '—', s.areaTotal ? `Total ${(s.areaTotal / 10000).toFixed(1)} ha` : undefined],
      ['Precio desde', clp(s.priceMin), s.priceMax ? `Hasta ${clp(s.priceMax)}` : undefined],
      ['Ubicación', location || '—', 'Chile'],
    ] as [string, string, string?][],
    2
  );
  if (project.highlights?.length) {
    f.section('Destacados');
    f.bullets(project.highlights.slice(0, 8));
  }
  const gallery = media.slice(media[0] ? 1 : 0);
  if (gallery.length) {
    f.ensure(80);
    f.section('Galería del proyecto y entorno');
    f.gallery(gallery);
  }
  if (loaded.some(item => !item.data)) f.note('Algunas imágenes no pudieron cargarse. Puedes revisar la galería completa en la ficha online.');
  for (const section of options.editorial?.sections ?? []) {
    f.section(section.title);
    f.paragraph(section.text);
  }
  if (options.editorial?.projection) {
    f.section('Escenario orientativo');
    f.paragraph(options.editorial.projection);
    f.note('Texto asistido por IA: sus proyecciones requieren revisión comercial y no garantizan rentabilidad.');
  }
  if (options.editorial?.specs?.length) {
    f.section('Ficha técnica');
    options.editorial.specs.forEach(spec => f.kv(spec.label, spec.value));
  }
  if (project.pois?.length) {
    f.section('Entorno y accesos');
    f.bullets(project.pois.slice(0, 10).map((p) => `${p.name} — ${p.detail}`));
  }
  const conds = conditionLines(project);
  if (conds.length) {
    f.section('Condiciones comerciales');
    f.bullets(conds);
  }

  // ---- Plano del loteo (página completa)
  if (plan) {
    f.newPage();
    f.section('Plano del loteo');
    const box = { ...planBox, y: f.y, h: f.H - f.y - 42 };
    f.y += drawPlanBlock(f, plan, box);
  }

  // ---- Parcelas disponibles (todas)
  const available = sortLots(lots.filter((l) => normalizeLotState(l.status) === 'available'));
  if (available.length) {
    f.newPage();
    f.section(`Parcelas disponibles · ${available.length}`);
    twoColumnTable(
      f,
      ['N°', 'Superficie', 'Precio', '$/m²'],
      available.map((l) => [
        l.lot_number ?? '—',
        m2(l.area),
        clp(l.price),
        l.price && l.area ? clp(Number(l.price) / Number(l.area)) : '—',
      ]),
      [12, 26, 30, 20],
      ['left', 'right', 'right', 'right'],
    );
  }

  // ---- Cómo comprar (mismos pasos de cierre que registra la plataforma)
  f.ensure(80);
  f.section('Cómo comprar tu parcela');
  purchaseSteps(f, [
    ['Reserva', 'Eliges tu parcela y la reservas en línea o con tu ejecutivo; queda bloqueada para ti.'],
    ['Promesa', 'Firmamos la promesa de compraventa con las condiciones de pago acordadas.'],
    ['Escritura', 'Firma de la escritura pública de compraventa en notaría.'],
    ['Inscripción', 'Inscripción en el Conservador de Bienes Raíces: la parcela queda a tu nombre.'],
  ]);

  // ---- Cierre
  f.ensure(70);
  f.section('Agenda tu reunión');
  f.paragraph('Conversemos por videollamada o visita el proyecto: te mostramos las parcelas disponibles, las formas de pago y el paso a paso de la reserva a la escritura.', { size: 9.5 });
  f.actions([{ label: 'Agenda tu reunión', url: agendarPath(project) }, ...projectActions(project, options)]);
  if (project.contact?.phone) f.kv('Teléfono', project.contact.phone);
  if (project.contact?.whatsapp) f.kv('WhatsApp', project.contact.whatsapp);
  if (project.contact?.email) f.kv('Email', project.contact.email);
  f.kv('Ficha online', `ofertaterrenos.com${path}`);
  f.note(t.disclaimer({ date: new Date().toLocaleDateString('es-CL') }));

  const filename = `Dossier-${safeName(project.name)}.pdf`;
  if (options.output === 'blob') return f.blob();
  f.save(filename);
};

/** Lista de precios completa, una fila por parcela. */
export const generateProjectPriceListPdf = async (
  project: KitProject,
  lots: KitLot[],
  options: KitOptions = {}
) => {
  const s = summarize(lots);
  const path = projectPath(project, options);

  return renderFicha({
    template: 'proyecto',
    eyebrow: 'Lista de precios',
    title: project.name,
    subtitle: `Vigente al ${new Date().toLocaleDateString('es-CL')}`,
    qrUrl: path,
    filename: `Lista-Precios-${safeName(project.name)}.pdf`,
    output: options.output,
    body: (f) => {
      f.kpis(
        [
          ['Parcelas', String(s.total), `${s.available} disponibles`],
          ['Precio desde', clp(s.priceMin), s.priceMax ? `Hasta ${clp(s.priceMax)}` : undefined],
        ] as [string, string, string?][],
        2
      );
      table(
        f,
        ['Parcela', 'Superficie', 'Precio', '$/m²', 'Estado'],
        sortLots(lots).map((l) => [
          l.lot_number ?? '—',
          m2(l.area),
          clp(l.price),
          l.price && l.area ? clp(Number(l.price) / Number(l.area)) : '—',
          statusOf(l),
        ]),
        [20, 26, 30, 22, 22],
        ['left', 'right', 'right', 'right', 'left']
      );
      f.actions(projectActions(project, options));
    },
  });
};

/** Lámina del plano con la numeración de parcelas. */
export const generateProjectMasterplanPdf = async (
  project: KitProject,
  lots: KitLot[],
  options: KitOptions = {}
) => {
  const path = projectPath(project, options);
  return renderFicha({
    template: 'proyecto',
    eyebrow: 'Plano del loteo',
    title: project.name,
    subtitle: [project.location, project.region].filter(Boolean).join(', ') || undefined,
    qrUrl: path,
    filename: `Plano-${safeName(project.name)}.pdf`,
    output: options.output,
    body: async (f) => {
      // Plano a toda la altura útil: los botones van al final del documento.
      const box: Box = { x: f.margin, y: f.y, w: f.contentW, h: f.H - f.y - 40 };
      const plan = await preparePlan(project, lots, box, options.mapboxToken, options.sentinelImagery);
      if (plan) f.y += drawPlanBlock(f, plan, box);
      else f.note('No hay deslindes cargados para dibujar el plano. Consulta el plano interactivo en la ficha online.');

      f.section('Cuadro de superficies');
      table(
        f,
        ['Parcela', 'Superficie', 'Estado'],
        sortLots(lots).map((l) => [l.lot_number ?? '—', m2(l.area), statusOf(l)]),
        [24, 30, 26],
        ['left', 'right', 'left']
      );
      f.actions([{ label: 'Agenda tu reunión', url: agendarPath(project) }, ...projectActions(project, options)]);
    },
  });
};

/** Lista de precios en CSV (abre en Excel con acentos correctos). */
export const exportProjectPriceListCsv = (project: KitProject, lots: KitLot[]) => {
  const headers = ['Parcela', 'Superficie m2', 'Precio CLP', 'Precio m2 CLP', 'Estado'];
  const rows = sortLots(lots).map((l) => [
    l.lot_number ?? '',
    l.area != null ? Math.round(Number(l.area)) : '',
    l.price != null ? Math.round(Number(l.price)) : '',
    l.price && l.area ? Math.round(Number(l.price) / Number(l.area)) : '',
    statusOf(l),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Lista-Precios-${safeName(project.name)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/** Compendio: una ficha por parcela en un solo PDF (uso interno/comercial). */
export const generateProjectLotSheetsPdf = async (
  project: KitProject,
  lots: KitLot[],
  options: KitOptions = {}
) => {
  const path = projectPath(project, options);
  const ordered = sortLots(lots);

  return renderFicha({
    template: 'proyecto',
    eyebrow: 'Fichas de parcelas',
    title: project.name,
    subtitle: `${ordered.length} parcelas · ${new Date().toLocaleDateString('es-CL')}`,
    qrUrl: path,
    filename: `Fichas-Parcelas-${safeName(project.name)}.pdf`,
    output: options.output,
    body: async (f) => {
      // One shared current satellite background per project keeps large
      // 100–200-lot compendia efficient; each page highlights its own parcel.
      const templateBox: Box = { x: 0, y: 0, w: 170, h: 80 };
      const plan = await preparePlan(
        project,
        lots,
        templateBox,
        options.mapboxToken,
        options.sentinelImagery,
      );

      ordered.forEach((l, i) => {
        if (i > 0) f.newPage();
        f.section(`Parcela ${l.lot_number ?? i + 1}`);
        f.kpis(
          [
            ['Superficie', m2(l.area)],
            ['Precio', clp(l.price)],
            ['Precio m²', l.price && l.area ? clp(Number(l.price) / Number(l.area)) : '—'],
            ['Estado', statusOf(l)],
          ] as [string, string, string?][],
          2
        );

        if (plan) {
          const mapH = f.contentW * (templateBox.h / templateBox.w);
          f.ensure(mapH + 18);
          const mapBox: Box = { x: f.margin, y: f.y, w: f.contentW, h: mapH };
          f.y += drawPlanBlock(f, plan, mapBox, String(l.lot_number ?? ''));
        }

        if (l.latitude != null && l.longitude != null) {
          f.kv('Coordenadas', `${Number(l.latitude).toFixed(5)}, ${Number(l.longitude).toFixed(5)}`);
        }
        f.kv('Proyecto', project.name);
        f.kv('Ficha online', `ofertaterrenos.com${path}`);
        f.actions(projectActions(project, options));
      });
    },
  });
};
