import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { fetchPdfImage, fittedImage, safePdfLink } from './media';
import { registerFichaFonts, CUSTOM_FONT_FAMILIES } from './fichaFonts';
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

/** Si el documento en construcción tiene registradas las fuentes de marca. */
let brandFontsActive = false;

const usable = (family: string) => (CUSTOM_FONT_FAMILIES.has(family) && !brandFontsActive ? 'helvetica' : family);

/** Familia tipográfica activa del tema (Helvetica si las de marca no cargaron). */
export const themeFont = (kind: 'body' | 'heading' = 'body') => usable(getFichaTheme().fonts[kind]);

/** Caligráfica de marca (eyebrows) y Montserrat SemiBold, con respaldo. */
export const scriptFont = () => (brandFontsActive ? 'caveat' : 'helvetica');
export const semiboldFont = () => (brandFontsActive && getFichaTheme().fonts.body === 'montserrat' ? 'montserrat-semibold' : themeFont('body'));

/** Origen público configurable (tema de fichas). */
export const getPublicOrigin = () => getFichaTheme().publicOrigin;

/** @deprecated usar getPublicOrigin() */
export const PUBLIC_ORIGIN = 'https://ofertaterrenos.com';

/** URL absoluta y estable para los QR de las fichas. */
export const publicUrl = (path: string) =>
  path.startsWith('http') ? path : `${getPublicOrigin()}${path.startsWith('/') ? path : `/${path}`}`;

export const fetchImageAsBase64 = fetchPdfImage;

/** Hoja de la marca (dos curvas) inscrita en una caja de `size` mm. */
const drawLeaf = (doc: jsPDF, x: number, y: number, size: number, fill: RGB, vein: RGB) => {
  const k = size / 24;
  doc.setFillColor(...fill);
  doc.lines(
    [
      [0, -8 * k, 4.667 * k, -12.667 * k, 14 * k, -14 * k],
      [-1.333 * k, 8 * k, -6 * k, 12.667 * k, -14 * k, 14 * k],
    ],
    x + 5 * k, y + 19 * k, [1, 1], 'F', true,
  );
  doc.setDrawColor(...vein);
  doc.setLineWidth(Math.max(0.15, size * 0.05));
  doc.line(x + 5 * k, y + 19 * k, x + 19 * k, y + 5 * k);
};

/** Marca gráfica: círculo verde con la hoja blanca. */
export const drawBrandMark = (doc: jsPDF, x: number, y: number, size = 10) => {
  const r = size / 2;
  doc.setFillColor(...BRAND.leaf);
  doc.circle(x + r, y + r, r, 'F');
  drawLeaf(doc, x + size * 0.18, y + size * 0.18, size * 0.64, BRAND.white, BRAND.forest);
};

/** Ancho aproximado (mm) del logotipo vectorial, para dimensionar chips/fondos. */
export const brandLogoWidth = (doc: jsPDF, size = 10) => {
  const theme = getFichaTheme();
  doc.setFont(themeFont('heading'), 'bold');
  doc.setFontSize(size * 1.25);
  const label = theme.logo.primary === 'OFERTA' && theme.logo.secondary === 'TERRENOS'
    ? 'Oferta Terrenos'
    : `${theme.logo.primary} ${theme.logo.secondary}`;
  return size + size * 0.35 + doc.getTextWidth(label);
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
  const onDark = color[0] + color[1] + color[2] > 600;

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

  const isDefault = theme.logo.primary === 'OFERTA' && theme.logo.secondary === 'TERRENOS';
  drawBrandMark(doc, x, y, size);
  const tx = x + size + size * 0.35;
  if (isDefault) {
    doc.setFont(semiboldFont(), 'normal');
    doc.setFontSize(size * 0.62);
    doc.setTextColor(...(onDark ? BRAND.leaf : BRAND.emerald));
    doc.setCharSpace(size * 0.035);
    doc.text('BIENES RAÍCES', tx, y + size * 0.4);
    doc.setCharSpace(0);
    doc.setFont(themeFont('heading'), 'bold');
    doc.setFontSize(size * 1.25);
    doc.setTextColor(...color);
    doc.text('Oferta Terrenos', tx, y + size * 0.92);
    return;
  }
  // Wordmark de tenant: se respeta tal cual.
  doc.setFont(themeFont('heading'), 'bold');
  doc.setFontSize(size * 1.25);
  doc.setTextColor(...color);
  doc.text(theme.logo.primary, tx, y + size * 0.72);
  const w = doc.getTextWidth(theme.logo.primary);
  doc.setTextColor(...(onDark ? BRAND.leaf : BRAND.emerald));
  doc.text(` ${theme.logo.secondary}`, tx + w, y + size * 0.72);
};

