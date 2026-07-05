import jsPDF from 'jspdf';
import { drawPdfHeaderLogo } from './pdfBrandHeader';

interface QuotePDFData {
  // Project info
  projectName: string;
  projectLocation: string;
  
  // Lot info
  lotNumber: string;
  lotArea: number;
  lotPrice: number;
  pricePerSqm: number;
  
  // Financing details
  downPaymentPercent: number;
  downPayment: number;
  financedAmount: number;
  termMonths: number;
  interestRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  cae: number;
  
  // Meta
  generatedAt: Date;
  validUntil: Date;

  // Seller-side extras (all optional — used by the internal quote tool)
  /** Prepared-for buyer name shown under the header. */
  buyerName?: string;
  /** Original list price; when it differs from lotPrice a discount line is shown. */
  listPrice?: number;
  /** Reservation deposit ("seña") that secures the lot. */
  reservationAmount?: number;
  /** Contact line for the selling agent (name/email/phone). */
  sellerContact?: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const generateQuotePDF = (data: QuotePDFData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [34, 139, 34]; // Forest green
  const darkColor: [number, number, number] = [30, 30, 30];
  const grayColor: [number, number, number] = [100, 100, 100];
  const lightGray: [number, number, number] = [240, 240, 240];
  
  let yPos = 20;
  
  // Header with brand
  drawPdfHeaderLogo(doc, { headerHeight: 35, subtitle: 'Cotización de Financiamiento' });
  
  // Quote number and date
  const quoteNumber = `COT-${Date.now().toString(36).toUpperCase()}`;
  doc.setFontSize(9);
  doc.text(`N° ${quoteNumber}`, pageWidth - 20, 22, { align: 'right' });
  doc.text(formatDate(data.generatedAt), pageWidth - 20, 30, { align: 'right' });
  
  yPos = 46;
  
  // Project Section
  doc.setTextColor(...darkColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Proyecto', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('Proyecto:', 20, yPos);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.text(data.projectName, 60, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('Ubicación:', 20, yPos);
  doc.setTextColor(...darkColor);
  doc.text(data.projectLocation, 60, yPos);

  if (data.buyerName) {
    yPos += 6;
    doc.setTextColor(...grayColor);
    doc.text('Preparada para:', 20, yPos);
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'bold');
    doc.text(data.buyerName, 60, yPos);
    doc.setFont('helvetica', 'normal');
  }

  yPos += 15;
  
  // Lot Details Box
  doc.setFillColor(...lightGray);
  doc.roundedRect(20, yPos, pageWidth - 40, 38, 3, 3, 'F');
  
  yPos += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(`Lote ${data.lotNumber}`, 30, yPos);
  
  yPos += 9;
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'normal');
  
  // Grid of lot info
  const col1 = 30;
  const col2 = 100;
  
  doc.setTextColor(...grayColor);
  doc.text('Superficie:', col1, yPos);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.lotArea.toLocaleString('es-CL')} m²`, col1 + 30, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('Precio/m²:', col2, yPos);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.pricePerSqm), col2 + 28, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('Precio:', col1, yPos);
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.lotPrice), col1 + 30, yPos);

  // Discount vs list price (seller tool)
  if (data.listPrice && data.listPrice !== data.lotPrice) {
    const discountPct = Math.round(((data.listPrice - data.lotPrice) / data.listPrice) * 100);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text(
      `Precio lista: ${formatCurrency(data.listPrice)} (${discountPct > 0 ? `-${discountPct}%` : `+${Math.abs(discountPct)}%`})`,
      col2,
      yPos,
    );
  }

  yPos += 16;
  
  // Financing Section Title
  doc.setTextColor(...darkColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Simulación de Financiamiento', 20, yPos);
  
  yPos += 10;
  
  // Financing Parameters
  doc.setFontSize(10);
  const paramData = [
    ...(data.reservationAmount
      ? [['Reserva (seña):', `${formatCurrency(data.reservationAmount)} — se abona al pie`]]
      : []),
    ['Pie inicial:', `${data.downPaymentPercent}% (${formatCurrency(data.downPayment)})`],
    ['Monto a financiar:', formatCurrency(data.financedAmount)],
    ['Plazo:', `${data.termMonths} meses (${(data.termMonths / 12).toFixed(1)} años)`],
    ['Tasa mensual:', `${data.interestRate.toFixed(2)}%`],
  ];
  
  paramData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text(label, 20, yPos);
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 70, yPos);
    yPos += 7;
  });
  
  yPos += 6;
  
  // Results Box
  doc.setFillColor(...primaryColor);
  doc.roundedRect(20, yPos, pageWidth - 40, 42, 3, 3, 'F');
  
  yPos += 12;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Cuota mensual estimada', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.monthlyPayment), pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 12;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`CAE estimado: ${data.cae.toFixed(1)}%`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 14;
  
  // Summary Table
  doc.setTextColor(...darkColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Costos', 20, yPos);
  
  yPos += 8;
  
  // Table header
  doc.setFillColor(...lightGray);
  doc.rect(20, yPos, pageWidth - 40, 8, 'F');
  yPos += 6;
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text('Concepto', 25, yPos);
  doc.text('Monto', pageWidth - 25, yPos, { align: 'right' });
  
  yPos += 8;
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'normal');
  
  const summaryData = [
    ['Pie inicial', formatCurrency(data.downPayment)],
    ['Total cuotas', formatCurrency(data.monthlyPayment * data.termMonths)],
    ['Total intereses', formatCurrency(data.totalInterest)],
  ];
  
  summaryData.forEach(([label, value]) => {
    doc.text(label, 25, yPos);
    doc.text(value, pageWidth - 25, yPos, { align: 'right' });
    yPos += 7;
  });
  
  // Total row
  doc.setFillColor(...lightGray);
  doc.rect(20, yPos - 3, pageWidth - 40, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL A PAGAR', 25, yPos + 4);
  doc.setTextColor(...primaryColor);
  doc.text(formatCurrency(data.totalCost), pageWidth - 25, yPos + 4, { align: 'right' });
  
  yPos += 10;
  
  // Validity
  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(`Esta cotización es válida hasta el ${formatDate(data.validUntil)}`, 20, yPos);

  if (data.sellerContact) {
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Contacto: ${data.sellerContact}`, 20, yPos);
  }
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFillColor(...lightGray);
  doc.rect(0, footerY - 5, pageWidth, 25, 'F');
  
  doc.setTextColor(...grayColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    '* Los valores son referenciales y no constituyen una oferta vinculante. Las condiciones finales de financiamiento dependen del análisis crediticio.',
    pageWidth / 2,
    footerY,
    { align: 'center', maxWidth: pageWidth - 40 }
  );
  
  doc.text(
    'OfertaTerrenos — Plataforma de Inversión en Terrenos | ofertaterrenos.com',
    pageWidth / 2,
    footerY + 10,
    { align: 'center' }
  );
  
  // Save
  const fileName = `cotizacion-${data.lotNumber.toLowerCase().replace(/\s+/g, '-')}-${quoteNumber}.pdf`;
  doc.save(fileName);
};

export type { QuotePDFData };
