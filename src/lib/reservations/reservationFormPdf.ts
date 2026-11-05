import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { drawBrandLogo } from '@/lib/pdf/fichaShell';
import { maritalStatusLabel, type ReservationFormDetails } from './reservationForm';
import {
  RESERVATION_PAYMENT_ACCOUNT,
  RESERVATION_TERMS,
  type ReservationPaymentAccount,
} from './reservationTerms';

/**
 * PDF del formulario de reserva ya completado (misma estructura que el
 * formulario en papel de OfertaTerrenos). Se genera en el navegador tanto
 * para el comprador, al terminar el formulario, como para el vendedor desde
 * el panel de reservas.
 */

export interface ReservationFormPdfData {
  reservationId: string;
  createdAt: string;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
  expiresAt?: string | null;
  projectName?: string | null;
  lotNumber?: string | null;
  lotArea?: number | null;
  lotPrice?: number | null;
  reservationAmount: number;
  details: ReservationFormDetails;
  account?: ReservationPaymentAccount;
}

type RGB = [number, number, number];
const FOREST: RGB = [14, 59, 46];
const LEAF: RGB = [30, 158, 99];
const LABEL_BG: RGB = [227, 236, 226];
const LINE: RGB = [211, 224, 213];
const INK: RGB = [34, 51, 43];
const MUTED: RGB = [94, 114, 102];

const M = 14;
const ROW_H = 6.6;

export const reservationFolio = (reservationId: string) =>
  `OT-RES-${reservationId.split('-')[0].toUpperCase()}`;

const clp = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? `$${Math.round(value).toLocaleString('es-CL')}`
    : '—';

const dateTime = (value?: string | null) =>
  value ? format(new Date(value), "d 'de' MMMM yyyy, HH:mm", { locale: es }) : '—';

const dateOnly = (value?: string | null) =>
  value ? format(new Date(`${value}T12:00:00`), "d 'de' MMMM yyyy", { locale: es }) : '—';

const area = (value?: number | null) =>
  typeof value === 'number' && value > 0
    ? `${Math.round(value).toLocaleString('es-CL')} m² (${(value / 10000).toLocaleString('es-CL', { maximumFractionDigits: 2 })} ha)`
    : '—';

const v = (value?: string | null) => (value && value.trim() ? value.trim() : '—');

