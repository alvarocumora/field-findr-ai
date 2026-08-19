import jsPDF from 'jspdf';

/**
 * Shared PDF logo header for all Ofertaterrenos documents.
 * Renders the brand-consistent "OFERTA TERRENOS" text logo with gradient-like colors.
 *
 * Brand colors (emerald → sky):
 *   #22C55E (34,197,94) → #0EA5E9 (14,165,233)
 */

// Brand palette
const EMERALD: [number, number, number] = [34, 197, 94];
const SKY: [number, number, number] = [14, 165, 233];
const WHITE: [number, number, number] = [255, 255, 255];
const DARK: [number, number, number] = [30, 30, 30];

/**
 * Draw brand gradient header bar + text logo.
 * @param doc - jsPDF instance
 * @param options - optional overrides
 */
export const drawPdfHeaderLogo = (
  doc: jsPDF,
  options: {
    headerHeight?: number;
    subtitle?: string;
    rightText?: string;
    showGradient?: boolean;
  } = {}
) => {
  const { headerHeight = 40, subtitle, rightText, showGradient = true } = options;
  const pw = doc.internal.pageSize.getWidth();

  // Gradient header bar
  if (showGradient) {
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps;
      const r = Math.round(EMERALD[0] + (SKY[0] - EMERALD[0]) * ratio);
      const g = Math.round(EMERALD[1] + (SKY[1] - EMERALD[1]) * ratio);
      const b = Math.round(EMERALD[2] + (SKY[2] - EMERALD[2]) * ratio);
      doc.setFillColor(r, g, b);
      doc.rect((pw / steps) * i, 0, (pw / steps) + 1, headerHeight, 'F');
    }
  } else {
    doc.setFillColor(...DARK);
    doc.rect(0, 0, pw, headerHeight, 'F');
  }

  // Logo de marca (mismo sistema que las fichas)
  drawBrandLogo(doc, 20, headerHeight * 0.55 - 8, { size: 11, color: WHITE });

  // Subtitle
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 20, headerHeight * 0.55 + 10);
  }

  // Right-aligned text
  if (rightText) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(rightText, pw - 20, headerHeight * 0.55, { align: 'right' });
  }
};

/**
 * Draw a minimal footer with brand name.
 */
export const drawPdfFooter = (doc: jsPDF, extraText?: string) => {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const y = ph - 10;

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('ofertaterrenos.com', 20, y);
  if (extraText) {
    doc.text(extraText, pw - 20, y, { align: 'right' });
  }
};
