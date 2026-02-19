import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3, TrendingUp, DollarSign, Users, MapPin, Building2,
  Target, PieChart,
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useLots } from '@/hooks/useLots';
import { useLeads } from '@/hooks/useLeads';
import { useCredits } from '@/hooks/useCredits';
import { formatPriceLatam } from '@/lib/latam';

const ExecutiveDashboard = () => {
  const { projects, isLoading: projectsLoading } = useProjects();
  const { lots, isLoading: lotsLoading } = useLots();
  const { leads = [], isLoading: leadsLoading } = useLeads();
  const { data: credits = [], isLoading: creditsLoading } = useCredits();

  const isLoading = projectsLoading || lotsLoading || leadsLoading || creditsLoading;

  const kpis = useMemo(() => {
    const totalRevenue = lots
      .filter(l => l.status === 'sold')
      .reduce((s, l) => s + Number(l.price || 0), 0);

    const reservedRevenue = lots
      .filter(l => l.status === 'reserved')
      .reduce((s, l) => s + Number(l.price || 0), 0);

    const availableValue = lots
      .filter(l => l.status === 'available')
      .reduce((s, l) => s + Number(l.price || 0), 0);

    const totalLots = lots.length;
    const soldLots = lots.filter(l => l.status === 'sold').length;
    const reservedLots = lots.filter(l => l.status === 'reserved').length;
    const availableLots = lots.filter(l => l.status === 'available').length;

    const conversionRate = totalLots > 0
      ? ((soldLots + reservedLots) / totalLots * 100).toFixed(1)
      : '0';

    const activeCredits = credits.filter(c => c.status === 'active');
    const totalFinanced = activeCredits.reduce((s, c) => s + Number(c.financed_amount), 0);
    const monthlyRecurring = activeCredits.reduce((s, c) => s + Number(c.monthly_payment), 0);

    const hotLeads = (leads as any[]).filter(l => (l.lead_score || 0) >= 70).length;

    return {
      totalRevenue, reservedRevenue, availableValue,
      totalLots, soldLots, reservedLots, availableLots,
      conversionRate,
      totalFinanced, monthlyRecurring,
      totalLeads: leads.length, hotLeads,
      totalProjects: projects.length,
    };
  }, [projects, lots, leads, credits]);

  const fmt = (v: number) => formatPriceLatam(v, 'CLP');

  // Per-project breakdown
  const projectBreakdown = useMemo(() => {
    return projects.map(p => {
      const projectLots = lots.filter(l => l.project_id === p.id);
      const sold = projectLots.filter(l => l.status === 'sold');
      const reserved = projectLots.filter(l => l.status === 'reserved');
      const available = projectLots.filter(l => l.status === 'available');
      const revenue = sold.reduce((s, l) => s + Number(l.price || 0), 0);
      const pipeline = reserved.reduce((s, l) => s + Number(l.price || 0), 0);

      return {
        id: p.id,
        name: p.name,
        location: p.location || p.city || '',
        totalLots: projectLots.length,
        sold: sold.length,
        reserved: reserved.length,
        available: available.length,
        revenue,
        pipeline,
        progress: projectLots.length > 0 ? Math.round((sold.length / projectLots.length) * 100) : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [projects, lots]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Ejecutivo</h1>
        <p className="text-sm text-muted-foreground">Vista consolidada cross-proyecto</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Revenue Total', value: fmt(kpis.totalRevenue), icon: DollarSign, color: 'text-green-600 bg-green-500/10' },
          { label: 'Pipeline Reservas', value: fmt(kpis.reservedRevenue), icon: Target, color: 'text-amber-600 bg-amber-500/10' },
          { label: 'Inventario Disponible', value: fmt(kpis.availableValue), icon: Building2, color: 'text-blue-600 bg-blue-500/10' },
          { label: 'Ingresos Recurrentes', value: fmt(kpis.monthlyRecurring) + '/mes', icon: TrendingUp, color: 'text-purple-600 bg-purple-500/10' },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-lg font-bold text-foreground">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Operational KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Proyectos', value: kpis.totalProjects, sub: 'activos' },
          { label: 'Lotes Totales', value: kpis.totalLots, sub: `${kpis.availableLots} disponibles` },
          { label: 'Vendidos', value: kpis.soldLots, sub: `${kpis.conversionRate}% conversión` },
          { label: 'Leads', value: kpis.totalLeads, sub: `${kpis.hotLeads} hot leads` },
          { label: 'Créditos Activos', value: credits.filter(c => c.status === 'active').length, sub: fmt(kpis.totalFinanced) },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-xs text-muted-foreground/70">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Comparativa por Proyecto
          </CardTitle>
          <CardDescription>Revenue, conversión y disponibilidad por proyecto</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {projectBreakdown.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No hay proyectos registrados aún
              </div>
            ) : (
              projectBreakdown.map(p => (
                <div key={p.id} className="px-4 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
                      {p.location && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{p.location}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{p.totalLots} lotes</span>
                      <Badge variant="outline" className="text-xs">{p.sold} vendidos</Badge>
                      <Badge variant="outline" className="text-xs">{p.reserved} reservados</Badge>
                      <Badge variant="outline" className="text-xs">{p.available} disponibles</Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{fmt(p.revenue)}</p>
                    <p className="text-xs text-muted-foreground">Pipeline: {fmt(p.pipeline)}</p>
                  </div>
                  <div className="w-16 shrink-0">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-1">{p.progress}%</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutiveDashboard;
