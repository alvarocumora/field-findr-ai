import jsPDF from 'jspdf';
import { drawPdfHeaderLogo } from './pdfBrandHeader';
import { normalizePolygon } from './polygonUtils';
import { OBJECT_CATALOG, type PlacedObject } from '@/components/parcela/useParcelaState';

/**
 * Plano cenital (site plan) de una parcela diseñada en 3D.
 *
 * Convierte el polígono del lote y los objetos colocados en el diseñador a un
 * plano 2D a escala. El diseñador guarda el terreno con rotación -PI/2 sobre X,
 * así que la coordenada world-z equivale a -norte: para el plano (norte hacia
 * arriba) usamos planY = -z. El polígono viene en metros locales con y = norte.
 */

export interface SitePlanInput {
  lotNumber: string;
  lotArea: number;
  polygon: number[][] | null;
  objects: PlacedObject[];
}

interface PlanPoint {
  x: number; // este (m)
  y: number; // norte (m)
}

const NICE_SCALES = [100, 200, 250, 500, 1000, 2000, 2500, 5000];

const formatArea = (m2: number) => `${Math.round(m2).toLocaleString('es-CL')} m²`;

/** Elige la escala 1:N "bonita" más chica que haga caber los datos en el área. */
const pickScale = (dataW: number, dataH: number, drawW: number, drawH: number): number => {
  for (const scale of NICE_SCALES) {
    const mmPerM = 1000 / scale;
    if (dataW * mmPerM <= drawW && dataH * mmPerM <= drawH) return scale;
  }
  return NICE_SCALES[NICE_SCALES.length - 1];
};

