import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, DollarSign, Users, MapPin, ArrowUp, ArrowDown, BarChart3 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useLots } from '@/hooks/useLots';
import { useLeads, LEAD_STATUS_CONFIG, LeadStatus } from '@/hooks/useLeads';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export const AnalyticsDashboard = () => {
  const [period, setPeriod] = useState('6m');
  const { projects, isLoading: projectsLoading, stats: projectStats } = useProjects();
  const { lots, isLoading: lotsLoading, stats: lotStats } = useLots();
  const { leads, isLoading: leadsLoading, stats: leadStats } = useLeads();

  const isLoading = projectsLoading || lotsLoading || leadsLoading;

  // Calculate real metrics
  const totalRevenue = lots
    .filter(l => l.status === 'sold')
    .reduce((acc, l) => acc + Number(l.price || 0), 0);
  
  const avgTicket = lotStats.sold > 0 ? totalRevenue / lotStats.sold : 0;
  
  const conversionRate = leadStats.total > 0 
    ? ((leadStats.statusCounts.converted || 0) / leadStats.total * 100).toFixed(1)
    : '0';

  // Lead sources breakdown
  const leadsBySource = leads.reduce((acc, lead) => {
    const source = lead.source || 'Desconocido';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const leadsBySourceData = Object.entries(leadsBySource)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Project performance data
  const projectPerformance = projects.map(p => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
    vendidos: p.sold_lots || 0,
    reservados: p.reserved_lots || 0,
    disponibles: p.available_lots || 0,
  }));

  // Conversion funnel from leads
  const conversionFunnel = [
    { stage: 'Leads', count: leadStats.total },
    { stage: 'Contactados', count: leadStats.statusCounts.contacted || 0 },
    { stage: 'Interesados', count: leadStats.statusCounts.interested || 0 },
    { stage: 'Negociando', count: leadStats.statusCounts.negotiating || 0 },
    { stage: 'Cerrados', count: leadStats.statusCounts.converted || 0 },
  ];

  // Sales trend (grouped by month from lots with sale_date)
  const salesByMonth = lots
    .filter(l => l.sale_date)
    .reduce((acc, lot) => {
      const date = new Date(lot.sale_date!);
      const monthKey = date.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' });
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, ventas: 0, ingresos: 0 };
      }
      acc[monthKey].ventas += 1;
      acc[monthKey].ingresos += Number(lot.price || 0);
      return acc;
    }, {} as Record<string, { month: string; ventas: number; ingresos: number }>);

  const salesData = Object.values(salesByMonth).slice(-6);

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend 
  }: { 
    title: string; 
    value: string; 
    subtitle?: string;
    icon: React.ElementType;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <div className={`flex items-center gap-1 mt-1 text-sm ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {trend === 'up' && <ArrowUp className="h-3 w-3" />}
                {trend === 'down' && <ArrowDown className="h-3 w-3" />}
                {subtitle}
              </div>
            )}
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      </div>
    );
  }

  const hasData = projects.length > 0 || lots.length > 0 || leads.length > 0;

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Dashboard Analítico</h2>
            <p className="text-muted-foreground">Métricas de rendimiento en tiempo real</p>
          </div>
        </div>
        <Card className="p-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin datos para mostrar</h3>
          <p className="text-muted-foreground">
            Agrega proyectos, lotes y leads para ver las métricas del dashboard
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Analítico</h2>
          <p className="text-muted-foreground">Métricas de rendimiento en tiempo real</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Último mes</SelectItem>
            <SelectItem value="3m">3 meses</SelectItem>
            <SelectItem value="6m">6 meses</SelectItem>
            <SelectItem value="1y">1 año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ventas Totales"
          value={`${lotStats.sold} lotes`}
          subtitle={`de ${lotStats.total} totales`}
          icon={TrendingUp}
          trend="neutral"
        />
        <StatCard
          title="Ingresos"
          value={`$${(totalRevenue / 1000000).toFixed(0)}M`}
          subtitle={totalRevenue > 0 ? 'Ventas cerradas' : 'Sin ventas aún'}
          icon={DollarSign}
          trend={totalRevenue > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          title="Ticket Promedio"
          value={avgTicket > 0 ? `$${(avgTicket / 1000000).toFixed(0)}M` : '-'}
          subtitle={lotStats.sold > 0 ? `${lotStats.sold} ventas` : 'Sin ventas'}
          icon={MapPin}
          trend="neutral"
        />
        <StatCard
          title="Tasa Conversión"
          value={`${conversionRate}%`}
          subtitle={`${leadStats.statusCounts.converted || 0} de ${leadStats.total} leads`}
          icon={Users}
          trend={Number(conversionRate) > 5 ? 'up' : 'neutral'}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendencia de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="ventas" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary) / 0.2)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No hay ventas registradas con fecha
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leads by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leads por Fuente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center">
              {leadsBySourceData.length > 0 ? (
                <>
                  <ResponsiveContainer width="50%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadsBySourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {leadsBySourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {leadsBySourceData.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[i % COLORS.length] }} 
                        />
                        <span className="text-sm flex-1 truncate">{item.name}</span>
                        <Badge variant="secondary">{item.value}</Badge>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full text-center text-muted-foreground">
                  No hay leads con fuente registrada
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rendimiento por Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {projectPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Bar dataKey="vendidos" stackId="a" fill="#10b981" name="Vendidos" />
                    <Bar dataKey="reservados" stackId="a" fill="#f59e0b" name="Reservados" />
                    <Bar dataKey="disponibles" stackId="a" fill="#3b82f6" name="Disponibles" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No hay proyectos creados
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Embudo de Conversión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversionFunnel.map((item, i) => {
                const maxCount = conversionFunnel[0].count || 1;
                const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                const color = COLORS[i % COLORS.length];
                return (
                  <div key={item.stage}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.stage}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                    <div className="h-8 bg-muted rounded-lg overflow-hidden">
                      <div 
                        className="h-full rounded-lg flex items-center justify-end pr-2 text-white text-xs font-medium transition-all"
                        style={{ width: `${Math.max(width, 5)}%`, backgroundColor: color }}
                      >
                        {width > 10 ? `${width.toFixed(0)}%` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
