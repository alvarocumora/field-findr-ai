import jsPDF from 'jspdf';

interface ContractPDFData {
  // Project
  projectName: string;
  projectLocation: string;
  projectRol?: string;
  
  // Lot
  lotNumber: string;
  lotArea: number;
  lotPrice: number | null;
  
  // Buyer
  buyerName: string;
  buyerRut?: string;
  buyerEmail: string;
  buyerPhone?: string;
  
  // Reservation
  reservationId: string;
  reservationAmount: number;
  currency: string;
  paidAt?: string;
  createdAt: string;
  
  // Meta
  generatedAt: Date;
}

const formatCurrency = (value: number, currency = 'CLP'): string =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);

const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);

const PRIMARY: [number, number, number] = [34, 139, 34];
const DARK: [number, number, number] = [30, 30, 30];
const GRAY: [number, number, number] = [100, 100, 100];
const LIGHT: [number, number, number] = [245, 245, 245];

export const generateContractPDF = (data: ContractPDFData): void => {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  let y = 0;

  // ── Header ──
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pw, 38, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('FIELD FINDR', 20, 20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Promesa de Compraventa – Documento Preliminar', 20, 30);

  const contractNum = `PROM-${data.reservationId.slice(0, 8).toUpperCase()}`;
  doc.setFontSize(9);
  doc.text(contractNum, pw - 20, 20, { align: 'right' });
  doc.text(formatDate(data.generatedAt), pw - 20, 28, { align: 'right' });

  y = 50;

  // ── Section helper ──
  const sectionTitle = (title: string) => {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY);
    doc.text(title, 20, y);
    y += 2;
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.5);
    doc.line(20, y, pw - 20, y);
    y += 8;
  };

  const row = (label: string, value: string) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(label, 25, y);
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 80, y);
    y += 7;
  };

  // ── 1. Partes ──
  sectionTitle('1. PARTES INTERVINIENTES');

  doc.setFillColor(...LIGHT);
  doc.roundedRect(20, y - 2, pw - 40, 38, 2, 2, 'F');

  row('Comprador:', data.buyerName);
  if (data.buyerRut) row('RUT:', data.buyerRut);
  row('Email:', data.buyerEmail);
  if (data.buyerPhone) row('Teléfono:', data.buyerPhone);

  y += 8;

  // ── 2. Inmueble ──
  sectionTitle('2. IDENTIFICACIÓN DEL INMUEBLE');

  doc.setFillColor(...LIGHT);
  doc.roundedRect(20, y - 2, pw - 40, 32, 2, 2, 'F');

  row('Proyecto:', data.projectName);
  row('Ubicación:', data.projectLocation);
  if (data.projectRol) row('Rol:', data.projectRol);
  row('Lote:', data.lotNumber);
  row('Superficie:', `${data.lotArea.toLocaleString('es-CL')} m²`);
  if (data.lotPrice) row('Precio:', formatCurrency(data.lotPrice, data.currency));

  y += 8;

  // ── 3. Condiciones económicas ──
  sectionTitle('3. CONDICIONES ECONÓMICAS');

  doc.setFillColor(...PRIMARY);
  doc.roundedRect(20, y, pw - 40, 28, 3, 3, 'F');
  y += 10;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Seña abonada', pw / 2, y, { align: 'center' });
  y += 10;
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.reservationAmount, data.currency), pw / 2, y, { align: 'center' });
  y += 18;

  doc.setTextColor(...DARK);
  row('Fecha de pago:', data.paidAt ? formatDate(new Date(data.paidAt)) : 'Pendiente');
  row('Fecha de reserva:', formatDate(new Date(data.createdAt)));

  y += 8;

  // ── 4. Cláusulas ──
  sectionTitle('4. CLÁUSULAS GENERALES');

  const clauses = [
    'El presente documento constituye una promesa preliminar de compraventa y no tiene carácter vinculante hasta la firma del contrato definitivo ante notario.',
    'La seña abonada será descontada del precio total del inmueble al momento de la escrituración.',
    'En caso de desistimiento por parte del comprador, la seña quedará a favor del vendedor como indemnización por los daños y perjuicios ocasionados.',
    'El vendedor se compromete a entregar el inmueble libre de gravámenes, hipotecas y cualquier otro tipo de carga que pueda afectar la titularidad del comprador.',
    'Las partes acuerdan suscribir el contrato definitivo de compraventa dentro de los 90 días corridos siguientes a la fecha de este documento.',
    'Cualquier controversia derivada de este acuerdo será resuelta ante los tribunales competentes del domicilio del inmueble.',
  ];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);

  clauses.forEach((clause, i) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    const text = `${i + 1}. ${clause}`;
    const lines = doc.splitTextToSize(text, pw - 50);
    doc.text(lines, 25, y);
    y += lines.length * 5 + 3;
  });

  y += 10;

  // ── 5. Firmas ──
  if (y > 230) {
    doc.addPage();
    y = 30;
  }

  sectionTitle('5. FIRMAS');

  const sigX1 = 30;
  const sigX2 = pw / 2 + 15;
  const sigW = pw / 2 - 45;

  doc.setDrawColor(...GRAY);
  doc.setLineWidth(0.3);
  doc.line(sigX1, y + 20, sigX1 + sigW, y + 20);
  doc.line(sigX2, y + 20, sigX2 + sigW, y + 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('EL COMPRADOR', sigX1 + sigW / 2, y + 27, { align: 'center' });
  doc.text('EL VENDEDOR', sigX2 + sigW / 2, y + 27, { align: 'center' });

  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.text(data.buyerName, sigX1 + sigW / 2, y + 33, { align: 'center' });
  doc.text(data.projectName, sigX2 + sigW / 2, y + 33, { align: 'center' });

  // ── Footer ──
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    const fY = doc.internal.pageSize.getHeight() - 15;
    doc.setFillColor(...LIGHT);
    doc.rect(0, fY - 5, pw, 20, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(
      'Este documento es de carácter preliminar y referencial. No constituye un contrato vinculante.',
      pw / 2, fY, { align: 'center' }
    );
    doc.text(`Field Findr | ${contractNum} | Página ${p} de ${pages}`, pw / 2, fY + 6, { align: 'center' });
  }

  doc.save(`promesa-${data.lotNumber.toLowerCase().replace(/\s+/g, '-')}-${contractNum}.pdf`);
};

export type { ContractPDFData };
