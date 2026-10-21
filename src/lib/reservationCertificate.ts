import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface ReservationCertificateInput {
  id: string;
  created_at: string;
  expires_at: string;
  status: string;
  paid_at?: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string | null;
  buyer_rut?: string | null;
  reservation_amount: number;
  currency?: string | null;
  source_quote_id?: string | null;
  lot?: {
    lot_number?: string | number | null;
    name?: string | null;
    area?: number | null;
    price?: number | null;
    projectName?: string | null;
    projectLocation?: string | null;
  } | null;
  verifyUrl?: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Pendiente de pago',
  paid: 'Pagada',
  converted: 'Convertida en venta',
  expired: 'Expirada',
  cancelled: 'Cancelada',
};

/** Days to sign the promesa after payment. */
export const PROMESA_BUSINESS_DAYS = 15;

export const CERTIFICATE_RISK_NOTICE =
  'Aviso: este certificado acredita la reserva del lote individualizado y no constituye promesa ni compraventa. La operación queda sujeta a la firma de la promesa de compraventa ante notario, a la verificación de títulos y a las condiciones informadas por el vendedor. La inversión en terrenos implica riesgos; precio y disponibilidad no garantizan plusvalía.';

/** Folio derived from the reservation id and its year: stable and reproducible. */
export function buildReservationFolio(id: string, createdAt: string): string {
  const year = new Date(createdAt).getFullYear();
  const code = id.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `RES-${year}-${code}`;
}

/** A reservation certifies only while pending (not expired) or paid/converted. */
export function certificateValidity(r: Pick<ReservationCertificateInput, 'status' | 'expires_at'>, now = new Date()) {
  if (r.status === 'paid' || r.status === 'converted') return { valid: true, label: 'Reserva vigente (pagada)' };
  if (r.status === 'pending_payment' && new Date(r.expires_at).getTime() > now.getTime()) {
    return { valid: true, label: 'Reserva provisoria · pendiente de pago' };
  }
  return { valid: false, label: 'Sin validez: reserva expirada o cancelada' };
}

const INK: [number, number, number] = [26, 36, 32];
const FOREST: [number, number, number] = [33, 76, 60];
const MOSS: [number, number, number] = [122, 141, 116];
const SAND: [number, number, number] = [226, 225, 216];
const PAPER: [number, number, number] = [247, 245, 240];

const money = (v: number, currency = 'CLP') =>
  currency === 'UF'
    ? `${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(v)} UF`
    : new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);
const fmt = (d: string) =>
  new Intl.DateTimeFormat('es-CL', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(d));

