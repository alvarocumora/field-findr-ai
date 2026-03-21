import jsPDF from 'jspdf';

export interface BrochureAIContent {
  headline: string;
  elevatorPitch: string;
  pillars: Array<{ title: string; text: string }>;
  investmentProjection: string;
  technicalSpecs: Array<{ label: string; value: string }>;
  ctaVisit: string;
  ctaMasterPlan: string;
}

interface BrochureData {
  project: any;
  lots: any[];
  conditions: any;
  aiContent?: BrochureAIContent;
}

// Terroir Sereno palette
const FOREST: [number, number, number] = [44, 95, 45];
const SAND: [number, number, number] = [232, 220, 200];
const TERRACOTTA: [number, number, number] = [184, 80, 66];
const WHITE: [number, number, number] = [255, 255, 255];
const DARK: [number, number, number] = [38, 38, 38];
const GRAY: [number, number, number] = [120, 120, 120];
const LIGHT_BG: [number, number, number] = [250, 247, 242];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);

const formatArea = (v: number) =>
  new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(v);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

const drawForestHeader = (doc: jsPDF, height: number) => {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(...FOREST);
  doc.rect(0, 0, pw, height, 'F');
};

const drawSandFooter = (doc: jsPDF) => {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  doc.setFillColor(...SAND);
  doc.rect(0, ph - 20, pw, 20, 'F');
  doc.setTextColor(...FOREST);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('ofertaterrenos.com', 20, ph - 8);
  doc.text('Plataforma de Inversión en Terrenos', pw - 20, ph - 8, { align: 'right' });
};

