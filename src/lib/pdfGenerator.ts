import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { drawPdfFooter } from './pdfBrandHeader';

interface QuotePDFData {
  projectName: string;
  projectLocation: string;
  lotNumber: string;
  lotArea: number;
  lotPrice: number;
  pricePerSqm: number;
  downPaymentPercent: number;
  downPayment: number;
  financedAmount: number;
  termMonths: number;
  /** Monthly rate in percent (e.g. 1.0 = 1% mensual). */
  interestRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  /** Kept for caller compatibility; never printed (no CAE without fees/insurance). */
  cae?: number;
  generatedAt: Date;
  validUntil: Date;
  buyerName?: string;
  listPrice?: number;
  reservationAmount?: number;
  sellerContact?: string;
  /** Public URL encoded in the verification QR (lot sheet or quote link). */
  verifyUrl?: string;
}

// Rural Institutional palette (docs/RURAL_FINDER_DESIGN_SYSTEM.md)
const INK: [number, number, number] = [26, 36, 32];
const FOREST: [number, number, number] = [33, 76, 60];
const MOSS: [number, number, number] = [122, 141, 116];
const SAND: [number, number, number] = [226, 225, 216];
const PAPER: [number, number, number] = [247, 245, 240];
const EMERALD: [number, number, number] = [34, 197, 94];
const SKY: [number, number, number] = [14, 165, 233];

export const QUOTE_DISCLAIMER =
  'Simulación referencial, no constituye oferta de crédito ni aprobación; excluye seguros, comisiones, impuestos y otros gastos. Financiamiento sujeto a evaluación y disponibilidad de producto para terrenos rurales. Precio y disponibilidad sujetos a confirmación al momento de la reserva.';

