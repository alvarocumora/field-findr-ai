import jsPDF from 'jspdf';
import type { VisualScenario } from '@/types/visualScenario';

interface ScenarioPdfContext {
  listingTitle?: string;
  listingLocation?: string;
  pageUrl?: string;
  mapboxToken?: string;
}

const A4 = { w: 595.28, h: 841.89 };
const MARGIN = 48;
const CONTENT_W = A4.w - MARGIN * 2;

const fetchAsDataUrl = async (url: string): Promise<{ data: string; format: 'JPEG' | 'PNG' } | null> => {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const format: 'JPEG' | 'PNG' = blob.type.includes('png') ? 'PNG' : 'JPEG';
    const data: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { data, format };
  } catch {
    return null;
  }
};

const imgSize = (dataUrl: string): Promise<{ w: number; h: number }> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 16, h: 9 });
    img.src = dataUrl;
  });

const drawHeader = (doc: jsPDF, subtitle: string) => {
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, A4.w, 56, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('OFERTA TERRENOS · Escenario visual', MARGIN, 32);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(subtitle, MARGIN, 46);
};

const drawFooter = (doc: jsPDF, pageNum: number, totalPages: number, pageUrl?: string) => {
  const y = A4.h - 32;
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y - 12, A4.w - MARGIN, y - 12);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Escenario conceptual con fines ilustrativos. No constituye anteproyecto ni compromiso de venta.',
    MARGIN,
    y,
  );
  doc.text(`Página ${pageNum} / ${totalPages}`, A4.w - MARGIN, y, { align: 'right' });
  if (pageUrl) {
    doc.text(pageUrl, MARGIN, y + 10, { maxWidth: CONTENT_W });
  }
};

const drawImageFitted = async (
  doc: jsPDF,
  url: string,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
): Promise<number> => {
  const asset = await fetchAsDataUrl(url);
  if (!asset) return 0;
  const { w, h } = await imgSize(asset.data);
  const ratio = w / h || 16 / 9;
  let drawW = maxW;
  let drawH = drawW / ratio;
  if (drawH > maxH) {
    drawH = maxH;
    drawW = drawH * ratio;
  }
  const offsetX = x + (maxW - drawW) / 2;
  doc.addImage(asset.data, asset.format, offsetX, y, drawW, drawH, undefined, 'FAST');
  return drawH;
};

