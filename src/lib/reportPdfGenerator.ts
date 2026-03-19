import jsPDF from 'jspdf';
import { drawPdfHeaderLogo } from './pdfBrandHeader';

interface ReportData {
  projectName?: string;
  date: string;
  kpis: {
    soldLots: number;
    totalRevenue: number;
    avgTicket: number;
    conversionRate: string;
    totalLeads: number;
    totalProjects: number;
  };
  projectPerformance: Array<{
    name: string;
    vendidos: number;
    reservados: number;
    disponibles: number;
  }>;
  conversionFunnel: Array<{ stage: string; count: number }>;
  leadsBySource: Array<{ name: string; value: number }>;
}

const formatCLP = (v: number) => `$${v.toLocaleString('es-CL')}`;

export const generateReportPdf = (data: ReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFillColor(34, 80, 60);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('Reporte Ejecutivo', 14, 20);
  doc.setFontSize(11);
  doc.text(data.projectName ? `Proyecto: ${data.projectName}` : 'Todos los Proyectos', 14, 30);
  doc.text(data.date, pageWidth - 14, 30, { align: 'right' });

  y = 55;
  doc.setTextColor(0, 0, 0);

  // KPIs
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Indicadores Clave', 14, y);
  y += 10;

  const kpiItems = [
    ['Lotes Vendidos', String(data.kpis.soldLots)],
    ['Ingresos Totales', formatCLP(data.kpis.totalRevenue)],
    ['Ticket Promedio', formatCLP(data.kpis.avgTicket)],
    ['Tasa de Conversión', `${data.kpis.conversionRate}%`],
    ['Leads Totales', String(data.kpis.totalLeads)],
    ['Proyectos', String(data.kpis.totalProjects)],
  ];

  doc.setFontSize(10);
  const colWidth = (pageWidth - 28) / 3;
  kpiItems.forEach((item, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 14 + col * colWidth;
    const yPos = y + row * 20;

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, yPos - 4, colWidth - 4, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(item[0], x + 4, yPos + 2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(item[1], x + 4, yPos + 9);
  });

  y += 50;

  // Project Performance Table
  if (data.projectPerformance.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Rendimiento por Proyecto', 14, y);
    y += 8;

    // Table header
    doc.setFillColor(34, 80, 60);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Proyecto', 18, y + 5.5);
    doc.text('Vendidos', 90, y + 5.5);
    doc.text('Reservados', 120, y + 5.5);
    doc.text('Disponibles', 155, y + 5.5);
    y += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    data.projectPerformance.forEach((p, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(14, y, pageWidth - 28, 7, 'F');
      }
      doc.text(p.name, 18, y + 5);
      doc.text(String(p.vendidos), 90, y + 5);
      doc.text(String(p.reservados), 120, y + 5);
      doc.text(String(p.disponibles), 155, y + 5);
      y += 7;
    });
    y += 10;
  }

  // Conversion Funnel
  if (data.conversionFunnel.length > 0 && y < 240) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Embudo de Conversión', 14, y);
    y += 8;

    const maxCount = data.conversionFunnel[0]?.count || 1;
    data.conversionFunnel.forEach((item) => {
      const barWidth = Math.max((item.count / maxCount) * (pageWidth - 80), 5);
      doc.setFillColor(34, 80, 60);
      doc.roundedRect(50, y, barWidth, 6, 1, 1, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(item.stage, 14, y + 5);
      doc.text(String(item.count), 50 + barWidth + 4, y + 5);
      y += 10;
    });
    y += 5;
  }

  // Lead Sources
  if (data.leadsBySource.length > 0 && y < 250) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Leads por Fuente', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    data.leadsBySource.forEach((s) => {
      doc.text(`• ${s.name}: ${s.value} leads`, 18, y + 4);
      y += 7;
    });
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generado por FieldFindr • Confidencial', 14, pageH - 10);
  doc.text(data.date, pageWidth - 14, pageH - 10, { align: 'right' });

  doc.save(`reporte-${data.projectName?.replace(/\s/g, '-') || 'general'}-${new Date().toISOString().slice(0, 10)}.pdf`);
};
