import jsPDF from 'jspdf';
import { drawPdfHeaderLogo } from './pdfBrandHeader';

interface BrochureData {
  project: any;
  lots: any[];
  conditions: any;
}

const PRIMARY: [number, number, number] = [34, 139, 34];
const DARK: [number, number, number] = [30, 30, 30];
const GRAY: [number, number, number] = [100, 100, 100];
const LIGHT: [number, number, number] = [245, 245, 245];
const WHITE: [number, number, number] = [255, 255, 255];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);

const formatArea = (v: number) =>
  new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(v);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

export const generateProjectBrochurePDF = ({ project, lots, conditions }: BrochureData) => {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // ====== PAGE 1: Cover ======
  const location = [project.city, project.region, project.country].filter(Boolean).join(', ');
  drawPdfHeaderLogo(doc, {
    headerHeight: 50,
    subtitle: location,
    rightText: new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }),
  });

  // Project name below header
  let y = 60;
  doc.setTextColor(...DARK);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(project.name || 'Proyecto', 20, y);
  y += 12;

  // Description
  let y = 65;
  if (project.description) {
    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción del Proyecto', 20, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    const descLines = doc.splitTextToSize(project.description, pw - 40);
    doc.text(descLines, 20, y);
    y += descLines.length * 5 + 10;
  }

  // Key stats box
  doc.setFillColor(...LIGHT);
  doc.roundedRect(20, y, pw - 40, 40, 3, 3, 'F');
  y += 12;

  doc.setTextColor(...DARK);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const available = lots.filter(l => l.status === 'available').length;
  const reserved = lots.filter(l => l.status === 'reserved').length;
  const sold = lots.filter(l => l.status === 'sold').length;
  const prices = lots.filter(l => l.price).map(l => l.price!);
  const areas = lots.map(l => Number(l.area)).filter(a => a > 0);

  const statsCol1 = 30;
  const statsCol2 = pw / 2 + 10;

  doc.setTextColor(...GRAY);
  doc.text('Total de lotes:', statsCol1, y);
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.text(`${lots.length}`, statsCol1 + 35, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Disponibles:', statsCol2, y);
  doc.setTextColor(34, 139, 34);
  doc.setFont('helvetica', 'bold');
  doc.text(`${available}`, statsCol2 + 30, y);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Reservados:', statsCol1, y);
  doc.setTextColor(180, 140, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`${reserved}`, statsCol1 + 35, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Vendidos:', statsCol2, y);
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.text(`${sold}`, statsCol2 + 30, y);

  y += 8;
  if (prices.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text('Rango de precios:', statsCol1, y);
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.text(`${formatCurrency(Math.min(...prices))} — ${formatCurrency(Math.max(...prices))}`, statsCol1 + 40, y);
  }
  if (areas.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text('Superficies:', statsCol2, y);
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.text(`${formatArea(Math.min(...areas))} — ${formatArea(Math.max(...areas))} m²`, statsCol2 + 30, y);
  }

  y += 20;

  // Location info
  if (project.address || project.latitude) {
    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Ubicación', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    if (project.address) {
      doc.text(`Dirección: ${project.address}`, 20, y);
      y += 6;
    }
    doc.text(`Ubicación: ${location}`, 20, y);
    y += 6;
    if (project.latitude && project.longitude) {
      doc.text(`Coordenadas: ${Number(project.latitude).toFixed(6)}, ${Number(project.longitude).toFixed(6)}`, 20, y);
      y += 6;
    }
    if (project.rol_number) {
      doc.text(`ROL SII: ${project.rol_number}`, 20, y);
      y += 6;
    }
    y += 5;
  }

  // ====== COMMERCIAL CONDITIONS ======
  const cond = conditions || {};
  const hasConditions = cond.min_down_payment_pct || cond.max_term_months || cond.interest_rate;

  if (hasConditions) {
    if (y > ph - 80) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(...PRIMARY);
    doc.roundedRect(20, y, pw - 40, 8, 2, 2, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Condiciones Comerciales', 25, y + 6);
    y += 16;

    doc.setFontSize(10);
    doc.setTextColor(...DARK);

    const condItems: [string, string][] = [];
    if (cond.min_down_payment_pct != null) condItems.push(['Pie mínimo', `${cond.min_down_payment_pct}%`]);
    if (cond.max_term_months != null) condItems.push(['Plazo máximo', `${cond.max_term_months} meses (${(cond.max_term_months / 12).toFixed(1)} años)`]);
    if (cond.interest_rate != null) condItems.push(['Tasa mensual', `${cond.interest_rate}%`]);
    if (cond.payment_methods?.length) condItems.push(['Métodos de pago', cond.payment_methods.join(', ')]);
    if (cond.includes_urbanization) condItems.push(['Urbanización', 'Incluida']);
    if (cond.delivery_date) condItems.push(['Entrega estimada', formatDate(cond.delivery_date)]);

    condItems.forEach(([label, value]) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      doc.text(`${label}:`, 25, y);
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'bold');
      doc.text(value, 70, y);
      y += 7;
    });

    if (cond.notes) {
      y += 3;
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...GRAY);
      doc.setFontSize(9);
      const noteLines = doc.splitTextToSize(cond.notes, pw - 50);
      doc.text(noteLines, 25, y);
      y += noteLines.length * 4 + 5;
    }
    y += 5;
  }

  // ====== LOT TABLE ======
  const availableLots = lots.filter(l => l.status === 'available' && l.price);
  if (availableLots.length > 0) {
    if (y > ph - 60) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Lotes Disponibles', 20, y);
    y += 8;

    // Table header
    doc.setFillColor(...PRIMARY);
    doc.rect(20, y, pw - 40, 8, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Lote', 25, y + 5.5);
    doc.text('Superficie', 60, y + 5.5);
    doc.text('Precio', 105, y + 5.5);
    doc.text('Precio/m²', 150, y + 5.5);
    y += 8;

    doc.setFontSize(8);
    availableLots.slice(0, 30).forEach((lot, i) => {
      if (y > ph - 25) {
        doc.addPage();
        y = 20;
      }

      if (i % 2 === 0) {
        doc.setFillColor(...LIGHT);
        doc.rect(20, y - 3, pw - 40, 7, 'F');
      }

      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'normal');
      doc.text(lot.lot_number, 25, y + 2);
      doc.text(`${formatArea(Number(lot.area))} m²`, 60, y + 2);
      doc.text(formatCurrency(lot.price), 105, y + 2);
      doc.text(lot.price_per_sqm ? formatCurrency(lot.price_per_sqm) : '—', 150, y + 2);
      y += 7;
    });

    if (availableLots.length > 30) {
      y += 3;
      doc.setTextColor(...GRAY);
      doc.setFontSize(8);
      doc.text(`... y ${availableLots.length - 30} lotes más disponibles.`, 25, y);
      y += 5;
    }
  }

  // ====== FOOTER on last page ======
  const footerY = ph - 18;
  doc.setFillColor(...LIGHT);
  doc.rect(0, footerY - 5, pw, 23, 'F');

  doc.setTextColor(...GRAY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    '* Los valores son referenciales. Las condiciones finales están sujetas a contrato. Precios pueden variar sin previo aviso.',
    pw / 2, footerY, { align: 'center', maxWidth: pw - 40 }
  );
  doc.text(
    'Field Findr — Plataforma de Inversión en Terrenos | www.fieldfindr.cl',
    pw / 2, footerY + 8, { align: 'center' }
  );

  // Save
  const slug = (project.name || 'proyecto').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  doc.save(`brochure-${slug}.pdf`);
};