const clp = (v: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number.isFinite(v) ? v : 0);
const fmtDate = (d: Date) => new Intl.DateTimeFormat('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }).format(d);

export const buildQuoteNumber = (d: Date) => `COT-${d.getTime().toString(36).toUpperCase()}`;

export const generateQuotePDF = async (data: QuotePDFData): Promise<jsPDF> => {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 18;
  const quoteNumber = buildQuoteNumber(data.generatedAt);

  // Page background + header band
  doc.setFillColor(...PAPER); doc.rect(0, 0, W, H, 'F');
  doc.setFillColor(...FOREST); doc.rect(0, 0, W, 44, 'F');
  // Brand gradient stripe (approximated in steps)
  for (let i = 0; i < 40; i++) {
    const t = i / 39;
    doc.setFillColor(
      Math.round(EMERALD[0] + (SKY[0] - EMERALD[0]) * t),
      Math.round(EMERALD[1] + (SKY[1] - EMERALD[1]) * t),
      Math.round(EMERALD[2] + (SKY[2] - EMERALD[2]) * t),
    );
    doc.rect((W / 40) * i, 44, W / 40 + 0.3, 1.6, 'F');
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...PAPER);
  doc.text('OFERTA', M, 18);
  doc.setTextColor(...EMERALD); doc.text('TERRENOS', M + doc.getTextWidth('OFERTA'), 18);
  doc.setFont('times', 'normal'); doc.setFontSize(22); doc.setTextColor(...PAPER);
  doc.text('Cotización de parcela', M, 33);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...SAND);
  doc.text(`N° ${quoteNumber}`, W - M, 16, { align: 'right' });
  doc.text(`Emitida: ${fmtDate(data.generatedAt)}`, W - M, 23, { align: 'right' });
  doc.text(`Válida hasta: ${fmtDate(data.validUntil)}`, W - M, 30, { align: 'right' });

  let y = 58;
  // Project + buyer
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...MOSS);
  doc.text('PROYECTO', M, y);
  if (data.buyerName) doc.text('PREPARADA PARA', W / 2 + 6, y);
  y += 6;
  doc.setFont('times', 'bold'); doc.setFontSize(16); doc.setTextColor(...INK);
  doc.text(doc.splitTextToSize(data.projectName, W / 2 - M - 4)[0], M, y);
  if (data.buyerName) doc.text(doc.splitTextToSize(data.buyerName, W / 2 - M - 4)[0], W / 2 + 6, y);
  y += 5.5;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MOSS);
  if (data.projectLocation) doc.text(data.projectLocation, M, y);

  // Lot card
  y += 9;
  doc.setFillColor(255, 255, 255); doc.setDrawColor(...SAND); doc.setLineWidth(0.4);
  doc.roundedRect(M, y, W - 2 * M, 40, 3, 3, 'FD');
  doc.setFillColor(...FOREST); doc.roundedRect(M, y, 3, 40, 1.5, 1.5, 'F');
  const cols = [
    ['LOTE', data.lotNumber],
    ['SUPERFICIE', `${Number(data.lotArea || 0).toLocaleString('es-CL')} m²`],
    ['PRECIO / M²', data.pricePerSqm > 0 ? clp(data.pricePerSqm) : 'No informado'],
  ];
  const cw = (W - 2 * M - 12) / 3;
  cols.forEach(([k, v], i) => {
    const x = M + 10 + cw * i;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...MOSS); doc.text(k, x, y + 9);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...INK); doc.text(String(v), x, y + 16);
  });
  doc.setDrawColor(...SAND); doc.line(M + 10, y + 21, W - M - 8, y + 21);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...MOSS);
  doc.text('PRECIO COTIZADO', M + 10, y + 28);
  doc.setFont('times', 'bold'); doc.setFontSize(20); doc.setTextColor(...FOREST);
  doc.text(`${clp(data.lotPrice)} CLP`, M + 10, y + 36);
  if (data.listPrice && data.listPrice !== data.lotPrice) {
    const pct = Math.round(((data.listPrice - data.lotPrice) / data.listPrice) * 100);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MOSS);
    doc.text(`Precio lista ${clp(data.listPrice)} · ${pct > 0 ? `descuento ${pct}%` : `+${Math.abs(pct)}%`}`, W - M - 8, y + 36, { align: 'right' });
  }

  // Financing parameters (left) + result (right)
  y += 52;
  doc.setFont('times', 'bold'); doc.setFontSize(14); doc.setTextColor(...INK);
  doc.text('Plan de pago referencial', M, y);
  y += 7;
  const annual = data.interestRate * 12;
  const rows: [string, string][] = [
    ...(data.reservationAmount ? [['Reserva (se abona al pie)', clp(data.reservationAmount)] as [string, string]] : []),
    [`Pie inicial (${data.downPaymentPercent}%)`, clp(data.downPayment)],
    ['Monto a financiar', clp(data.financedAmount)],
    ['Plazo', `${data.termMonths} meses`],
    ['Tasa referencial', `${data.interestRate.toLocaleString('es-CL', { maximumFractionDigits: 2 })}% mensual (${annual.toLocaleString('es-CL', { maximumFractionDigits: 1 })}% nominal anual)`],
  ];
  const leftW = (W - 2 * M) * 0.56;
  rows.forEach(([k, v], i) => {
    const ry = y + i * 9;
    if (i % 2 === 0) { doc.setFillColor(255, 255, 255); doc.rect(M, ry - 5.5, leftW, 9, 'F'); }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MOSS); doc.text(k, M + 3, ry);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK);
    doc.text(doc.splitTextToSize(v, leftW * 0.55)[0], M + leftW - 3, ry, { align: 'right' });
  });
  const bx = M + leftW + 6, bw = W - M - bx, bh = Math.max(rows.length * 9, 40);
  doc.setFillColor(...FOREST); doc.roundedRect(bx, y - 5.5, bw, bh, 3, 3, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...SAND);
  doc.text('CUOTA MENSUAL REFERENCIAL', bx + bw / 2, y + 4, { align: 'center' });
  doc.setFont('times', 'bold'); doc.setFontSize(21); doc.setTextColor(...PAPER);
  doc.text(clp(data.monthlyPayment), bx + bw / 2, y + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...SAND);
  doc.text(`${data.termMonths} cuotas · CLP`, bx + bw / 2, y + 23, { align: 'center' });

  // Cost summary
  y += bh + 6;
  doc.setFont('times', 'bold'); doc.setFontSize(14); doc.setTextColor(...INK);
  doc.text('Resumen de costos', M, y);
  y += 4;
  const summary: [string, string][] = [
    ['Pie inicial', clp(data.downPayment)],
    ['Total cuotas', clp(data.monthlyPayment * data.termMonths)],
    ['Intereses referenciales', clp(Math.max(0, data.totalInterest))],
  ];
  summary.forEach(([k, v]) => {
    y += 8;
    doc.setDrawColor(...SAND); doc.line(M, y + 2.5, W - M, y + 2.5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...MOSS); doc.text(k, M + 3, y);
    doc.setTextColor(...INK); doc.text(v, W - M - 3, y, { align: 'right' });
  });
  y += 6;
  doc.setFillColor(...SAND); doc.roundedRect(M, y, W - 2 * M, 11, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...INK);
  doc.text('COSTO TOTAL (pie + cuotas)', M + 3, y + 7.3);
  doc.setTextColor(...FOREST); doc.text(`${clp(data.totalCost)} CLP`, W - M - 3, y + 7.3, { align: 'right' });

  // Verification QR + next steps
  y += 20;
  const qrSize = 30;
  let qr: string | null = null;
  if (data.verifyUrl) {
    try { qr = await QRCode.toDataURL(data.verifyUrl, { margin: 1, width: 320, color: { dark: '#1A2420', light: '#FFFFFF' } }); } catch { qr = null; }
  }
  doc.setFillColor(255, 255, 255); doc.setDrawColor(...SAND);
  doc.roundedRect(M, y, W - 2 * M, qrSize + 8, 3, 3, 'FD');
  if (qr) doc.addImage(qr, 'PNG', M + 4, y + 4, qrSize, qrSize);
  const tx = qr ? M + qrSize + 10 : M + 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...INK);
  doc.text('Próximos pasos', tx, y + 10);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.8); doc.setTextColor(...MOSS);
  const steps = [
    qr ? 'Escanea el código para ver la ficha y disponibilidad en vivo.' : 'Revisa la ficha y disponibilidad en ofertaterrenos.com.',
    'Agenda una visita o inicia tu reserva desde la ficha del lote.',
    data.sellerContact ? `Contacto: ${data.sellerContact}` : 'Consultas: ofertaterrenos.com',
  ];
  steps.forEach((s, i) => doc.text(doc.splitTextToSize(s, W - M - tx - 4)[0], tx, y + 17 + i * 6));

  // Disclaimer
  y += qrSize + 16;
  doc.setFont('helvetica', 'italic'); doc.setFontSize(7.6); doc.setTextColor(...MOSS);
  doc.text(doc.splitTextToSize(QUOTE_DISCLAIMER, W - 2 * M), M, y);

  try { drawPdfFooter(doc); } catch { /* footer is decorative */ }

  doc.save(`cotizacion-lote-${data.lotNumber.toLowerCase().replace(/\s+/g, '-')}-${quoteNumber}.pdf`);
  return doc;
};

export type { QuotePDFData };