export const generateReservationFormPdf = (d: ReservationFormPdfData): jsPDF => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const cw = pw - M * 2;
  const folio = reservationFolio(d.reservationId);
  const account = d.account ?? RESERVATION_PAYMENT_ACCOUNT;
  let page = 1;
  let y = 0;

  const footer = () => {
    doc.setFillColor(...FOREST);
    doc.rect(0, ph - 9, pw, 9, 'F');
    doc.setFillColor(...LEAF);
    doc.rect(0, ph - 9.8, pw, 0.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('ofertaterrenos.com', M, ph - 3.6);
    doc.setFont('helvetica', 'normal');
    doc.text(`${folio}  ·  Página ${page}`, pw - M, ph - 3.6, { align: 'right' });
  };

  const header = (first: boolean) => {
    const h = first ? 30 : 16;
    doc.setFillColor(...FOREST);
    doc.rect(0, 0, pw, h, 'F');
    doc.setFillColor(...LEAF);
    doc.rect(0, h, pw, 0.8, 'F');
    drawBrandLogo(doc, M, first ? 8 : 3.5, { size: first ? 11 : 8, color: [255, 255, 255] });
    doc.setTextColor(255, 255, 255);
    if (first) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('FORMULARIO DE RESERVA', pw - M, 13, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Folio ${folio}  ·  ${dateTime(d.createdAt)}`, pw - M, 20, { align: 'right' });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Formulario de reserva · ${folio}`, pw - M, 10, { align: 'right' });
    }
    y = h + 7;
  };

  const newPage = () => {
    footer();
    doc.addPage();
    page += 1;
    header(false);
  };

  const ensure = (needed: number) => {
    if (y + needed > ph - 16) newPage();
  };

  const section = (title: string) => {
    ensure(8 + ROW_H * 2);
    doc.setFillColor(...FOREST);
    doc.roundedRect(M, y, cw, 6.4, 1.4, 1.4, 'F');
    doc.setFillColor(...LEAF);
    doc.rect(M, y, 1.4, 6.4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), M + 4, y + 4.4);
    y += 7.6;
  };

  /** Una fila con 1–3 celdas etiqueta/valor que reparten el ancho. */
  const row = (cells: Array<[string, string, number?]>) => {
    ensure(ROW_H);
    const gap = 1.6;
    const fracs = cells.map((c) => c[2] ?? 1 / cells.length);
    const total = cw - gap * (cells.length - 1);
    let x = M;
    cells.forEach(([label, value], i) => {
      const w = total * fracs[i];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.6);
      const lw = doc.getTextWidth(label.toUpperCase()) + 4;
      doc.setFillColor(...LABEL_BG);
      doc.roundedRect(x, y, lw, ROW_H - 1.2, 1, 1, 'F');
      doc.setTextColor(...FOREST);
      doc.text(label.toUpperCase(), x + 2, y + 3.6);
      doc.setDrawColor(...LINE);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x + lw + 0.8, y, w - lw - 0.8, ROW_H - 1.2, 1, 1, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(...INK);
      const maxW = w - lw - 4;
      const fitted = doc.splitTextToSize(value, maxW)[0] ?? '';
      doc.text(fitted, x + lw + 2.6, y + 3.7);
      x += w + gap;
    });
    y += ROW_H;
  };

  header(true);

  section('Datos de la parcela');
  row([['Proyecto', v(d.projectName), 0.62], ['Parcela N°', v(d.lotNumber), 0.38]]);
  row([['Superficie', area(d.lotArea), 0.5], ['Valor', d.lotPrice ? `${clp(d.lotPrice)} CLP` : '—', 0.5]]);
  y += 3;

  d.details.parties.forEach((party, index) => {
    const n = d.details.parties.length > 1 ? ` ${index + 1}` : '';
    const b = party.buyer;
    section(`Datos del comprador${n}`);
    row([['Nombre completo', v(b.fullName)]]);
    row([['RUT', v(b.rut), 0.4], ['Nacionalidad', v(b.nationality), 0.6]]);
    row([['Estado civil', maritalStatusLabel(b.maritalStatus), 0.55], ['Profesión u oficio', v(b.profession), 0.45]]);
    row([['Dirección', v(b.address), 0.66], ['Comuna', v(b.commune), 0.34]]);
    row([['Celular', v(b.phone), 0.4], ['E-mail', v(b.email), 0.6]]);
    y += 3;
    if (party.spouse) {
      const s = party.spouse;
      section(`Cónyuge o conviviente civil${n ? ` · comprador${n}` : ''}`);
      row([['Nombre completo', v(s.fullName), 0.62], ['RUT', v(s.rut), 0.38]]);
      row([['Nacionalidad', v(s.nationality), 0.36], ['Profesión u oficio', v(s.profession), 0.64]]);
      row([['Dirección', v(s.address), 0.66], ['Comuna', v(s.commune), 0.34]]);
      row([['Celular', v(s.phone), 0.4], ['E-mail', v(s.email), 0.6]]);
      y += 3;
    }
  });

  section('Reserva y forma de pago');
  row([['Monto de la reserva', `${clp(d.reservationAmount)} CLP`, 0.5], ['Válida hasta', dateTime(d.expiresAt), 0.5]]);
  row([['Titular de la cuenta', account.holder, 0.62], ['RUT', account.holderRut, 0.38]]);
  row([['Banco', account.bank, 0.42], ['N° de cuenta', account.accountNumber, 0.58]]);
  y += 3;

  section('Observaciones');
  row([['Fecha estimada de escritura', dateOnly(d.details.estimatedDeedDate)]]);
  if (d.details.observations) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    const lines = doc.splitTextToSize(d.details.observations, cw - 6) as string[];
    const h = lines.length * 3.8 + 4;
    ensure(h);
    doc.setDrawColor(...LINE);
    doc.roundedRect(M, y, cw, h, 1, 1, 'S');
    doc.setTextColor(...INK);
    doc.text(lines, M + 3, y + 4.6);
    y += h + 2;
  }
  y += 3;

  section('Condiciones de la reserva');
  doc.setFontSize(7.1);
  const lineH = 3.15;
  // jsPDF dibuja desde la línea base: baja una línea para no pisar la barra.
  y += 2.4;
  for (const clause of RESERVATION_TERMS) {
    const head = `${clause.title.toUpperCase()}: `;
    doc.setFont('helvetica', 'bold');
    const headW = doc.getTextWidth(head);
    doc.setFont('helvetica', 'normal');
    // Primera línea comparte renglón con el título en negrita.
    const firstLines = doc.splitTextToSize(clause.body, cw - headW) as string[];
    const first = firstLines[0] ?? '';
    const rest = clause.body.slice(first.length).trim();
    const restLines = rest ? (doc.splitTextToSize(rest, cw) as string[]) : [];
    ensure(lineH * (1 + Math.min(restLines.length, 2)));
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...FOREST);
    doc.text(head, M, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...INK);
    doc.text(first, M + headW, y);
    y += lineH;
    for (const line of restLines) {
      ensure(lineH);
      doc.text(line, M, y);
      y += lineH;
    }
    y += 1.2;
  }

  // Aceptación electrónica + líneas de firma para la versión impresa.
  ensure(40);
  y += 3;
  const main = d.details.parties[0]?.buyer;
  doc.setFillColor(234, 245, 238);
  doc.setDrawColor(...LEAF);
  doc.roundedRect(M, y, cw, 13, 1.4, 1.4, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...FOREST);
  doc.text('ACEPTACIÓN ELECTRÓNICA DE LAS CONDICIONES', M + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...INK);
  doc.text(
    `${v(main?.fullName)} (RUT ${v(main?.rut)}) aceptó las condiciones el ${dateTime(d.termsAcceptedAt ?? d.createdAt)}` +
      (d.termsVersion ? ` · versión ${d.termsVersion}` : ''),
    M + 4,
    y + 9.8,
  );
  y += 30;
  const half = (cw - 20) / 2;
  doc.setDrawColor(...FOREST);
  [['FIRMA COMPRADOR', 0], ['FIRMA VENDEDOR / INMOBILIARIA', 1]].forEach(([label, i]) => {
    const x = M + (i as number) * (half + 20);
    doc.line(x, y, x + half, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(...FOREST);
    doc.text(label as string, x + half / 2, y + 4.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...MUTED);
    doc.text('Nombre, RUT y firma', x + half / 2, y + 8.5, { align: 'center' });
  });

  footer();
  return doc;
};

export const downloadReservationFormPdf = (d: ReservationFormPdfData) => {
  const doc = generateReservationFormPdf(d);
  const lot = d.lotNumber ? `-lote-${d.lotNumber}` : '';
  doc.save(`formulario-reserva${lot}-${reservationFolio(d.reservationId)}.pdf`);
};
