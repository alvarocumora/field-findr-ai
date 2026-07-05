import jsPDF from 'jspdf';
import type { VisualScenario } from '@/types/visualScenario';

interface ScenarioPdfContext {
  listingTitle?: string;
  listingLocation?: string;
  pageUrl?: string;
}

/**
 * Generate a lightweight one-page PDF summarising a visual scenario
 * (metrics, assumptions, risks). Uses jsPDF, no external assets.
 */
export const generateScenarioPdf = (
  scenario: VisualScenario,
  ctx: ScenarioPdfContext = {},
) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  // Brand header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 56, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('OFERTA TERRENOS · Escenario visual', margin, 34);

  y = 92;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(scenario.title, pageWidth - margin * 2);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 22;

  if (scenario.subtitle) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const subLines = doc.splitTextToSize(scenario.subtitle, pageWidth - margin * 2);
    doc.text(subLines, margin, y);
    y += subLines.length * 14;
  }

  // Context
  if (ctx.listingTitle || ctx.listingLocation) {
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Terreno: ${ctx.listingTitle ?? '—'}${ctx.listingLocation ? ` · ${ctx.listingLocation}` : ''}`,
      margin,
      y,
    );
    y += 14;
  }

  // Description
  if (scenario.description) {
    y += 12;
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(scenario.description, pageWidth - margin * 2);
    doc.text(descLines, margin, y);
    y += descLines.length * 14;
  }

  // Metrics table
  if (scenario.metrics?.length) {
    y += 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Métricas de referencia', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    scenario.metrics.forEach((m) => {
      doc.setTextColor(71, 85, 105);
      doc.text(`• ${m.label}`, margin, y);
      doc.setTextColor(15, 23, 42);
      doc.text(`${m.value.toLocaleString('es-CL')} ${m.unit ?? ''}`, pageWidth - margin, y, { align: 'right' });
      y += 14;
    });
  }

  // Assumptions
  if (scenario.assumptions?.length) {
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Supuestos', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    scenario.assumptions.forEach((a) => {
      const lines = doc.splitTextToSize(`• ${a.label}`, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 12 + 2;
    });
  }

  // Risks
  if (scenario.risks?.length) {
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(185, 28, 28);
    doc.text('Riesgos identificados', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    scenario.risks.forEach((r) => {
      const label = typeof r === 'string' ? r : (r as { label?: string }).label ?? JSON.stringify(r);
      const lines = doc.splitTextToSize(`• ${label}`, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 12 + 2;
    });
  }

  // Footer disclaimer
  const footerY = doc.internal.pageSize.getHeight() - 40;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Escenario conceptual con fines ilustrativos. No constituye anteproyecto arquitectónico ni compromiso de venta.',
    margin,
    footerY,
    { maxWidth: pageWidth - margin * 2 },
  );
  if (ctx.pageUrl) {
    doc.text(ctx.pageUrl, margin, footerY + 12, { maxWidth: pageWidth - margin * 2 });
  }

  const safeSlug = scenario.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  doc.save(`escenario-${safeSlug}.pdf`);
};
