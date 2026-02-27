import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinancialDashboard } from '@/hooks/useFinancialDashboard';
import {
  DollarSign, TrendingUp, AlertTriangle, CreditCard,
  BarChart3, ArrowUpRight, ArrowDownRight, Clock,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const FinancialDashboard = () => {
  const { data: metrics, isLoading } = useFinancialDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (!metrics) return null;

  const kpis = [
    { label: 'Ingresos Totales', value: formatCLP(metrics.totalRevenue), icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-500/10' },
    { label: 'Pendiente de Cobro', value: formatCLP(metrics.pendingRevenue), icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
    { label: 'Tasa Conversión', value: `${metrics.conversionRate}%`, icon: TrendingUp, color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
    { label: 'Morosidad', value: formatCLP(metrics.overdueAmount), icon: AlertTriangle, color: metrics.overdueAmount > 0 ? 'text-red-600' : 'text-muted-foreground', bgColor: metrics.overdueAmount > 0 ? 'bg-red-500/10' : 'bg-muted' },
    { label: 'Reservas Pagadas', value: `${metrics.paidReservations}/${metrics.totalReservations}`, icon: ArrowUpRight, color: 'text-green-600', bgColor: 'bg-green-500/10' },
    { label: 'Reservas Expiradas', value: String(metrics.expiredReservations), icon: ArrowDownRight, color: 'text-red-500', bgColor: 'bg-red-500/10' },
    { label: 'Créditos Activos', value: String(metrics.activeCredits), icon: CreditCard, color: 'text-primary', bgColor: 'bg-primary/10' },
    { label: 'Cuotas Vencidas', value: String(metrics.overduePayments), icon: AlertTriangle, color: metrics.overduePayments > 0 ? 'text-red-600' : 'text-muted-foreground', bgColor: metrics.overduePayments > 0 ? 'bg-red-500/10' : 'bg-muted' },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Financiero</h1>
        <p className="text-sm text-muted-foreground">Vista consolidada de ingresos, morosidad y conversiones</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${kpi.bgColor} flex items-center justify-center shrink-0`}>
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
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Ingresos Mensuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={metrics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(v: number) => formatCLP(v)}
                  labelFormatter={(l) => `Mes: ${l}`}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="revenue" name="Ingresos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rendimiento por Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.projectBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin datos de proyectos aún</p>
            ) : (
              <div className="space-y-3">
                {metrics.projectBreakdown.map((proj) => (
                  <div key={proj.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{proj.name}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <span>{proj.reservations} reservas</span>
                        <span>Conversión: {proj.conversion}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">{formatCLP(proj.revenue)}</p>
                      <Badge variant={proj.conversion >= 50 ? 'default' : 'secondary'} className="text-[10px] mt-1">
                        {proj.conversion >= 50 ? 'Alto' : proj.conversion >= 25 ? 'Medio' : 'Bajo'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialDashboard;
