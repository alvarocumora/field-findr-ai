import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useProjects } from '@/hooks/useProjects';
import { useMultiProjectMetrics } from '@/hooks/useMultiProjectMetrics';
import { useFinancialDashboard } from '@/hooks/useFinancialDashboard';
import { generateReportPdf } from '@/lib/reportPdfGenerator';
import { generateFinancialReportPdf } from '@/lib/financialReportPdfGenerator';
import { toast } from 'sonner';
import {
  FileText, Download, BarChart3, DollarSign, TrendingUp,
  Users, PieChart,
} from 'lucide-react';

const Reports = () => {
  const { projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const { data: metrics } = useMultiProjectMetrics(selectedProject === 'all' ? undefined : selectedProject);
  const { data: financial } = useFinancialDashboard();

  const handleExecutiveReport = () => {
    if (!metrics) return toast.error('Cargando datos...');
    const projectName = selectedProject === 'all'
      ? undefined
      : projects.find(p => p.id === selectedProject)?.name;

    generateReportPdf({
      projectName,
      date: new Date().toLocaleDateString('es-CL'),
      kpis: {
        soldLots: metrics.soldLots,
        totalRevenue: metrics.reservationRevenue + metrics.creditRevenue,
        avgTicket: metrics.soldLots > 0 ? Math.round((metrics.reservationRevenue + metrics.creditRevenue) / metrics.soldLots) : 0,
        conversionRate: metrics.totalLots > 0 ? String(Math.round((metrics.soldLots / metrics.totalLots) * 100)) : '0',
        totalLeads: metrics.activeLeads,
        totalProjects: metrics.activeProjects,
      },
      projectPerformance: metrics.projectDetails.map(p => ({
        name: p.name,
        vendidos: p.soldLots,
        reservados: p.reservedLots,
        disponibles: p.availableLots,
      })),
      conversionFunnel: [
        { stage: 'Leads', count: metrics.activeLeads },
        { stage: 'Reservas', count: financial?.totalReservations || 0 },
        { stage: 'Pagadas', count: financial?.paidReservations || 0 },
        { stage: 'Vendidos', count: metrics.soldLots },
      ],
      leadsBySource: [],
    });
    toast.success('Reporte ejecutivo descargado');
  };

  const handleFinancialReport = () => {
    if (!financial) return toast.error('Cargando datos...');
    const projectName = selectedProject === 'all'
      ? undefined
      : projects.find(p => p.id === selectedProject)?.name;

    generateFinancialReportPdf({
      projectName,
      date: new Date().toLocaleDateString('es-CL'),
      totalRevenue: financial.totalRevenue,
      pendingRevenue: financial.pendingRevenue,
      overdueAmount: financial.overdueAmount,
      totalCollected: financial.totalCollected,
      activeCredits: financial.activeCredits,
      overduePayments: financial.overduePayments,
      conversionRate: financial.conversionRate,
      paidReservations: financial.paidReservations,
      totalReservations: financial.totalReservations,
      monthlyData: financial.monthlyData,
      projectBreakdown: financial.projectBreakdown,
    });
    toast.success('Reporte financiero descargado');
  };

  const handleCSVExport = () => {
    if (!metrics) return toast.error('Cargando datos...');
    const headers = ['Proyecto', 'Lotes Totales', 'Disponibles', 'Reservados', 'Vendidos'];
    const rows = metrics.projectDetails.map(p => [p.name, p.totalLots, p.availableLots, p.reservedLots, p.soldLots].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proyectos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  };

  const reports = [
    {
      title: 'Reporte Ejecutivo',
      description: 'KPIs, embudo de conversión, rendimiento por proyecto y fuentes de leads. Ideal para reuniones de directorio.',
      icon: PieChart,
      color: 'text-primary',
      bg: 'bg-primary/10',
      format: 'PDF',
      action: handleExecutiveReport,
    },
    {
      title: 'Reporte Financiero',
      description: 'Ingresos, morosidad, créditos activos, cuotas vencidas y desglose mensual por proyecto.',
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-500/10',
      format: 'PDF',
      action: handleFinancialReport,
    },
    {
      title: 'Inventario de Lotes',
      description: 'Exporta el estado actual de todos los lotes por proyecto: disponibles, reservados y vendidos.',
      icon: BarChart3,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
      format: 'CSV',
      action: handleCSVExport,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportes Automáticos</h1>
          <p className="text-sm text-muted-foreground">Genera y descarga informes profesionales en un clic</p>
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Todos los proyectos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Proyectos</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.title} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-10 w-10 rounded-xl ${report.bg} flex items-center justify-center`}>
                  <report.icon className={`h-5 w-5 ${report.color}`} />
                </div>
                <Badge variant="outline" className="text-xs">{report.format}</Badge>
              </div>
              <CardTitle className="text-base">{report.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              <Button onClick={report.action} className="w-full gap-2">
                <Download className="h-4 w-4" />
                Descargar {report.format}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Próximamente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: 'Reporte de Morosidad', desc: 'Detalle de deudores, días de atraso y montos' },
              { title: 'Estado de Cuenta', desc: 'Historial de pagos por comprador individual' },
              { title: 'Comparativo Mensual', desc: 'Evolución mes a mes con gráficos de tendencia' },
              { title: 'Reporte de Comisiones', desc: 'Comisiones por agente y período' },
            ].map(item => (
              <div key={item.title} className="p-3 rounded-lg border border-dashed border-border">
                <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