const buildMapboxStaticUrl = (
  token: string,
  center: [number, number],
  zoom = 15,
  w = 900,
  h = 500,
) => {
  const [lng, lat] = center;
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/pin-s+22c55e(${lng},${lat})/${lng},${lat},${zoom},0/${w}x${h}@2x?access_token=${token}`;
};

/**
 * Generate a 2-page PDF for a visual scenario:
 *   Page 1 → hero image + overlay + description + metrics
 *   Page 2 → mapa estático (si hay token/center) + supuestos + riesgos
 */
export const generateScenarioPdf = async (
  scenario: VisualScenario,
  ctx: ScenarioPdfContext = {},
) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const contextLine = [ctx.listingTitle, ctx.listingLocation].filter(Boolean).join(' · ');

  // ─────────────── PÁGINA 1 ───────────────
  drawHeader(doc, contextLine || 'Ficha de escenario');
  let y = 80;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(scenario.title, CONTENT_W);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 22;

  if (scenario.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    const s = doc.splitTextToSize(scenario.subtitle, CONTENT_W);
    doc.text(s, MARGIN, y);
    y += s.length * 14;
  }

  y += 10;

  // Hero image (base) + overlay side-by-side if both exist
  const base = scenario.assets?.baseImageUrl;
  const overlay = scenario.assets?.overlayImageUrl;
  const heroMaxH = 260;

  if (base && overlay && overlay !== base) {
    const halfW = (CONTENT_W - 12) / 2;
    const h1 = await drawImageFitted(doc, base, MARGIN, y, halfW, heroMaxH);
    const h2 = await drawImageFitted(doc, overlay, MARGIN + halfW + 12, y, halfW, heroMaxH);
    const used = Math.max(h1, h2);
    if (used > 0) {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Estado actual', MARGIN + 4, y + used + 10);
      doc.text('Escenario propuesto', MARGIN + halfW + 16, y + used + 10);
      y += used + 22;
    }
  } else if (base) {
    const used = await drawImageFitted(doc, base, MARGIN, y, CONTENT_W, heroMaxH);
    if (used > 0) y += used + 12;
  }

  // Description
  if (scenario.description) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Descripción', MARGIN, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(51, 65, 85);
    const d = doc.splitTextToSize(scenario.description, CONTENT_W);
    doc.text(d, MARGIN, y);
    y += d.length * 13 + 8;
  }

  // Metrics
  if (scenario.metrics?.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Métricas de referencia', MARGIN, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    scenario.metrics.forEach((m) => {
      if (y > A4.h - 80) return;
      doc.setTextColor(71, 85, 105);
      doc.text(`• ${m.label}`, MARGIN, y);
      const val =
        typeof m.value === 'number' ? m.value.toLocaleString('es-CL') : String(m.value);
      doc.setTextColor(15, 23, 42);
      doc.text(`${val} ${m.unit ?? ''}`.trim(), A4.w - MARGIN, y, { align: 'right' });
      y += 14;
    });
  }

  drawFooter(doc, 1, 2, ctx.pageUrl);

  // ─────────────── PÁGINA 2 ───────────────
  doc.addPage();
  drawHeader(doc, `${scenario.title} · Supuestos y riesgos`);
  y = 80;

  // Static map
  const center = scenario.geometry?.center;
  const mapMaxH = 220;
  if (ctx.mapboxToken && center && center.length === 2) {
    const zoom = scenario.geometry?.zoom ?? 15;
    const mapUrl = buildMapboxStaticUrl(ctx.mapboxToken, center, Math.min(Math.max(zoom, 10), 18));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Ubicación del escenario', MARGIN, y);
    y += 12;
    const used = await drawImageFitted(doc, mapUrl, MARGIN, y, CONTENT_W, mapMaxH);
    if (used > 0) y += used + 14;
  } else if (scenario.assets?.thumbnailUrl) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Referencia visual', MARGIN, y);
    y += 12;
    const used = await drawImageFitted(doc, scenario.assets.thumbnailUrl, MARGIN, y, CONTENT_W, mapMaxH);
    if (used > 0) y += used + 14;
  }

  // Two columns: Supuestos | Riesgos
  const colW = (CONTENT_W - 20) / 2;
  const startY = y;
  let leftY = startY;
  let rightY = startY;

  // Supuestos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Supuestos', MARGIN, leftY);
  leftY += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  (scenario.assumptions ?? []).forEach((a) => {
    if (leftY > A4.h - 70) return;
    const lines = doc.splitTextToSize(`• ${a.label}`, colW);
    doc.text(lines, MARGIN, leftY);
    leftY += lines.length * 12 + 2;
    if (a.description) {
      const dl = doc.splitTextToSize(a.description, colW - 10);
      doc.setTextColor(148, 163, 184);
      doc.text(dl, MARGIN + 10, leftY);
      doc.setTextColor(71, 85, 105);
      leftY += dl.length * 11 + 4;
    }
  });
  if (!scenario.assumptions?.length) {
    doc.setTextColor(148, 163, 184);
    doc.text('Sin supuestos declarados.', MARGIN, leftY);
  }

  // Riesgos
  const rightX = MARGIN + colW + 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(185, 28, 28);
  doc.text('Riesgos identificados', rightX, rightY);
  rightY += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  (scenario.risks ?? []).forEach((r) => {
    if (rightY > A4.h - 70) return;
    const label = typeof r === 'string' ? r : r.label ?? '—';
    const sev = typeof r === 'string' ? undefined : r.severity;
    const sevColor: [number, number, number] =
      sev === 'high' ? [185, 28, 28] : sev === 'medium' ? [202, 138, 4] : [15, 118, 110];
    doc.setTextColor(...sevColor);
    doc.text('•', rightX, rightY);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(label, colW - 10);
    doc.text(lines, rightX + 10, rightY);
    rightY += lines.length * 12 + 2;
    if (typeof r !== 'string' && r.description) {
      const dl = doc.splitTextToSize(r.description, colW - 10);
      doc.setTextColor(148, 163, 184);
      doc.text(dl, rightX + 10, rightY);
      rightY += dl.length * 11 + 4;
    }
  });
  if (!scenario.risks?.length) {
    doc.setTextColor(148, 163, 184);
    doc.text('Sin riesgos declarados.', rightX, rightY);
  }

  drawFooter(doc, 2, 2, ctx.pageUrl);

  const safeSlug = scenario.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  doc.save(`escenario-${safeSlug}.pdf`);
};
