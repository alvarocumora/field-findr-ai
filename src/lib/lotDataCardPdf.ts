import jsPDF from 'jspdf';
import { Lot, LotFeatures } from '@/hooks/useLots';

const FOREST_GREEN = [44, 95, 45] as const;
const SAND = [232, 220, 200] as const;
const TERRACOTTA = [184, 80, 66] as const;
const DARK = [40, 40, 40] as const;
const GRAY = [120, 120, 120] as const;

const formatCLP = (n: number | null) => {
  if (!n) return 'Consultar';
  return '$' + n.toLocaleString('es-CL');
};

export const generateLotDataCardPdf = async (
  lot: Lot,
  projectName: string,
  features: LotFeatures
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 15;
  const contentW = W - margin * 2;
  let y = 0;

  // ── Header bar ──
  doc.setFillColor(...FOREST_GREEN);
  doc.rect(0, 0, W, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHA DE LOTE', margin, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Proyecto: ${projectName}`, margin, 24);
  doc.setFontSize(8);
  doc.text('ofertaterrenos.com', W - margin, 24, { align: 'right' });

  y = 40;

  // ── Lot hero image ──
  const images = (lot as any).images as string[] | null;
  if (images && images.length > 0) {
    try {
      const response = await fetch(images[0]);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      const imgW = contentW;
      const imgH = imgW * (9 / 16);
      doc.addImage(base64, 'JPEG', margin, y, imgW, imgH);
      y += imgH + 6;
    } catch {
      // skip image on error
    }
  }

  // ── Lot Number + Status ──
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text(`Lote ${lot.lot_number}`, margin, y + 8);

  const statusLabel = lot.status === 'available' ? 'DISPONIBLE' : lot.status === 'reserved' ? 'RESERVADO' : 'VENDIDO';
  const statusColor = lot.status === 'available' ? FOREST_GREEN : lot.status === 'reserved' ? [200, 150, 30] as const : GRAY;
  doc.setFillColor(...statusColor);
  const statusW = doc.getTextWidth(statusLabel) * 0.5 + 8;
  doc.roundedRect(W - margin - statusW, y, statusW, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusLabel, W - margin - statusW / 2, y + 5.5, { align: 'center' });

  y += 16;

  if (lot.name && lot.name !== lot.lot_number) {
    doc.setTextColor(...GRAY);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(lot.name, margin, y);
    y += 7;
  }

  // ── Price highlight ──
  doc.setFillColor(...SAND);
  doc.roundedRect(margin, y, contentW, 20, 3, 3, 'F');
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TERRACOTTA);
  doc.text(formatCLP(lot.price), margin + 6, y + 13);

  const pricePerSqm = lot.price && lot.area ? lot.price / Number(lot.area) : null;
  if (pricePerSqm) {
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text(`${formatCLP(pricePerSqm)}/m²`, W - margin - 6, y + 13, { align: 'right' });
  }
  y += 28;

  // ── Technical Data Table ──
  doc.setFillColor(...FOREST_GREEN);
  doc.rect(margin, y, contentW, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS TÉCNICOS', margin + 4, y + 5.5);
  y += 10;

  const rows: [string, string][] = [
    ['Superficie', `${Number(lot.area).toLocaleString('es-CL')} m²`],
    ['Número de Lote', lot.lot_number],
  ];

  if (lot.latitude && lot.longitude) {
    rows.push(['Coordenadas', `${Number(lot.latitude).toFixed(5)}, ${Number(lot.longitude).toFixed(5)}`]);
  }

  if (lot.elevation_avg) {
    rows.push(['Elevación', `${Math.round(Number(lot.elevation_avg))}m snm`]);
  }

  const slopeMap: Record<string, string> = { flat: 'Plano', gentle: 'Pendiente suave', steep: 'Pendiente fuerte' };
  if (lot.slope_category && slopeMap[lot.slope_category]) {
    rows.push(['Topografía', slopeMap[lot.slope_category]]);
  }

  const services: string[] = [];
  if (features.hasWater) services.push('Agua');
  if (features.hasElectricity) services.push('Electricidad');
  if (features.hasRoad) services.push('Acceso vial');
  if (services.length > 0) {
    rows.push(['Servicios', services.join(', ')]);
  }

  if (features.additionalFeatures && features.additionalFeatures.length > 0) {
    rows.push(['Características', features.additionalFeatures.join(', ')]);
  }

  doc.setFontSize(9);
  rows.forEach((row, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, y, contentW, 7, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(row[0], margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], margin + contentW / 2, y + 5);
    y += 7;
  });

  y += 8;

  // ── Description ──
  if (lot.description) {
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    const lines = doc.splitTextToSize(lot.description, contentW - 8);
    doc.text(lines, margin + 4, y);
    y += lines.length * 4 + 6;
  }

  // ── Location link ──
  if (lot.latitude && lot.longitude) {
    doc.setFontSize(8);
    doc.setTextColor(...FOREST_GREEN);
    const mapsUrl = `https://www.google.com/maps?q=${lot.latitude},${lot.longitude}`;
    doc.textWithLink('📍 Ver ubicación en Google Maps', margin, y, { url: mapsUrl });
    y += 8;
  }

  // ── Project link ──
  const projectUrl = `${window.location.origin}/proyecto/${lot.project_id}?lote=${lot.lot_number}`;
  doc.setFontSize(8);
  doc.setTextColor(...FOREST_GREEN);
  doc.textWithLink('🔗 Ver lote en línea', margin, y, { url: projectUrl });
  y += 10;

  // ── Footer ──
  const footerY = 280;
  doc.setDrawColor(...SAND);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, W - margin, footerY);
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(
    'Documento generado por ofertaterrenos.com · Los precios y disponibilidad pueden variar sin previo aviso.',
    W / 2,
    footerY + 5,
    { align: 'center' }
  );
  doc.text(
    `Generado el ${new Date().toLocaleDateString('es-CL')}`,
    W / 2,
    footerY + 9,
    { align: 'center' }
  );

  doc.save(`Ficha-Lote-${lot.lot_number}.pdf`);
};
