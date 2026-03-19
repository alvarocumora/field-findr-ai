/**
 * Scaled PDF Exporter
 * Generates professional PDF plans with proper scale (1:500, 1:1000, etc.)
 * using jsPDF.
 */
import jsPDF from 'jspdf';

export interface PdfLot {
  id: string;
  label: string;
  polygon: [number, number][]; // [x, y] in meters
  area: number;
  status?: 'available' | 'reserved' | 'sold';
}

export interface ScaledPdfOptions {
  projectName: string;
  scale: number; // e.g. 1000 = 1:1000
  orientation: 'landscape' | 'portrait';
  paperSize: 'a4' | 'a3' | 'a2';
  showGrid: boolean;
  showNorth: boolean;
  showLegend: boolean;
  showDimensions: boolean;
}

const PAPER_SIZES: Record<string, { w: number; h: number }> = {
  a4: { w: 297, h: 210 },
  a3: { w: 420, h: 297 },
  a2: { w: 594, h: 420 },
};

const STATUS_COLORS: Record<string, [number, number, number]> = {
  available: [76, 175, 80],
  reserved: [255, 193, 7],
  sold: [244, 67, 54],
};

export function generateScaledPdf(
  lots: PdfLot[],
  roads?: [number, number][][],
  options?: Partial<ScaledPdfOptions>
): jsPDF {
  const opts: ScaledPdfOptions = {
    projectName: 'Loteo',
    scale: 1000,
    orientation: 'landscape',
    paperSize: 'a4',
    showGrid: true,
    showNorth: true,
    showLegend: true,
    showDimensions: true,
    ...options,
  };

  const paper = PAPER_SIZES[opts.paperSize];
  const pageW = opts.orientation === 'landscape' ? paper.w : paper.h;
  const pageH = opts.orientation === 'landscape' ? paper.h : paper.w;

  const doc = new jsPDF({
    orientation: opts.orientation === 'landscape' ? 'l' : 'p',
    unit: 'mm',
    format: opts.paperSize,
  });

  // Margins
  const margin = 15;
  const drawW = pageW - margin * 2;
  const drawH = pageH - margin * 2 - 20; // Reserve 20mm for title block

  // Calculate bounds
  const allPoints = lots.flatMap(l => l.polygon);
  if (allPoints.length === 0) return doc;

  const xs = allPoints.map(p => p[0]);
  const ys = allPoints.map(p => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const dataW = maxX - minX;
  const dataH = maxY - minY;

  // Scale factor: mm per meter
  const mmPerMeter = 1000 / opts.scale; // e.g. 1:1000 = 1mm per meter
  const fitScaleX = drawW / (dataW * mmPerMeter);
  const fitScaleY = drawH / (dataH * mmPerMeter);
  const fitScale = Math.min(fitScaleX, fitScaleY, 1);

  const effectiveMmPerM = mmPerMeter * fitScale;

  // Transform functions
  const tx = (x: number) => margin + (x - minX) * effectiveMmPerM + (drawW - dataW * effectiveMmPerM) / 2;
  const ty = (y: number) => margin + drawH - (y - minY) * effectiveMmPerM - (drawH - dataH * effectiveMmPerM) / 2;

  // Grid
  if (opts.showGrid) {
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    const gridSpacing = opts.scale <= 500 ? 10 : opts.scale <= 1000 ? 20 : 50; // meters
    for (let x = Math.ceil(minX / gridSpacing) * gridSpacing; x <= maxX; x += gridSpacing) {
      doc.line(tx(x), margin, tx(x), margin + drawH);
    }
    for (let y = Math.ceil(minY / gridSpacing) * gridSpacing; y <= maxY; y += gridSpacing) {
      doc.line(margin, ty(y), margin + drawW, ty(y));
    }
  }

  // Roads
  if (roads) {
    doc.setDrawColor(180, 180, 180);
    doc.setFillColor(220, 220, 220);
    doc.setLineWidth(0.3);
    for (const road of roads) {
      const pts = road.map(p => [tx(p[0]), ty(p[1])]);
      if (pts.length >= 3) {
        doc.setFillColor(220, 220, 220);
        // Draw as filled polygon
        const lines: number[][] = [];
        pts.forEach(p => lines.push(p));
        doc.polygon(lines as any, 'FD');
      }
    }
  }

  // Lots
  for (const lot of lots) {
    const color = STATUS_COLORS[lot.status || 'available'];
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.4);

    const pts = lot.polygon.map(p => [tx(p[0]), ty(p[1])]);
    if (pts.length >= 3) {
      // Fill with transparency simulation (lighter color)
      doc.setFillColor(color[0], color[1], color[2]);
      doc.setGState(new (doc as any).GState({ opacity: 0.15 }));
      doc.polygon(pts as any, 'F');
      doc.setGState(new (doc as any).GState({ opacity: 1 }));
      doc.polygon(pts as any, 'S');
    }

    // Label
    const cx = lot.polygon.reduce((s, p) => s + p[0], 0) / lot.polygon.length;
    const cy = lot.polygon.reduce((s, p) => s + p[1], 0) / lot.polygon.length;
    doc.setFontSize(6);
    doc.setTextColor(30, 30, 30);
    doc.text(lot.label, tx(cx), ty(cy) - 1, { align: 'center' });
    doc.setFontSize(5);
    doc.setTextColor(100, 100, 100);
    doc.text(`${Math.round(lot.area).toLocaleString()} m²`, tx(cx), ty(cy) + 2, { align: 'center' });
  }

  // North arrow
  if (opts.showNorth) {
    const nx = pageW - margin - 8;
    const ny = margin + 15;
    doc.setDrawColor(0, 0, 0);
    doc.setFillColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(nx, ny + 8, nx, ny);
    doc.triangle(nx - 2, ny + 3, nx + 2, ny + 3, nx, ny, 'F');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text('N', nx, ny - 2, { align: 'center' });
  }

  // Legend
  if (opts.showLegend) {
    const lx = margin;
    const ly = pageH - margin - 15;
    doc.setFontSize(6);
    doc.setTextColor(0, 0, 0);

    const statuses = [
      { label: 'Disponible', color: STATUS_COLORS.available },
      { label: 'Reservado', color: STATUS_COLORS.reserved },
      { label: 'Vendido', color: STATUS_COLORS.sold },
    ];

    statuses.forEach(({ label, color }, i) => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(lx + i * 30, ly, 3, 3, 'F');
      doc.text(label, lx + i * 30 + 5, ly + 2.5);
    });
  }

  // Title block
  const tbY = pageH - margin;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, tbY - 12, pageW - margin, tbY - 12);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(opts.projectName.toUpperCase(), margin + 2, tbY - 7);

  doc.setFontSize(7);
  doc.text(`Escala 1:${opts.scale}`, margin + 2, tbY - 3);
  doc.text(`Total Lotes: ${lots.length}`, margin + 60, tbY - 3);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, margin + 120, tbY - 3);
  doc.text('ofertaterrenos.com', pageW - margin - 2, tbY - 3, { align: 'right' });

  // Scale bar
  const sbX = margin + 2;
  const sbY = tbY - 9;
  const scaleBarMeters = opts.scale <= 500 ? 10 : opts.scale <= 1000 ? 50 : 100;
  const scaleBarMm = scaleBarMeters * effectiveMmPerM;

  doc.setLineWidth(0.8);
  doc.line(sbX, sbY, sbX + scaleBarMm, sbY);
  doc.line(sbX, sbY - 1, sbX, sbY + 1);
  doc.line(sbX + scaleBarMm, sbY - 1, sbX + scaleBarMm, sbY + 1);
  doc.setFontSize(5);
  doc.text('0', sbX, sbY + 3);
  doc.text(`${scaleBarMeters}m`, sbX + scaleBarMm, sbY + 3);

  return doc;
}

/**
 * Download scaled PDF
 */
export function downloadScaledPdf(
  lots: PdfLot[],
  fileName: string,
  roads?: [number, number][][],
  options?: Partial<ScaledPdfOptions>
): void {
  const doc = generateScaledPdf(lots, roads, options);
  doc.save(`${fileName}.pdf`);
}
