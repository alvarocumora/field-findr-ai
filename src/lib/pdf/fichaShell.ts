import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { fetchPdfImage, fittedImage, safePdfLink } from './media';
import {
  getFichaTheme,
  themeRgb,
  type FichaThemeColors,
  type RGB,
} from '@/lib/pdf/fichaTheme';

/**
 * Sistema único de generación de fichas PDF (OFERTA TERRENOS).
 *
 * Todas las fichas del producto (lote, dossier, proyecto) se construyen con
 * este shell: logo vectorial de marca, cabecera, QR al link público,
 * pie de página con paginación y primitivas de contenido (secciones,
 * pares clave/valor, párrafos, viñetas, KPIs, imágenes).
 */

/**
 * Paleta de marca. Se resuelve en cada acceso desde el tema configurable
 * (/admin/branding-fichas), por lo que cambiar el branding no requiere código.
 */
export const BRAND = new Proxy({} as Record<keyof FichaThemeColors, RGB>, {
  get: (_t, key: string) => themeRgb(key as keyof FichaThemeColors),
}) as Record<keyof FichaThemeColors, RGB>;

/** Familia tipográfica activa del tema. */
export const themeFont = (kind: 'body' | 'heading' = 'body') => getFichaTheme().fonts[kind];

/** Origen público configurable (tema de fichas). */
export const getPublicOrigin = () => getFichaTheme().publicOrigin;

/** @deprecated usar getPublicOrigin() */
export const PUBLIC_ORIGIN = 'https://ofertaterrenos.com';

/** URL absoluta y estable para los QR de las fichas. */
export const publicUrl = (path: string) =>
  path.startsWith('http') ? path : `${getPublicOrigin()}${path.startsWith('/') ? path : `/${path}`}`;

export const fetchImageAsBase64 = fetchPdfImage;

/** Marca gráfica (hexágono + brújula) dibujada vectorialmente. */
export const drawBrandMark = (doc: jsPDF, x: number, y: number, size = 10) => {
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;
  const pts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  doc.setFillColor(...BRAND.emerald);
  doc.lines(
    pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]] as [number, number]).concat([
      [pts[0][0] - pts[5][0], pts[0][1] - pts[5][1]],
    ]),
    pts[0][0],
    pts[0][1],
    [1, 1],
    'F',
    true
  );
  doc.setDrawColor(...BRAND.white);
  doc.setLineWidth(size * 0.09);
  doc.circle(cx, cy, r * 0.44, 'S');
  doc.setLineWidth(0.2);
};

/** Logotipo completo: imagen del tema, o marca vectorial + wordmark. */
export const drawBrandLogo = (
  doc: jsPDF,
  x: number,
  y: number,
  opts: { size?: number; color?: [number, number, number] } = {}
) => {
  const theme = getFichaTheme();
  const size = opts.size ?? 10;
  const color = opts.color ?? BRAND.white;

  if (theme.logo.imageDataUrl) {
    try {
      const h = Math.min(theme.logo.imageHeight ?? size + 2, 14);
      const props = doc.getImageProperties(theme.logo.imageDataUrl);
      const scale = Math.min(h / props.height, 100 / props.width);
      doc.addImage(theme.logo.imageDataUrl, x, y, props.width * scale, props.height * scale);
      return;
    } catch {
      // si la imagen falla, se dibuja el logo vectorial
    }
  }

  // Match the portal's typographic logo; keep custom tenant wordmarks intact.
  const isDefault = theme.logo.primary === 'OFERTA' && theme.logo.secondary === 'TERRENOS';
  const primary = isDefault ? 'Oferta' : theme.logo.primary;
  const secondary = isDefault ? 'Terrenos' : ` ${theme.logo.secondary}`;
  doc.setTextColor(...color);
  doc.setFontSize(size * 1.9);
  doc.setFont(themeFont('heading'), 'bold');
  doc.text(primary, x, y + size * 0.72);
  let tx = x + doc.getTextWidth(primary);
  doc.setTextColor(...BRAND.emerald);
  doc.text(secondary, tx, y + size * 0.72);
  tx += doc.getTextWidth(secondary);
  if (isDefault) {
    doc.setFontSize(size * 1.05);
    doc.setTextColor(...color);
    doc.text('.com', tx, y + size * 0.72);
  }
};

