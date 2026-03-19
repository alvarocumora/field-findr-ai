import jsPDF from 'jspdf';
import { drawPdfHeaderLogo } from './pdfBrandHeader';

interface FinancialReportData {
  projectName?: string;
  date: string;
  totalRevenue: number;
  pendingRevenue: number;
  overdueAmount: number;
  totalCollected: number;
  activeCredits: number;
  overduePayments: number;
  conversionRate: number;
  paidReservations: number;
  totalReservations: number;
  monthlyData: { month: string; revenue: number }[];
  projectBreakdown: { name: string; revenue: number; reservations: number; conversion: number }[];
}

const formatCLP = (v: number) => `$${v.toLocaleString('es-CL')}`;

export const generateFinancialReportPdf = (data: FinancialReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFillColor(22, 78, 99);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('Reporte Financiero', 14, 20);
  doc.setFontSize(11);
  doc.text(data.projectName ? `Proyecto: ${data.projectName}` : 'Consolidado — Todos los Proyectos', 14, 30);
  doc.text(data.date, pageWidth - 14, 30, { align: 'right' });

  y = 55;
  doc.setTextColor(0, 0, 0);

  // Financial KPIs
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen Financiero', 14, y);
  y += 10;

  const kpis = [
    ['Ingresos Totales', formatCLP(data.totalRevenue)],
    ['Pendiente de Cobro', formatCLP(data.pendingRevenue)],
    ['Morosidad', formatCLP(data.overdueAmount)],
    ['Total Cobrado (Cuotas)', formatCLP(data.totalCollected)],
    ['Créditos Activos', String(data.activeCredits)],
    ['Cuotas Vencidas', String(data.overduePayments)],
    ['Tasa de Conversión', `${data.conversionRate}%`],
    ['Reservas Pagadas', `${data.paidReservations}/${data.totalReservations}`],
  ];

  doc.setFontSize(10);
  const colWidth = (pageWidth - 28) / 2;
  kpis.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 14 + col * colWidth;
    const yPos = y + row * 16;

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, yPos - 3, colWidth - 4, 13, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(item[0], x + 4, yPos + 3);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(item[1], x + colWidth - 8, yPos + 3, { align: 'right' });
  });

  y += kpis.length / 2 * 16 + 10;

  // Monthly Revenue
  if (data.monthlyData.length > 0 && y < 220) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Ingresos Mensuales', 14, y);
    y += 8;

    doc.setFillColor(22, 78, 99);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Mes', 18, y + 5.5);
    doc.text('Ingresos', pageWidth - 18, y + 5.5, { align: 'right' });
    y += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    data.monthlyData.forEach((m, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(14, y, pageWidth - 28, 7, 'F');
      }
      doc.text(m.month, 18, y + 5);
      doc.text(formatCLP(m.revenue), pageWidth - 18, y + 5, { align: 'right' });
      y += 7;
    });
    y += 10;
  }

  // Project Breakdown
  if (data.projectBreakdown.length > 0 && y < 240) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Desglose por Proyecto', 14, y);
    y += 8;

    doc.setFillColor(22, 78, 99);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Proyecto', 18, y + 5.5);
    doc.text('Reservas', 100, y + 5.5);
    doc.text('Conversión', 130, y + 5.5);
    doc.text('Ingresos', pageWidth - 18, y + 5.5, { align: 'right' });
    y += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    data.projectBreakdown.forEach((p, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(14, y, pageWidth - 28, 7, 'F');
      }
      doc.text(p.name.slice(0, 25), 18, y + 5);
      doc.text(String(p.reservations), 105, y + 5);
      doc.text(`${p.conversion}%`, 135, y + 5);
      doc.text(formatCLP(p.revenue), pageWidth - 18, y + 5, { align: 'right' });
      y += 7;
    });
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generado por FieldFindr • Confidencial', 14, pageH - 10);
  doc.text(data.date, pageWidth - 14, pageH - 10, { align: 'right' });

  doc.save(`financiero-${data.projectName?.replace(/\s/g, '-') || 'consolidado'}-${new Date().toISOString().slice(0, 10)}.pdf`);
};