export async function generateReservationCertificatePDF(r: ReservationCertificateInput): Promise<jsPDF> {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 18;
  const folio = buildReservationFolio(r.id, r.created_at);
  const validity = certificateValidity(r);
  const cur = r.currency || 'CLP';

  doc.setFillColor(...PAPER); doc.rect(0, 0, W, H, 'F');
  doc.setFillColor(...FOREST); doc.rect(0, 0, W, 34, 'F');
  doc.setTextColor(...PAPER);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('OFERTA TERRENOS', M, 13);
  doc.setFont('times', 'bold'); doc.setFontSize(19);
  doc.text('Certificado de Reserva', M, 25);
  doc.setFont('courier', 'bold'); doc.setFontSize(11);
  doc.text(folio, W - M, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(`Emitido: ${fmt(new Date().toISOString())}`, W - M, 23, { align: 'right' });

  let y = 46;
  // Validity band
  doc.setFillColor(...(validity.valid ? SAND : [240, 220, 215] as [number, number, number]));
  doc.roundedRect(M, y - 6, W - 2 * M, 12, 2, 2, 'F');
  doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text(validity.label, M + 4, y + 1.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Estado: ${STATUS_LABEL[r.status] ?? r.status}`, W - M - 4, y + 1.5, { align: 'right' });
  y += 16;

  const section = (title: string, rows: [string, string][]) => {
    doc.setTextColor(...FOREST); doc.setFont('times', 'bold'); doc.setFontSize(13);
    doc.text(title, M, y); y += 2;
    doc.setDrawColor(...MOSS); doc.setLineWidth(0.3); doc.line(M, y, W - M, y); y += 6;
    doc.setFontSize(9.5);
    for (const [k, v] of rows) {
      doc.setTextColor(...MOSS); doc.setFont('helvetica', 'normal'); doc.text(k, M, y);
      doc.setTextColor(...INK); doc.setFont('helvetica', 'bold');
      const lines = doc.splitTextToSize(v, W - 2 * M - 60);
      doc.text(lines, M + 60, y);
      y += 6 * Math.max(1, lines.length);
    }
    y += 4;
  };

  const lot = r.lot ?? {};
  const lotLabel = lot.name || (lot.lot_number != null ? `Lote ${lot.lot_number}` : 'No informado');
  section('Inmueble reservado', [
    ['Proyecto', lot.projectName || 'No informado'],
    ['Ubicación', lot.projectLocation || 'No informada'],
    ['Lote', lotLabel],
    ['Superficie', lot.area ? `${new Intl.NumberFormat('es-CL').format(lot.area)} m²` : 'No informada'],
    ['Precio de lista', lot.price ? money(lot.price, cur) : 'No informado'],
  ]);
  section('Comprador', [
    ['Nombre', r.buyer_name],
    ['RUT', r.buyer_rut || 'No informado'],
    ['Email', r.buyer_email],
    ['Teléfono', r.buyer_phone || 'No informado'],
  ]);
  section('Condiciones de la reserva', [
    ['Monto de reserva', money(Number(r.reservation_amount || 0), cur)],
    ['Fecha de reserva', fmt(r.created_at)],
    [r.paid_at ? 'Pagada el' : 'Vence el', r.paid_at ? fmt(r.paid_at) : fmt(r.expires_at)],
    ['Promesa de compraventa', `A firmar ante notario dentro de ${PROMESA_BUSINESS_DAYS} días hábiles desde el pago de la reserva.`],
    ['Imputación', 'El monto de reserva se imputa al pie o precio en la promesa de compraventa.'],
    ...(r.source_quote_id ? [['Cotización de origen', r.source_quote_id.slice(0, 8).toUpperCase()] as [string, string]] : []),
  ]);

  // Risk notice
  doc.setFillColor(...SAND);
  doc.setFontSize(8);
  const notice = doc.splitTextToSize(CERTIFICATE_RISK_NOTICE, W - 2 * M - 8);
  const nh = notice.length * 4 + 8;
  doc.roundedRect(M, y, W - 2 * M, nh, 2, 2, 'F');
  doc.setTextColor(...INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(notice, M + 4, y + 6);
  y += nh + 12;

  // Signatures
  const sw = (W - 2 * M - 40) / 2;
  const sy = Math.min(y + 30, H - 30);
  doc.setDrawColor(...INK);
  doc.line(M, sy, M + sw, sy); doc.line(M + sw + 10, sy, M + 2 * sw + 10, sy);
  doc.setFontSize(8.5); doc.setTextColor(...MOSS);
  doc.text('Comprador', M + sw / 2, sy + 5, { align: 'center' });
  doc.text('Vendedor / Inmobiliaria', M + sw * 1.5 + 10, sy + 5, { align: 'center' });

  if (r.verifyUrl) {
    try {
      const qr = await QRCode.toDataURL(r.verifyUrl, { margin: 0, width: 240 });
      doc.addImage(qr, 'PNG', W - M - 26, sy - 22, 26, 26);
      doc.setFontSize(6.5); doc.text('Verificar', W - M - 13, sy + 7, { align: 'center' });
    } catch { /* QR optional */ }
  }

  doc.setFillColor(...FOREST); doc.rect(0, H - 12, W, 12, 'F');
  doc.setTextColor(...PAPER); doc.setFontSize(7.5);
  doc.text(`ofertaterrenos.com · Folio ${folio}`, M, H - 4.5);
  doc.text('Documento generado electrónicamente', W - M, H - 4.5, { align: 'right' });
  return doc;
}

export async function downloadReservationCertificate(r: ReservationCertificateInput) {
  const doc = await generateReservationCertificatePDF(r);
  doc.save(`${buildReservationFolio(r.id, r.created_at)}.pdf`);
}
