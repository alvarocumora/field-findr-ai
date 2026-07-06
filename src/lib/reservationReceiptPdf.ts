import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { drawPdfHeaderLogo, drawPdfFooter } from './pdfBrandHeader';

/**
 * Comprobante de reserva (seña) para el comprador. Se genera client-side a
 * partir de la fila de `reservations` (con lote/proyecto anidados) una vez
 * que el webhook la marcó como pagada.
 */

export interface ReceiptData {
  reservationId: string;
  folio: string;
  buyerName: string;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  buyerRut?: string | null;
  lotNumber?: string | null;
  lotArea?: number | null;
  projectName?: string | null;
  projectLocation?: string | null;
  amount: number;
  currency: string;
  paidAt?: string | null;
  mercadopagoPaymentId?: string | null;
}

interface ReservationLike {
  id: string;
  buyer_name?: string | null;
  buyer_email?: string | null;
  buyer_phone?: string | null;
  buyer_rut?: string | null;
  reservation_amount: number;
  paid_at?: string | null;
  mercadopago_payment_id?: string | null;
  lots?: {
    lot_number?: string | null;
    area?: number | null;
    projects?: { name?: string | null; location?: string | null } | null;
  } | null;
}

export const buildReceiptData = (reservation: ReservationLike): ReceiptData => ({
  reservationId: reservation.id,
  // Human-readable folio: first block of the UUID, uppercased.
  folio: reservation.id.split('-')[0].toUpperCase(),
  buyerName: reservation.buyer_name || '—',
  buyerEmail: reservation.buyer_email,
  buyerPhone: reservation.buyer_phone,
  buyerRut: reservation.buyer_rut,
  lotNumber: reservation.lots?.lot_number,
  lotArea: reservation.lots?.area,
  projectName: reservation.lots?.projects?.name,
  projectLocation: reservation.lots?.projects?.location,
  amount: Number(reservation.reservation_amount) || 0,
  currency: 'CLP',
  paidAt: reservation.paid_at,
  mercadopagoPaymentId: reservation.mercadopago_payment_id,
});

const formatCLP = (value: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);

export const generateReservationReceipt = (d: ReceiptData): jsPDF => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 18;

  drawPdfHeaderLogo(doc, {
    headerHeight: 34,
    subtitle: 'Comprobante de Reserva',
    rightText: `Folio R-${d.folio}`,
  });

  let y = 46;

  // Status + date line
  doc.setFillColor(220, 252, 231); // emerald-100
  doc.roundedRect(margin, y, 34, 8, 2, 2, 'F');
  doc.setTextColor(22, 101, 52); // emerald-800
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PAGADA', margin + 17, y + 5.4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const paidText = d.paidAt
    ? `Pago acreditado el ${format(new Date(d.paidAt), "d 'de' MMMM yyyy, HH:mm", { locale: es })}`
    : 'Pago acreditado';
  doc.text(paidText, pw - margin, y + 5.4, { align: 'right' });
  y += 16;

  const box = (title: string, rows: Array<[string, string]>) => {
    doc.setDrawColor(226, 232, 240);
    const h = 9 + rows.length * 6.5;
    doc.roundedRect(margin, y, pw - margin * 2, h, 2, 2, 'S');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(title.toUpperCase(), margin + 5, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    rows.forEach(([label, value], i) => {
      const ry = y + 12 + i * 6.5;
      doc.setTextColor(120, 120, 120);
      doc.text(label, margin + 5, ry);
      doc.setTextColor(30, 30, 30);
      doc.text(value, margin + 55, ry);
    });
    y += h + 6;
  };

  box('Datos del comprador', [
    ['Nombre', d.buyerName],
    ...(d.buyerRut ? [['RUT', d.buyerRut] as [string, string]] : []),
    ...(d.buyerEmail ? [['Email', d.buyerEmail] as [string, string]] : []),
    ...(d.buyerPhone ? [['Teléfono', d.buyerPhone] as [string, string]] : []),
  ]);

  box('Detalle de la reserva', [
    ['Proyecto', d.projectName || '—'],
    ...(d.projectLocation ? [['Ubicación', d.projectLocation] as [string, string]] : []),
    ['Lote', d.lotNumber || '—'],
    ...(d.lotArea ? [['Superficie', `${Number(d.lotArea).toLocaleString('es-CL')} m²`] as [string, string]] : []),
    ['N° de reserva', d.reservationId],
  ]);

  // Amount highlight
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(34, 197, 94);
  doc.roundedRect(margin, y, pw - margin * 2, 20, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('SEÑA PAGADA', margin + 5, y + 8);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text(formatCLP(d.amount), margin + 5, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(120, 120, 120);
  doc.text('Medio de pago: MercadoPago', pw - margin - 5, y + 8, { align: 'right' });
  if (d.mercadopagoPaymentId) {
    doc.text(`ID transacción: ${d.mercadopagoPaymentId}`, pw - margin - 5, y + 13, { align: 'right' });
  }
  y += 28;

  // Legal note
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  const legal = doc.splitTextToSize(
    'Este comprobante acredita el pago de la seña de reserva del lote indicado. ' +
    'La seña se abona al pie al momento de firmar la Promesa de Compraventa. ' +
    'La reserva está sujeta a las condiciones comerciales informadas por el vendedor del proyecto.',
    pw - margin * 2,
  );
  doc.text(legal, margin, y);

  drawPdfFooter(doc, `Emitido el ${format(new Date(), 'dd/MM/yyyy HH:mm')}`);
  return doc;
};

export const downloadReservationReceipt = (reservation: ReservationLike) => {
  const data = buildReceiptData(reservation);
  const doc = generateReservationReceipt(data);
  doc.save(`comprobante-reserva-${data.folio}.pdf`);
};