export const generateProjectBrochurePDF = ({ project, lots, conditions, aiContent }: BrochureData) => {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = pw - margin * 2;

  const location = [project.city, project.region, project.country].filter(Boolean).join(', ');
  const available = lots.filter(l => l.status === 'available');
  const prices = lots.filter(l => l.price).map(l => l.price!);
  const areas = lots.map(l => Number(l.area)).filter(a => a > 0);
  const priceMin = prices.length > 0 ? Math.min(...prices) : null;
  const priceMax = prices.length > 0 ? Math.max(...prices) : null;
  const areaMin = areas.length > 0 ? Math.min(...areas) : null;
  const areaMax = areas.length > 0 ? Math.max(...areas) : null;

  // ====== PAGE 1: COVER ======
  drawForestHeader(doc, 100);

  // Brand name
  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('OFERTA TERRENOS', margin, 18);

  // Date
  doc.setFontSize(8);
  doc.text(
    new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }),
    pw - margin, 18, { align: 'right' }
  );

  // Project name
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  const nameLines = doc.splitTextToSize(project.name || 'Proyecto', contentW);
  doc.text(nameLines, margin, 50);

  // Location
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(location, margin, 50 + nameLines.length * 12 + 5);

  // AI headline or fallback
  let y = 115;
  if (aiContent?.headline) {
    doc.setTextColor(...TERRACOTTA);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const headlineLines = doc.splitTextToSize(aiContent.headline, contentW);
    doc.text(headlineLines, margin, y);
    y += headlineLines.length * 8 + 10;
  }

  // Price highlight
  if (priceMin) {
    doc.setFillColor(...TERRACOTTA);
    doc.roundedRect(margin, y, contentW, 30, 3, 3, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Desde', margin + 15, y + 12);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(priceMin), margin + 15, y + 24);
    if (priceMax && priceMax !== priceMin) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`hasta ${formatCurrency(priceMax)}`, pw / 2 + 10, y + 20);
    }
    y += 40;
  }

  // Elevator pitch
  if (aiContent?.elevatorPitch) {
    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const pitchLines = doc.splitTextToSize(aiContent.elevatorPitch, contentW);
    doc.text(pitchLines, margin, y);
    y += pitchLines.length * 5.5 + 10;
  } else if (project.description) {
    doc.setTextColor(...DARK);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(project.description, contentW);
    doc.text(descLines.slice(0, 6), margin, y);
    y += Math.min(descLines.length, 6) * 5 + 10;
  }

  // Key stats row
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, y, contentW, 28, 3, 3, 'F');

  const statW = contentW / 4;
  const stats = [
    { label: 'Lotes', value: `${lots.length}` },
    { label: 'Disponibles', value: `${available.length}` },
    { label: 'Superficie', value: areaMin ? `${formatArea(areaMin)} m²` : '—' },
    { label: 'Ubicación', value: project.city || '—' },
  ];

  stats.forEach((s, i) => {
    const x = margin + statW * i + statW / 2;
    doc.setTextColor(...FOREST);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(s.value, x, y + 12, { align: 'center' });
    doc.setTextColor(...GRAY);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(s.label, x, y + 20, { align: 'center' });
  });

  drawSandFooter(doc);

  // ====== PAGE 2: CONTENT ======
  doc.addPage();
  drawForestHeader(doc, 12);
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('OFERTA TERRENOS', margin, 9);
  doc.text(project.name || '', pw - margin, 9, { align: 'right' });

  y = 25;

  // Pillars of value
  if (aiContent?.pillars && aiContent.pillars.length > 0) {
    doc.setTextColor(...FOREST);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Pilares de Valor', margin, y);
    y += 10;

    aiContent.pillars.forEach((pillar) => {
      // Pillar title with terracotta accent
      doc.setFillColor(...TERRACOTTA);
      doc.rect(margin, y - 1, 3, 12, 'F');

      doc.setTextColor(...DARK);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(pillar.title, margin + 8, y + 5);
      y += 10;

      doc.setTextColor(...GRAY);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const pillarLines = doc.splitTextToSize(pillar.text, contentW - 8);
      doc.text(pillarLines, margin + 8, y);
      y += pillarLines.length * 4.5 + 8;
    });
    y += 5;
  }

  // Investment projection
  if (aiContent?.investmentProjection) {
    doc.setFillColor(...SAND);
    const projLines = doc.splitTextToSize(aiContent.investmentProjection, contentW - 20);
    const projHeight = projLines.length * 4.5 + 16;
    doc.roundedRect(margin, y, contentW, projHeight, 3, 3, 'F');

    doc.setTextColor(...FOREST);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Proyeccion de Inversion', margin + 10, y + 10);

    doc.setTextColor(...DARK);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(projLines, margin + 10, y + 18);
    y += projHeight + 8;
  }

  // Technical specs
  const specs = aiContent?.technicalSpecs || [];
  if (specs.length > 0) {
    doc.setTextColor(...FOREST);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Ficha Tecnica', margin, y + 5);
    y += 12;

    specs.forEach((spec, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(...LIGHT_BG);
        doc.rect(margin, y - 3, contentW, 8, 'F');
      }
      doc.setTextColor(...GRAY);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(spec.label, margin + 5, y + 2);
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'bold');
      doc.text(spec.value, pw / 2 + 10, y + 2);
      y += 8;
    });
    y += 5;
  }

  // Commercial conditions
  const cond = conditions || {};
  const hasConditions = cond.min_down_payment_pct || cond.max_term_months || cond.interest_rate;

  if (hasConditions && y < ph - 70) {
    doc.setTextColor(...FOREST);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Condiciones Comerciales', margin, y + 5);
    y += 12;

    const condItems: [string, string][] = [];
    if (cond.min_down_payment_pct != null) condItems.push(['Pie minimo', `${cond.min_down_payment_pct}%`]);
    if (cond.max_term_months != null) condItems.push(['Plazo maximo', `${cond.max_term_months} meses`]);
    if (cond.interest_rate != null) condItems.push(['Tasa mensual', `${cond.interest_rate}%`]);
    if (cond.payment_methods?.length) condItems.push(['Metodos de pago', cond.payment_methods.join(', ')]);
    if (cond.includes_urbanization) condItems.push(['Urbanizacion', 'Incluida']);
    if (cond.delivery_date) condItems.push(['Entrega estimada', formatDate(cond.delivery_date)]);

    condItems.forEach(([ label, value ], i) => {
      if (i % 2 === 0) {
        doc.setFillColor(...LIGHT_BG);
        doc.rect(margin, y - 3, contentW, 8, 'F');
      }
      doc.setTextColor(...GRAY);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${label}:`, margin + 5, y + 2);
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'bold');
      doc.text(value, pw / 2 + 10, y + 2);
      y += 8;
    });
  }

  drawSandFooter(doc);

  // ====== PAGE 3: INVENTORY + CTA ======
  doc.addPage();
  drawForestHeader(doc, 12);
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('OFERTA TERRENOS', margin, 9);
  doc.text(project.name || '', pw - margin, 9, { align: 'right' });

  y = 25;

  // Lot table
  const availableLots = lots.filter(l => l.status === 'available' && l.price);
  if (availableLots.length > 0) {
    doc.setTextColor(...FOREST);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Lotes Disponibles', margin, y);
    y += 10;

    // Table header
    doc.setFillColor(...FOREST);
    doc.rect(margin, y, contentW, 9, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Lote', margin + 5, y + 6);
    doc.text('Superficie', margin + 45, y + 6);
    doc.text('Precio', margin + 95, y + 6);
    doc.text('Precio/m2', margin + 140, y + 6);
    y += 9;

    doc.setFontSize(8);
    const maxLots = Math.min(availableLots.length, 25);
    availableLots.slice(0, maxLots).forEach((lot, i) => {
      if (y > ph - 55) {
        drawSandFooter(doc);
        doc.addPage();
        drawForestHeader(doc, 12);
        doc.setTextColor(...WHITE);
        doc.setFontSize(8);
        doc.text('OFERTA TERRENOS', margin, 9);
        y = 25;
      }

      if (i % 2 === 0) {
        doc.setFillColor(...LIGHT_BG);
        doc.rect(margin, y - 3, contentW, 7.5, 'F');
      }

      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'normal');
      doc.text(lot.lot_number || `#${i + 1}`, margin + 5, y + 2);
      doc.text(`${formatArea(Number(lot.area))} m2`, margin + 45, y + 2);
      doc.text(formatCurrency(lot.price), margin + 95, y + 2);
      doc.text(lot.price_per_sqm ? formatCurrency(lot.price_per_sqm) : '-', margin + 140, y + 2);
      y += 7.5;
    });

    if (availableLots.length > maxLots) {
      y += 3;
      doc.setTextColor(...GRAY);
      doc.setFontSize(8);
      doc.text(`... y ${availableLots.length - maxLots} lotes mas disponibles.`, margin + 5, y);
      y += 8;
    }
    y += 10;
  }

  // CTA section
  if (aiContent?.ctaVisit || aiContent?.ctaMasterPlan) {
    // CTA box
    doc.setFillColor(...TERRACOTTA);
    const ctaH = 40;
    const ctaY = Math.max(y, ph - 75);
    doc.roundedRect(margin, ctaY, contentW, ctaH, 4, 4, 'F');

    doc.setTextColor(...WHITE);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const cta1Lines = doc.splitTextToSize(aiContent.ctaVisit || '', contentW - 20);
    doc.text(cta1Lines, margin + 10, ctaY + 12);

    if (aiContent.ctaMasterPlan) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const cta2Lines = doc.splitTextToSize(aiContent.ctaMasterPlan, contentW - 20);
      doc.text(cta2Lines, margin + 10, ctaY + 28);
    }
  }

  // Disclaimer footer
  const footerY = ph - 20;
  doc.setFillColor(...SAND);
  doc.rect(0, footerY, pw, 20, 'F');
  doc.setTextColor(...GRAY);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    '* Los valores son referenciales. Las condiciones finales estan sujetas a contrato. Precios pueden variar sin previo aviso.',
    pw / 2, footerY + 7, { align: 'center', maxWidth: contentW }
  );
  doc.setTextColor(...FOREST);
  doc.setFontSize(7);
  doc.text('ofertaterrenos.com | Plataforma de Inversion en Terrenos', pw / 2, footerY + 14, { align: 'center' });

  // Save
  const slug = (project.name || 'proyecto').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  doc.save(`brochure-${slug}.pdf`);
};