export const generateParcelaSitePlan = (input: SitePlanInput): jsPDF => {
  const { lotNumber, lotArea, polygon, objects } = input;
  const norm = normalizePolygon(polygon);

  const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
  const pageW = 297;
  const pageH = 210;
  const margin = 15;
  const drawW = pageW - margin * 2;
  const drawH = pageH - margin * 2 - 22; // 22mm reservado para rótulo inferior

  drawPdfHeaderLogo(doc, {
    headerHeight: 24,
    subtitle: 'Plano de Parcela',
    rightText: `Lote ${lotNumber}`,
  });

  // Puntos del plano: polígono (norte-up) + objetos (planY = -z)
  const lotPts: PlanPoint[] = norm.localCoords.map(([x, y]) => ({ x, y }));
  const objPts: PlanPoint[] = objects.map((o) => ({ x: o.position[0], y: -o.position[2] }));

  const radiusOf = (o: PlacedObject) =>
    (OBJECT_CATALOG[o.type]?.boundingRadius ?? 1.5) * (o.scale || 1);

  // Bounds sobre lote + huellas de objetos
  const all: PlanPoint[] = [...lotPts];
  objects.forEach((o, i) => {
    const r = radiusOf(o);
    all.push({ x: objPts[i].x - r, y: objPts[i].y - r }, { x: objPts[i].x + r, y: objPts[i].y + r });
  });

  if (all.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(120, 120, 120);
    doc.text('No hay polígono de parcela para generar el plano.', margin, 50);
    return doc;
  }

  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const dataW = Math.max(maxX - minX, 1);
  const dataH = Math.max(maxY - minY, 1);

  const scale = pickScale(dataW, dataH, drawW, drawH);
  const mmPerM = 1000 / scale;

  const originY = 28; // debajo del header
  const areaTop = originY;
  const areaH = drawH;
  // Centrado dentro del área de dibujo (norte arriba → invertimos Y)
  const offX = margin + (drawW - dataW * mmPerM) / 2;
  const offY = areaTop + (areaH - dataH * mmPerM) / 2;
  const tx = (x: number) => offX + (x - minX) * mmPerM;
  const ty = (y: number) => offY + (maxY - y) * mmPerM;

  // Grilla (cada 10/20/50 m según escala)
  const gridSpacing = scale <= 250 ? 10 : scale <= 1000 ? 20 : 50;
  doc.setDrawColor(232, 236, 240);
  doc.setLineWidth(0.1);
  for (let x = Math.ceil(minX / gridSpacing) * gridSpacing; x <= maxX; x += gridSpacing) {
    doc.line(tx(x), areaTop, tx(x), areaTop + areaH);
  }
  for (let y = Math.ceil(minY / gridSpacing) * gridSpacing; y <= maxY; y += gridSpacing) {
    doc.line(margin, ty(y), margin + drawW, ty(y));
  }

  // Contorno del lote
  if (lotPts.length >= 3) {
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(22, 163, 74);   // emerald-600
    doc.setLineWidth(0.6);
    doc.moveTo(tx(lotPts[0].x), ty(lotPts[0].y));
    for (let i = 1; i < lotPts.length; i++) doc.lineTo(tx(lotPts[i].x), ty(lotPts[i].y));
    doc.lineTo(tx(lotPts[0].x), ty(lotPts[0].y));
    doc.fillStroke();

    // Cotas de los lados del lote (longitud en m)
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    for (let i = 0; i < lotPts.length; i++) {
      const a = lotPts[i];
      const b = lotPts[(i + 1) % lotPts.length];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < 1) continue;
      doc.text(`${len.toFixed(1)} m`, (tx(a.x) + tx(b.x)) / 2, (ty(a.y) + ty(b.y)) / 2, { align: 'center' });
    }

    // Etiqueta central: lote + superficie
    const cx = lotPts.reduce((s, p) => s + p.x, 0) / lotPts.length;
    const cy = lotPts.reduce((s, p) => s + p.y, 0) / lotPts.length;
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`Lote ${lotNumber}`, tx(cx), ty(cy) - 1, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(formatArea(lotArea), tx(cx), ty(cy) + 3, { align: 'center' });
  }

  // Objetos colocados: huella circular numerada
  doc.setFontSize(5);
  objects.forEach((o, i) => {
    const p = objPts[i];
    const r = Math.max(radiusOf(o) * mmPerM, 1);
    doc.setDrawColor(59, 130, 246); // blue-500
    doc.setFillColor(219, 234, 254); // blue-100
    doc.circle(tx(p.x), ty(p.y), r, 'FD');
    doc.setTextColor(30, 58, 138);
    doc.text(String(i + 1), tx(p.x), ty(p.y) + 0.8, { align: 'center' });
  });

  // Rosa de los vientos (Norte)
  const nx = pageW - margin - 8;
  const ny = originY + 8;
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(nx, ny + 8, nx, ny);
  doc.triangle(nx - 2, ny + 3, nx + 2, ny + 3, nx, ny, 'F');
  doc.setFontSize(7);
  doc.text('N', nx, ny - 2, { align: 'center' });

  // Leyenda de elementos (agrupada por tipo con conteo)
  if (objects.length > 0) {
    const counts = new Map<string, number>();
    const firstIndex = new Map<string, number>();
    objects.forEach((o, i) => {
      counts.set(o.type, (counts.get(o.type) || 0) + 1);
      if (!firstIndex.has(o.type)) firstIndex.set(o.type, i + 1);
    });
    const entries = [...counts.entries()];
    const legendX = margin + 1;
    let legendY = originY + 4;
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text('ELEMENTOS', legendX, legendY);
    legendY += 3.5;
    doc.setFontSize(5.5);
    for (const [type, count] of entries.slice(0, 22)) {
      const label = OBJECT_CATALOG[type as keyof typeof OBJECT_CATALOG]?.label ?? type;
      doc.setTextColor(30, 58, 138);
      doc.text(`#${firstIndex.get(type)}`, legendX, legendY);
      doc.setTextColor(51, 65, 85);
      doc.text(`${label}${count > 1 ? ` ×${count}` : ''}`, legendX + 6, legendY);
      legendY += 3.2;
    }
  }

  // Barra de escala
  const scaleBarMeters = scale <= 250 ? 10 : scale <= 1000 ? 25 : 100;
  const scaleBarMm = scaleBarMeters * mmPerM;
  const sbX = margin + 1;
  const sbY = pageH - margin - 12;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(sbX, sbY, sbX + scaleBarMm, sbY);
  doc.line(sbX, sbY - 1, sbX, sbY + 1);
  doc.line(sbX + scaleBarMm, sbY - 1, sbX + scaleBarMm, sbY + 1);
  doc.setFontSize(5);
  doc.setTextColor(60, 60, 60);
  doc.text('0', sbX, sbY + 3);
  doc.text(`${scaleBarMeters} m`, sbX + scaleBarMm, sbY + 3);

  // Rótulo inferior
  const tbY = pageH - margin;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(margin, tbY - 6, pageW - margin, tbY - 6);
  doc.setFontSize(7);
  doc.setTextColor(30, 30, 30);
  doc.text(`Escala 1:${scale}`, margin + 40, tbY - 1.5);
  doc.text(`Superficie: ${formatArea(lotArea)}`, margin + 80, tbY - 1.5);
  doc.text(`Elementos: ${objects.length}`, margin + 130, tbY - 1.5);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, margin + 170, tbY - 1.5);
  doc.text('ofertaterrenos.com', pageW - margin, tbY - 1.5, { align: 'right' });

  return doc;
};

export const downloadParcelaSitePlan = (input: SitePlanInput) => {
  const doc = generateParcelaSitePlan(input);
  doc.save(`plano-parcela-${input.lotNumber || 'sn'}.pdf`);
};
