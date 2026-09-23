import { BRAND, fetchImageAsBase64, themeFont } from '@/lib/pdf/fichaShell';
import { renderFicha } from '@/lib/pdf/fichaTemplates';
import type { FichaDoc } from '@/lib/pdf/fichaShell';
import { projectCanonicalUrl, SITE_URL } from '@/lib/landing/paths';
import { referenceProjectMedia } from './projectMedia';

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
}

export interface KitOptions {
  mapboxToken?: string | null;
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

/** Dossier comercial completo del proyecto. */
export const generateProjectDossierPdf = async (
  project: KitProject,
  lots: KitLot[],
  options: KitOptions = {}
) => {
  const s = summarize(lots);
  const path = projectPath(project, options);
  const location = [project.location, project.region].filter(Boolean).join(', ');

  // Load concurrently, bounded to five assets. No invented replacement photos.
  const configuredMedia = [...(project.media ?? []), ...(project.images ?? []).map(src => ({ src, caption: 'Imagen del proyecto · referencial' }))].filter(item => item.src);
  const sourceMedia = configuredMedia.length ? configuredMedia : referenceProjectMedia(project.slug);
  const uniqueMedia = sourceMedia.filter((item, i, all) => item.src && all.findIndex(other => other.src === item.src) === i).slice(0, 5);
  const loaded = await Promise.all(uniqueMedia.map(async item => ({ ...item, data: await fetchImageAsBase64(item.src) })));
  const media = loaded.filter((item): item is typeof item & { data: string } => Boolean(item.data));

  return renderFicha({
    template: 'proyecto',
    eyebrow: `Dossier comercial${location ? ` · ${location}` : ''}`,
    title: project.name,
    subtitle: location || undefined,
    qrUrl: path,
    filename: `Dossier-${safeName(project.name)}.pdf`,
    output: options.output,
    body: async (f) => {
      if (media[0]) f.image(media[0].data, f.contentW * 0.46, media[0].caption);
      if (loaded.some(item => !item.data)) f.note('Algunas imágenes no pudieron cargarse. Puedes revisar la galería completa en la ficha online.');
      f.actions(projectActions(project, options).slice(0, 2));

      f.kpis(
        [
          ['Parcelas', String(s.total), `${s.available} disponibles`],
          ['Superficies', s.areaMin ? `${m2(s.areaMin)} – ${m2(s.areaMax)}` : '—', s.areaTotal ? `Total ${(s.areaTotal / 10000).toFixed(1)} ha` : undefined],
          ['Precio desde', clp(s.priceMin), s.priceMax ? `Hasta ${clp(s.priceMax)}` : undefined],
          ['Ubicación', location || '—', 'Chile'],
        ] as [string, string, string?][],
        2
      );

      if (options.editorial?.headline) f.paragraph(options.editorial.headline, { size: 13 });
      if (options.editorial?.pitch || project.description) {
        f.section('El proyecto');
        f.paragraph(options.editorial?.pitch || project.description!);
      }

      if (media.length > 1) {
        f.ensure(80);
        f.section('Galería del proyecto y entorno');
        f.gallery(media.slice(1));
      }
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

      if (project.highlights?.length) {
        f.section('Destacados');
        f.bullets(project.highlights.slice(0, 8));
      }

      if (options.mapboxToken) {
        const url = buildProjectMapUrl(project, lots, options.mapboxToken);
        if (url) {
          const img = await fetchImageAsBase64(url);
          if (img) {
            f.ensure(f.contentW * (560 / 900) + 28);
            f.section('Plano del loteo');
            f.image(img, f.contentW * (560 / 900), 'Imagen satelital con los deslindes referenciales de las parcelas', 'PNG');
          }
        }
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

      const priced = sortLots(lots.filter((l) => l.status === 'available')).slice(0, 12);
      if (priced.length) {
        f.section('Parcelas disponibles (muestra)');
        table(
          f,
          ['Parcela', 'Superficie', 'Precio', '$/m²'],
          priced.map((l) => [
            l.lot_number ?? '—',
            m2(l.area),
            clp(l.price),
            l.price && l.area ? clp(Number(l.price) / Number(l.area)) : '—',
          ]),
          [22, 26, 30, 22],
          ['left', 'right', 'right', 'right']
        );
        if (s.available > priced.length) {
          f.paragraph(`Consulta las ${s.available} parcelas disponibles en la ficha online o descarga la lista de precios completa desde el proyecto.`);
        }
      }

      f.section('Contacto');
      f.actions(projectActions(project, options));
      if (project.contact?.phone) f.kv('Telefono', project.contact.phone);
      if (project.contact?.whatsapp) f.kv('WhatsApp', project.contact.whatsapp);
      if (project.contact?.email) f.kv('Email', project.contact.email);
      f.kv('Ficha online', `ofertaterrenos.com${path}`);
    },
  });
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
      let drew = false;
      if (options.mapboxToken) {
        const url = buildProjectMapUrl(project, lots, options.mapboxToken, { w: 900, h: 700 });
        if (url) {
          const img = await fetchImageAsBase64(url);
          if (img) {
            f.image(img, f.contentW * (700 / 900), 'Plano referencial sobre imagen satelital', 'PNG');
            drew = true;
          }
        }
      }
      if (!drew) f.note('No fue posible generar la imagen del plano en este momento. Consulta el plano interactivo en la ficha online.');
      f.actions(projectActions(project, options));

      f.section('Cuadro de superficies');
      table(
        f,
        ['Parcela', 'Superficie', 'Estado'],
        sortLots(lots).map((l) => [l.lot_number ?? '—', m2(l.area), statusOf(l)]),
        [24, 30, 26],
        ['left', 'right', 'left']
      );
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
    body: (f) => {
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