/** Onda corta bajo los títulos de sección (firma gráfica de la identidad). */
export const drawSquiggle = (doc: jsPDF, x: number, y: number, w = 18, color: RGB = BRAND.leaf) => {
  const seg = w / 4;
  doc.setDrawColor(...color);
  doc.setLineWidth(0.9);
  doc.setLineCap('round');
  const curves: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const up = i % 2 === 0 ? -1.3 : 1.3;
    curves.push([seg / 3, up, (2 * seg) / 3, up, seg, 0]);
  }
  doc.lines(curves, x, y, [1, 1], 'S', false);
  doc.setLineCap('butt');
  doc.setLineWidth(0.2);
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
  /** Si las tipografías de marca quedaron registradas en este documento. */
  brandFonts: boolean;
  /** Pinta el fondo de papel de la página actual (lo hace solo al crearla). */
  paintPaper: () => void;
}

export const createFichaDoc = (
  options: { footerNote?: string; margin?: number; cover?: boolean } = {}
): FichaDoc => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const brandFonts = registerFichaFonts(doc);
  brandFontsActive = brandFonts;
  const W = 210;
  const H = 297;
  const margin = options.margin ?? 16;
  const contentW = W - margin * 2;
  const footerNote = options.footerNote ?? 'OFERTA TERRENOS · ofertaterrenos.com';
  let y = margin;
  let page = 1;

  const paintPaper = () => {
    doc.setFillColor(...BRAND.paper);
    doc.rect(0, 0, W, H, 'F');
  };
  if (!options.cover) paintPaper();

  const footer = () => {
    if (options.cover && page === 1) return; // la portada no lleva pie
    doc.setDrawColor(...BRAND.line);
    doc.setLineWidth(0.3);
    doc.line(margin, H - 16, W - margin, H - 16);
    doc.setFontSize(7.5);
    doc.setFont(themeFont('body'), 'normal');
    doc.setTextColor(...BRAND.gray);
    doc.text(doc.splitTextToSize(footerNote, contentW - 25)[0], margin, H - 11);
    doc.setFont(semiboldFont(), 'normal');
    doc.text(`${String(page).padStart(2, '0')}`, W - margin, H - 11, { align: 'right' });
  };

  const newPage = () => {
    footer();
    doc.addPage();
    page += 1;
    paintPaper();
    drawBrandLogo(doc, margin, 7, { size: 6, color: BRAND.dark });
    y = margin + 11;
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
    brandFonts,
    paintPaper,

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

      if (o.eyebrow) {
        doc.setTextColor(...BRAND.leaf);
        doc.setFontSize(brandFontsActive ? 13 : 7.5);
        doc.setFont(scriptFont(), 'normal');
        const eyebrow = brandFontsActive ? o.eyebrow.toLowerCase() : o.eyebrow.toUpperCase();
        doc.text(doc.splitTextToSize(eyebrow, textW)[0], margin, 25.5);
      }
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(17);
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
          doc.setFillColor(...BRAND.soft);
          doc.roundedRect(qx - 2.5, 9.5, qrSize + 5, qrSize + 5, 2.5, 2.5, 'F');
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
      doc.setFontSize(14);
      doc.setFont(themeFont('heading'), 'bold');
      const lines: string[] = doc.splitTextToSize(title, contentW);
      ensure(lines.length * 6 + 16);
      y += 2;
      // ensure() may have started a page whose logo changed font/size.
      doc.setFontSize(14);
      doc.setFont(themeFont('heading'), 'bold');
      doc.setTextColor(...BRAND.forest);
      doc.text(lines, margin, y + 5);
      const under = y + 5 + (lines.length - 1) * 6 + 3.5;
      drawSquiggle(doc, margin, under, 16);
      y = under + 6;
    },

    kv(label: string, value: string) {
      doc.setFontSize(8.5);
      doc.setFont(themeFont('body'), 'normal');
      const lines = doc.splitTextToSize(value, contentW - 52);
      ensure(lines.length * 4.6 + 3);
      doc.setFontSize(8.5);
      doc.setFont(semiboldFont(), 'normal');
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
        doc.setLineWidth(0.3);
        doc.setFillColor(...BRAND.soft);
        doc.roundedRect(bx, by, boxW, 20, 3, 3, 'FD');
        doc.setFontSize(6.5);
        doc.setFont(semiboldFont(), 'normal');
        doc.setTextColor(...BRAND.emerald);
        doc.setCharSpace(0.25);
        doc.text(k[0].toUpperCase(), bx + 4.5, by + 6);
        doc.setCharSpace(0);
        doc.setFontSize(11.5);
        doc.setFont(themeFont('heading'), 'bold');
        doc.setTextColor(...BRAND.forest);
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
      doc.setLineWidth(0.3);
      doc.setFillColor(...BRAND.soft);
      doc.roundedRect(margin, y, contentW, lines.length * 4 + 8, 2.5, 2.5, 'FD');
      doc.setFillColor(...BRAND.leaf);
      doc.rect(margin, y + 2, 1.2, lines.length * 4 + 4, 'F');
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
          const primary = i === 0 && col === 0;
          doc.setFillColor(...(primary ? BRAND.leaf : BRAND.forest));
          doc.roundedRect(x, y, w, 12, 6, 6, 'F');
          doc.setFont(themeFont('heading'), 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(...(primary ? BRAND.forest : BRAND.white));
          doc.text(doc.splitTextToSize(item.label, w - 10)[0], x + w / 2, y + 7.5, { align: 'center' });
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
