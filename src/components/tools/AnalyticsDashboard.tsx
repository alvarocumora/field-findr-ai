import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, DollarSign, Users, MapPin, Calendar, ArrowUp, ArrowDown } from 'lucide-react';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

// Demo data
const salesData = [
  { month: 'Ene', ventas: 3, ingresos: 255000000 },
  { month: 'Feb', ventas: 5, ingresos: 425000000 },
  { month: 'Mar', ventas: 4, ingresos: 340000000 },
  { month: 'Abr', ventas: 7, ingresos: 595000000 },
  { month: 'May', ventas: 6, ingresos: 510000000 },
  { month: 'Jun', ventas: 8, ingresos: 680000000 },
];

const leadsBySource = [
  { name: 'Portal Inmobiliario', value: 35 },
  { name: 'Redes Sociales', value: 28 },
  { name: 'Referidos', value: 22 },
  { name: 'Página Web', value: 15 },
];

const projectPerformance = [
  { name: 'Loteo Norte', total: 50, vendidos: 35, reservados: 8, disponibles: 7 },
  { name: 'Parcelas Vista', total: 30, vendidos: 22, reservados: 5, disponibles: 3 },
  { name: 'Campo Verde', total: 40, vendidos: 15, reservados: 10, disponibles: 15 },
];

const conversionFunnel = [
  { stage: 'Leads', count: 150 },
  { stage: 'Contactados', count: 98 },
  { stage: 'Interesados', count: 45 },
  { stage: 'Negociando', count: 22 },
  { stage: 'Cerrados', count: 12 },
];

export const AnalyticsDashboard = () => {
  const [period, setPeriod] = useState('6m');

  const totalSales = salesData.reduce((acc, item) => acc + item.ventas, 0);
  const totalRevenue = salesData.reduce((acc, item) => acc + item.ingresos, 0);
  const avgTicket = totalRevenue / totalSales;
  const conversionRate = (12 / 150 * 100).toFixed(1);

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    trend 
  }: { 
    title: string; 
    value: string; 
    change: string;
    icon: any;
    trend: 'up' | 'down';
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <div className={`flex items-center gap-1 mt-1 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
              {trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {change}
            </div>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
          value={`${totalSales} lotes`}
          change="+23% vs anterior"
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          title="Ingresos"
          value={`$${(totalRevenue / 1000000).toFixed(0)}M`}
          change="+18% vs anterior"
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          title="Ticket Promedio"
          value={`$${(avgTicket / 1000000).toFixed(0)}M`}
          change="-5% vs anterior"
          icon={MapPin}
          trend="down"
        />
        <StatCard
          title="Tasa Conversión"
          value={`${conversionRate}%`}
          change="+2.1% vs anterior"
          icon={Users}
          trend="up"
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
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsBySource}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {leadsBySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {leadsBySource.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[i] }} 
                    />
                    <span className="text-sm flex-1">{item.name}</span>
                    <Badge variant="secondary">{item.value}%</Badge>
                  </div>
                ))}
              </div>
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
                const width = (item.count / conversionFunnel[0].count) * 100;
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
                        style={{ width: `${width}%`, backgroundColor: color }}
                      >
                        {width.toFixed(0)}%
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