export interface FichaHeaderOptions {
  /** Etiqueta pequeña sobre el título (ej: "FICHA DE LOTE"). */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Ruta o URL pública para el código QR. */
  qrUrl?: string;
  qrCaption?: string;
  /** Alto de la barra de cabecera en mm. */
  height?: number;
  color?: [number, number, number];
}

export interface FichaDoc {
  doc: jsPDF;
  W: number;
  H: number;
  margin: number;
  contentW: number;
  get y(): number;
  set y(v: number);
  ensure: (needed: number) => void;
  newPage: () => void;
  header: (o: FichaHeaderOptions) => Promise<void>;
  section: (title: string) => void;
  kv: (label: string, value: string) => void;
  paragraph: (text: string, opts?: { size?: number; color?: [number, number, number] }) => void;
  bullets: (items: string[]) => void;
  kpis: (items: [string, string, string?][], cols?: number) => void;
  card: (draw: (x: number, y: number, w: number) => number) => void;
  image: (base64: string, height: number, caption?: string, format?: string) => void;
  note: (text: string) => void;
  actions: (items: { label: string; url: string }[]) => void;
  gallery: (items: { data: string; caption: string }[]) => void;
  blob: () => Blob;
  save: (filename: string) => void;
}

export const createFichaDoc = (
  options: { footerNote?: string; margin?: number } = {}
): FichaDoc => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const W = 210;
  const H = 297;
  const margin = options.margin ?? 16;
  const contentW = W - margin * 2;
  const footerNote = options.footerNote ?? 'OFERTA TERRENOS · ofertaterrenos.com';
  let y = margin;
  let page = 1;

  const footer = () => {
    doc.setDrawColor(...BRAND.line);
    doc.setLineWidth(0.2);
    doc.line(margin, H - 16, W - margin, H - 16);
    doc.setFontSize(7.5);
    doc.setFont(themeFont('body'), 'normal');
    doc.setTextColor(...BRAND.gray);
    doc.text(doc.splitTextToSize(footerNote, contentW - 25)[0], margin, H - 11);
    doc.text(`Página ${page}`, W - margin, H - 11, { align: 'right' });
  };

  const newPage = () => {
    footer();
    doc.addPage();
    page += 1;
    drawBrandLogo(doc, margin, 7, { size: 6, color: BRAND.dark });
    y = margin + 9;
  };

  const ensure = (needed: number) => {
    if (y + needed > H - 22) newPage();
  };

  const api: FichaDoc = {
    doc,
    W,
    H,
    margin,
    contentW,
    get y() {
      return y;
    },
    set y(v: number) {
      y = v;
    },
    ensure,
    newPage,

    async header(o: FichaHeaderOptions) {
      const color = o.color ?? BRAND.forest;
      const barH = Math.max(o.height ?? 54, 62);
      const qrSize = 26;
      const hasQr = Boolean(o.qrUrl);
      const textW = contentW - (hasQr ? qrSize + 10 : 0);

      doc.setFillColor(...color);
      doc.rect(0, 0, W, barH, 'F');

      drawBrandLogo(doc, margin, 8, { size: 9 });
      doc.setProperties({ title: o.title, author: getFichaTheme().brandName, subject: o.eyebrow ?? 'Ficha comercial' });

      doc.setTextColor(255, 255, 255);
      if (o.eyebrow) {
        doc.setFontSize(7.5);
        doc.setFont(themeFont('body'), 'normal');
        doc.text(doc.splitTextToSize(o.eyebrow.toUpperCase(), textW)[0], margin, 25);
      }
      doc.setFontSize(16);
      doc.setFont(themeFont('heading'), 'bold');
      const titleLines = doc.splitTextToSize(o.title, textW).slice(0, 2);
      doc.text(titleLines, margin, 33);
      let cursor = 33 + titleLines.length * 6.4;
      if (o.subtitle) {
        doc.setFontSize(8.5);
        doc.setFont(themeFont('body'), 'normal');
        doc.text(doc.splitTextToSize(o.subtitle, textW)[0], margin, cursor);
        cursor += 5;
      }
      if (hasQr) {
        doc.setFontSize(7.5);
        doc.setFont(themeFont('body'), 'normal');
        const link = safePdfLink(publicUrl(o.qrUrl!), getPublicOrigin());
        doc.text('Abrir ficha online', margin, Math.min(cursor, barH - 4));
        if (link) doc.link(margin, Math.min(cursor, barH - 4) - 4, 45, 6, { url: link });
        try {
          const png = await QRCode.toDataURL(publicUrl(o.qrUrl!), { margin: 1, width: 320 });
          const qx = W - margin - qrSize;
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(qx - 2, 10, qrSize + 4, qrSize + 4, 2, 2, 'F');
          doc.addImage(png, 'PNG', qx, 12, qrSize, qrSize);
          if (link) doc.link(qx - 2, 10, qrSize + 4, qrSize + 4, { url: link });
          doc.setFontSize(6.5);
          doc.setTextColor(255, 255, 255);
          doc.text(o.qrCaption ?? 'Escanear ficha online', qx + qrSize / 2, barH - 5, {
            align: 'center',
          });
        } catch {
          // QR opcional: la ficha se genera igual sin él
        }
      }

      y = barH + 10;
    },

    section(title: string) {
      doc.setFontSize(11.5);
      doc.setFont(themeFont('heading'), 'bold');
      const lines: string[] = doc.splitTextToSize(title.toUpperCase(), contentW - 6);
      ensure(lines.length * 5 + 12);
      doc.setFillColor(...BRAND.emerald);
      doc.rect(margin, y, 3, 6, 'F');
      doc.setFontSize(11.5);
      doc.setFont(themeFont('heading'), 'bold');
      doc.setTextColor(...BRAND.dark);
      doc.text(lines, margin + 6, y + 4.8);
      y += lines.length * 5 + 6;
    },

    kv(label: string, value: string) {
      doc.setFontSize(8.5);
      doc.setFont(themeFont('body'), 'normal');
      const lines = doc.splitTextToSize(value, contentW - 52);
      ensure(lines.length * 4.6 + 3);
      doc.setFontSize(8.5);
      doc.setFont(themeFont('heading'), 'bold');
      doc.setTextColor(...BRAND.gray);
      doc.text(label, margin, y);
      doc.setFont(themeFont('body'), 'normal');
      doc.setTextColor(...BRAND.dark);
      doc.text(lines, margin + 50, y);
      y += lines.length * 4.6 + 2.2;
    },

    paragraph(text: string, opts = {}) {
      const size = opts.size ?? 8.5;
      doc.setFontSize(size);
      doc.setFont(themeFont('body'), 'normal');
      const lines: string[] = doc.splitTextToSize(text, contentW);
      const lineH = size * 0.3528 * 1.4;
      for (const line of lines) {
        ensure(lineH + 2);
        doc.setFontSize(size);
        doc.setFont(themeFont('body'), 'normal');
        doc.setTextColor(...(opts.color ?? BRAND.dark));
        doc.text(line, margin, y);
        y += lineH;
      }
      y += 4;
    },

    bullets(items: string[]) {
      items.forEach((it) => {
        doc.setFontSize(8.5);
        doc.setFont(themeFont('body'), 'normal');
        const lines = doc.splitTextToSize(it, contentW - 6);
        ensure(lines.length * 4.4 + 2);
        doc.setFontSize(8.5);
        doc.setFont(themeFont('body'), 'normal');
        doc.setTextColor(...BRAND.dark);
        doc.text('•', margin, y);
        doc.text(lines, margin + 5, y);
        y += lines.length * 4.4 + 1.8;
      });
      y += 2;
    },

    kpis(items, cols = 2) {
      const boxW = (contentW - 6 * (cols - 1)) / cols;
      const rows = Math.ceil(items.length / cols);
      ensure(rows * 24 + 4);
      const top = y;
      items.forEach((k, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const bx = margin + col * (boxW + 6);
        const by = top + row * 24;
        doc.setDrawColor(...BRAND.line);
        doc.setFillColor(...BRAND.soft);
        doc.roundedRect(bx, by, boxW, 20, 2, 2, 'FD');
        doc.setFontSize(7);
        doc.setFont(themeFont('body'), 'normal');
        doc.setTextColor(...BRAND.gray);
        doc.text(k[0].toUpperCase(), bx + 4, by + 6);
        doc.setFontSize(11.5);
        doc.setFont(themeFont('heading'), 'bold');
        doc.setTextColor(...BRAND.dark);
        doc.text(doc.splitTextToSize(k[1], boxW - 8)[0], bx + 4, by + 12.5);
        if (k[2]) {
          doc.setFontSize(7);
          doc.setFont(themeFont('body'), 'normal');
          doc.setTextColor(...BRAND.gray);
          doc.text(doc.splitTextToSize(k[2], boxW - 8)[0], bx + 4, by + 17.5);
        }
      });
      y = top + rows * 24 + 4;
    },

    card(draw) {
      const used = draw(margin, y, contentW);
      y += used + 4;
    },

    image(base64: string, height: number, caption?: string, _format = 'JPEG') {
      ensure(height + (caption ? 10 : 6));
      try {
        fittedImage(doc, base64, margin, y, contentW, height);
      } catch {
        return;
      }
      y += height + 3;
      if (caption) {
        doc.setFontSize(7);
        doc.setFont(themeFont('body'), 'normal');
        doc.setTextColor(...BRAND.gray);
        doc.text(caption, margin, y);
        y += 6;
      }
    },

    note(text: string) {
      doc.setFontSize(7.5);
      doc.setFont(themeFont('body'), 'normal');
      const lines = doc.splitTextToSize(text, contentW - 8);
      ensure(lines.length * 4 + 12);
      doc.setDrawColor(...BRAND.line);
      doc.setFillColor(...BRAND.soft);
      doc.roundedRect(margin, y, contentW, lines.length * 4 + 8, 2, 2, 'FD');
      doc.setFontSize(7.5);
      doc.setFont(themeFont('body'), 'normal');
      doc.setTextColor(...BRAND.gray);
      doc.text(lines, margin + 4, y + 6);
      y += lines.length * 4 + 12;
    },

    actions(items) {
      const valid = items.map(item => ({ ...item, url: safePdfLink(item.url, getPublicOrigin()) })).filter(item => item.url);
      for (let i = 0; i < valid.length; i += 2) {
        ensure(16);
        const w = (contentW - 5) / 2;
        valid.slice(i, i + 2).forEach((item, col) => {
          const x = margin + col * (w + 5);
          doc.setFillColor(...BRAND.forest);
          doc.roundedRect(x, y, w, 12, 2, 2, 'F');
          doc.setFont(themeFont('heading'), 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(...BRAND.white);
          doc.text(doc.splitTextToSize(item.label, w - 8)[0], x + 4, y + 7.5);
          doc.link(x, y, w, 12, { url: item.url! });
        });
        y += 16;
      }
    },

    gallery(items) {
      for (let i = 0; i < items.length; i += 2) {
        ensure(65);
        const w = (contentW - 5) / 2;
        items.slice(i, i + 2).forEach((item, col) => {
          const x = margin + col * (w + 5);
          try { fittedImage(doc, item.data, x, y, w, 48, 'cover'); } catch { return; }
          doc.setFont(themeFont('body'), 'normal');
          doc.setFontSize(7);
          doc.setTextColor(...BRAND.gray);
          doc.text(doc.splitTextToSize(item.caption, w).slice(0, 2), x, y + 52);
        });
        y += 63;
      }
    },

    blob() {
      footer();
      return doc.output('blob');
    },

    save(filename: string) {
      footer();
      doc.save(filename);
    },
  };

  return api;
};
