import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useMultiProjectMetrics } from '@/hooks/useMultiProjectMetrics';
import { useLots } from '@/hooks/useLots';
import { marketplacePublishStats, publishStatsByProject } from '@/lib/marketplace/publishStats';
import {
  Building2, Grid3X3, TrendingUp, DollarSign, Users, AlertTriangle,
  ArrowUpRight, ArrowDownRight, BarChart3, Target, Store, ExternalLink,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const MultiProjectDashboard = () => {
  const { projects, isLoading: projLoading } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const { data: metrics, isLoading: metricsLoading } = useMultiProjectMetrics(
    selectedProject === 'all' ? undefined : selectedProject
  );
  const { lots } = useLots();

  const isLoading = projLoading || metricsLoading;

  const scopedLots = (selectedProject === 'all'
    ? lots
    : lots.filter((l) => l.project_id === selectedProject)) as Array<{ project_id?: string | null; listing_id?: string | null }>;
  const pubStats = marketplacePublishStats(scopedLots);
  const pubByProject = publishStatsByProject(scopedLots);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const kpis = [
    { label: 'Proyectos Activos', value: String(metrics.activeProjects), icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Lotes Totales', value: String(metrics.totalLots), icon: Grid3X3, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: 'Lotes Vendidos', value: String(metrics.soldLots), icon: ArrowUpRight, color: 'text-green-600', bg: 'bg-green-500/10' },
    { label: 'Lotes Disponibles', value: String(metrics.availableLots), icon: Target, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: 'Publicados', value: `${pubStats.published}/${pubStats.total}`, icon: Store, color: 'text-teal-600', bg: 'bg-teal-500/10' },
    { label: 'Ingresos Reservas', value: formatCLP(metrics.reservationRevenue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-500/10' },
    { label: 'Ingresos Créditos', value: formatCLP(metrics.creditRevenue), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: 'Leads Activos', value: String(metrics.activeLeads), icon: Users, color: 'text-purple-600', bg: 'bg-purple-500/10' },
    { label: 'Cuotas Vencidas', value: String(metrics.overduePayments), icon: AlertTriangle, color: metrics.overduePayments > 0 ? 'text-red-600' : 'text-muted-foreground', bg: metrics.overduePayments > 0 ? 'bg-red-500/10' : 'bg-muted' },
  ];

  const lotStatusData = [
    { name: 'Disponibles', value: metrics.availableLots },
    { name: 'Reservados', value: metrics.reservedLots },
    { name: 'Vendidos', value: metrics.soldLots },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Multi-Proyecto</h1>
          <p className="text-sm text-muted-foreground">Vista consolidada de todos tus proyectos</p>
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

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
                  <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Comparison Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Comparativo por Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.projectComparison.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin datos aún</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={metrics.projectComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="sold" name="Vendidos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="reserved" name="Reservados" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="available" name="Disponibles" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Lot Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribución de Lotes</CardTitle>
          </CardHeader>
          <CardContent>
            {lotStatusData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin lotes registrados</p>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="60%" height={220}>
                  <PieChart>
                    <Pie data={lotStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {lotStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {lotStatusData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-foreground">{d.name}: <strong>{d.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-Project Cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Detalle por Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.projectDetails.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sin proyectos activos</p>
          ) : (
            <div className="space-y-4">
              {metrics.projectDetails.map((proj) => {
                const total = proj.totalLots || 1;
                const soldPct = Math.round((proj.soldLots / total) * 100);
                const pub = pubByProject.get(proj.id) ?? { total: 0, published: 0, unpublished: 0 };
                return (
                  <div key={proj.id} className="p-4 rounded-lg border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{proj.name}</p>
                        <p className="text-xs text-muted-foreground">{proj.city || proj.location || 'Sin ubicación'}</p>
                      </div>
                      <Badge variant={soldPct >= 75 ? 'default' : soldPct >= 40 ? 'secondary' : 'outline'}>
                        {soldPct}% vendido
                      </Badge>
                    </div>
                    <Progress value={soldPct} className="h-2" />
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div><p className="text-muted-foreground">Total</p><p className="font-bold text-foreground">{proj.totalLots}</p></div>
                      <div><p className="text-muted-foreground">Disp.</p><p className="font-bold text-green-600">{proj.availableLots}</p></div>
                      <div><p className="text-muted-foreground">Reserv.</p><p className="font-bold text-amber-600">{proj.reservedLots}</p></div>
                      <div><p className="text-muted-foreground">Vend.</p><p className="font-bold text-primary">{proj.soldLots}</p></div>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Store className="h-3.5 w-3.5 text-teal-600" />
                        Publicados en marketplace: <span className="font-semibold text-foreground">{pub.published}/{pub.total}</span>
                        {pub.unpublished > 0 && <span className="text-amber-600">· {pub.unpublished} sin publicar</span>}
                      </span>
                      <Link to={`/proyecto/${proj.id}`} className="flex items-center gap-1 text-primary hover:underline">
                        Gestionar <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiProjectDashboard;
