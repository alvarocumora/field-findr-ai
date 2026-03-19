import jsPDF from 'jspdf';
import { drawPdfHeaderLogo, drawPdfFooter } from './pdfBrandHeader';

interface PropertyPdfData {
  title: string;
  price: number;
  currency: string;
  location: string;
  region: string | null;
  area_m2: number | null;
  area_ha: number | null;
  description: string | null;
  type: string;
  zoning: string | null;
  rol: string | null;
  legal_status: string | null;
  utilities: { water?: boolean; electricity?: string; road_access?: string };
  tags: string[];
  created_at: string;
}

const formatPrice = (price: number, currency: string = 'CLP') => {
  if (currency === 'UF') return `UF ${price.toLocaleString('es-CL')}`;
  return `$${price.toLocaleString('es-CL')}`;
};

const formatArea = (m2: number | null, ha: number | null) => {
  if (ha && ha >= 1) return `${ha.toLocaleString('es-CL')} ha`;
  if (m2) return `${m2.toLocaleString('es-CL')} m²`;
  return 'N/A';
};

export const generatePropertyPdf = (property: PropertyPdfData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header bar
  drawPdfHeaderLogo(doc, { subtitle: 'Ficha de Propiedad' });

  y = 55;

  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(property.title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8 + 5;

  // Location
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`📍 ${property.location}${property.region ? `, ${property.region}` : ''}`, margin, y);
  y += 12;

  // Price highlight
  doc.setFillColor(240, 240, 255);
  doc.roundedRect(margin, y - 5, contentWidth, 25, 3, 3, 'F');
  doc.setTextColor(59, 59, 180);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(formatPrice(property.price, property.currency), margin + 10, y + 10);

  if (property.area_m2 && property.area_m2 > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${formatPrice(Math.round(property.price / property.area_m2))} / m²`,
      pageWidth - margin - 10,
      y + 10,
      { align: 'right' }
    );
  }
  y += 30;

  // Key facts grid
  const facts = [
    ['Superficie', formatArea(property.area_m2, property.area_ha)],
    ['Tipo', property.type === 'agricultural' ? 'Agrícola' : property.type === 'residential' ? 'Residencial' : property.type === 'commercial' ? 'Comercial' : property.type],
    ['ROL', property.rol || 'N/A'],
    ['Zonificación', property.zoning || 'N/A'],
  ];

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Datos Principales', margin, y);
  y += 8;

  const colWidth = contentWidth / 2;
  facts.forEach((fact, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * colWidth;
    const fy = y + row * 18;

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text(fact[0], x, fy);
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(fact[1], x, fy + 6);
  });

  y += Math.ceil(facts.length / 2) * 18 + 5;

  // Servicios
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Servicios y Accesos', margin, y);
  y += 8;

  const services = [
    ['Agua', property.utilities.water ? '✓ Disponible' : '✗ No disponible'],
    ['Electricidad', property.utilities.electricity || '✗ No disponible'],
    ['Acceso vial', property.utilities.road_access || 'No especificado'],
  ];

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  services.forEach((s) => {
    doc.setTextColor(80, 80, 80);
    doc.text(`${s[0]}: `, margin, y);
    doc.setTextColor(0, 0, 0);
    doc.text(s[1], margin + 35, y);
    y += 7;
  });
  y += 5;

  // Description
  if (property.description) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Descripción', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const descLines = doc.splitTextToSize(property.description, contentWidth);
    const maxLines = Math.min(descLines.length, 12);
    doc.text(descLines.slice(0, maxLines), margin, y);
    y += maxLines * 5 + 5;
  }

  // Tags
  if (property.tags.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Características', margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(property.tags.join(' • '), margin, y);
    y += 10;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generado el ${new Date().toLocaleDateString('es-CL')} desde Ofertaterrenos.com`,
    margin,
    footerY
  );
  doc.text(
    'Esta ficha es informativa y no constituye oferta legal.',
    pageWidth - margin,
    footerY,
    { align: 'right' }
  );

  doc.save(`ficha-${property.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};
