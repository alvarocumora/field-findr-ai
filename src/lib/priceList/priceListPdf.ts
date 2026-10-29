import jsPDF from 'jspdf';
import { drawPdfHeaderLogo, drawPdfFooter } from '../pdfBrandHeader';
import {
  buildPriceRows,
  summarizePriceList,
  priceListToCsv,
  type PriceListLot,
} from './priceList';

export interface PriceListInput {
  /** Project (or "Consolidado — todos los proyectos"). */
  title: string;
  /** Optional location / secondary line. */
  subtitle?: string;
  lots: PriceListLot[];
}

const clp = (v: number) => `$${Math.round(v).toLocaleString('es-CL')}`;
const m2 = (v: number) => `${Math.round(v).toLocaleString('es-CL')}`;
const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'proyecto';
const today = () => new Date().toISOString().slice(0, 10);

const BRAND: [number, number, number] = [22, 78, 99];

/** Columns for the landscape A4 table (x in mm; `right` = right-aligned). */
const COLS = [
  { key: 'lotNumber', label: 'N°', x: 16, right: false },
  { key: 'name', label: 'Nombre', x: 30, right: false },
  { key: 'area', label: 'Superficie m²', x: 150, right: true },
  { key: 'price', label: 'Precio', x: 205, right: true },
  { key: 'pps', label: 'Precio/m²', x: 250, right: true },
  { key: 'status', label: 'Estado', x: 256, right: false },
] as const;

/** Build the consolidated price-list PDF document. */
export const generatePriceListPdf = (input: PriceListInput): jsPDF => {
  const rows = buildPriceRows(input.lots);
  const summary = summarizePriceList(rows);

  const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  drawPdfHeaderLogo(doc, {
    headerHeight: 26,
    subtitle: 'Lista de Precios',
    rightText: today(),
  });

  // Title block
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(input.title, 16, 40);
  if (input.subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 90);
    doc.text(input.subtitle, 16, 46);
  }

  // Summary KPI strip
  const kpis: [string, string][] = [
    ['Lotes', String(summary.total)],
    ['Disponibles', String(summary.available)],
    ['Reservados', String(summary.reserved)],
    ['Vendidos', String(summary.sold)],
    ['Superficie total', `${m2(summary.totalArea)} m²`],
    ['Valor disponible', clp(summary.availableValue)],
    ['Valor total', clp(summary.totalValue)],
    ['Precio prom. /m²', clp(summary.avgPricePerSqm)],
  ];
  const ky = 52;
  const kpiW = (pageW - 32) / 4;
  kpis.forEach(([label, val], i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 16 + col * kpiW;
    const y = ky + row * 15;
    doc.setFillColor(245, 247, 249);
    doc.roundedRect(x, y, kpiW - 4, 12, 1.5, 1.5, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 110, 110);
    doc.text(label, x + 3, y + 4.5);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(val, x + 3, y + 9.5);
  });
  let y = ky + 2 * 15 + 4;

  const drawTableHeader = () => {
    doc.setFillColor(...BRAND);
    doc.rect(14, y, pageW - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    for (const c of COLS) {
      doc.text(c.label, c.x, y + 5.5, c.right ? { align: 'right' } : undefined);
    }
    y += 8;
  };

  drawTableHeader();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  const rowH = 6.6;
  rows.forEach((r, i) => {
    if (y + rowH > pageH - 14) {
      drawPdfFooter(doc, input.title);
      doc.addPage();
      y = 18;
      drawTableHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
    }
    if (i % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(14, y, pageW - 28, rowH, 'F');
    }
    doc.setTextColor(30, 30, 30);
    doc.text(r.lotNumber, COLS[0].x, y + 4.6);
    doc.text(r.name ? r.name.slice(0, 46) : '—', COLS[1].x, y + 4.6);
    doc.text(m2(r.area), COLS[2].x, y + 4.6, { align: 'right' });
    doc.text(r.price > 0 ? clp(r.price) : '—', COLS[3].x, y + 4.6, { align: 'right' });
    doc.text(r.pricePerSqm > 0 ? clp(r.pricePerSqm) : '—', COLS[4].x, y + 4.6, { align: 'right' });
    // status dot + label
    const dot: [number, number, number] =
      r.status === 'available' ? [34, 197, 94] : r.status === 'reserved' ? [234, 179, 8] : r.status === 'sold' ? [148, 163, 184] : [148, 163, 184];
    doc.setFillColor(...dot);
    doc.circle(COLS[5].x + 1.5, y + 3.6, 1.2, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text(r.statusLabel, COLS[5].x + 5, y + 4.6);
    y += rowH;
  });

  // Totals row
  if (y + 8 > pageH - 14) {
    drawPdfFooter(doc, input.title);
    doc.addPage();
    y = 18;
  }
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, pageW - 14, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`Total (${summary.total} lotes)`, COLS[1].x, y);
  doc.text(`${m2(summary.totalArea)} m²`, COLS[2].x, y, { align: 'right' });
  doc.text(clp(summary.totalValue), COLS[3].x, y, { align: 'right' });

  drawPdfFooter(doc, input.title);
  return doc;
};

/** Generate and download the price-list PDF. */
export const downloadProjectPriceList = (input: PriceListInput): void => {
  const doc = generatePriceListPdf(input);
  doc.save(`lista-precios-${slug(input.title)}-${today()}.pdf`);
};

/** Generate and download the price list as a semicolon CSV (Excel-friendly). */
export const downloadPriceListCsv = (input: PriceListInput): void => {
  const csv = priceListToCsv(buildPriceRows(input.lots));
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lista-precios-${slug(input.title)}-${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
