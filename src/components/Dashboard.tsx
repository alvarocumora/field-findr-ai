import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { 
  DollarSign, 
  CheckCircle, 
  Users, 
  TrendingUp,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DashboardHeader } from './dashboard/DashboardHeader';
import { KPICard } from './dashboard/KPICard';
import { ActivityFeed } from './dashboard/ActivityFeed';
import { QuickActions } from './dashboard/QuickActions';
import { PropertyInsights } from './dashboard/PropertyInsights';

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const kpis = [
    { 
      title: "Ingresos del Mes", 
      value: "$125.5M", 
      change: "+15.3%", 
      positive: true, 
      icon: DollarSign,
      changeLabel: "vs mes anterior",
      sparklineData: [
        { value: 85 }, { value: 92 }, { value: 88 }, 
        { value: 105 }, { value: 98 }, { value: 125 }
      ]
    },
    { 
      title: "Parcelas Vendidas", 
      value: "23", 
      change: "+8", 
      positive: true, 
      icon: CheckCircle,
      changeLabel: "este mes",
      sparklineData: [
        { value: 15 }, { value: 18 }, { value: 16 }, 
        { value: 20 }, { value: 19 }, { value: 23 }
      ]
    },
    { 
      title: "Leads Activos", 
      value: "147", 
      change: "+12%", 
      positive: true, 
      icon: Users,
      changeLabel: "en pipeline",
      sparklineData: [
        { value: 120 }, { value: 125 }, { value: 138 }, 
        { value: 142 }, { value: 140 }, { value: 147 }
      ]
    },
    { 
      title: "Tasa de Conversión", 
      value: "34%", 
      change: "-2%", 
      positive: false, 
      icon: TrendingUp,
      changeLabel: "últimos 30 días",
      sparklineData: [
        { value: 38 }, { value: 36 }, { value: 37 }, 
        { value: 35 }, { value: 36 }, { value: 34 }
      ]
    },
  ];

  const salesData = [
    { month: "Ene", ventas: 15, ingresos: 85 },
    { month: "Feb", ventas: 18, ingresos: 95 },
    { month: "Mar", ventas: 22, ingresos: 110 },
    { month: "Abr", ventas: 19, ingresos: 98 },
    { month: "May", ventas: 25, ingresos: 125 },
    { month: "Jun", ventas: 23, ingresos: 115 },
  ];

  const projectsData = [
    { name: "Valle Verde", value: 35, color: "hsl(var(--primary))" },
    { name: "Los Aromos", value: 28, color: "hsl(var(--accent))" },
    { name: "Pinar del Sol", value: 22, color: "hsl(38, 92%, 50%)" },
    { name: "Otros", value: 15, color: "hsl(var(--muted-foreground))" },
  ];

  const recentActivities = [
    { 
      id: '1',
      type: 'sale' as const, 
      title: "Venta confirmada - Lote 45", 
      project: "Valle Verde", 
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), 
      status: 'success' as const 
    },
    { 
      id: '2',
      type: 'lead' as const, 
      title: "Nuevo lead calificado", 
      description: "Cliente interesado en parcelas de 5+ hectáreas",
      project: "Los Aromos", 
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), 
      status: 'info' as const 
    },
    { 
      id: '3',
      type: 'meeting' as const, 
      title: "Reunión con cliente potencial", 
      project: "Pinar del Sol", 
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), 
      status: 'warning' as const 
    },
    { 
      id: '4',
      type: 'document' as const, 
      title: "Contrato firmado - Lote 23", 
      project: "Valle Verde", 
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), 
      status: 'success' as const 
    },
    { 
      id: '5',
      type: 'alert' as const, 
      title: "Pago pendiente - Cliente #127", 
      description: "Vencimiento en 3 días",
      project: "Los Aromos", 
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), 
      status: 'error' as const 
    },
  ];

  const featuredProperties = [
    { 
      id: '1', 
      title: "Lote 45 - Valle Verde", 
      area: "5.2 há", 
      price: "$32.5M", 
      status: 'available' as const,
      views: 234,
      inquiries: 12,
      trend: 'up' as const,
      score: 85
    },
    { 
      id: '2', 
      title: "Lote 18 - Los Aromos", 
      area: "3.8 há", 
      price: "$28.0M", 
      status: 'reserved' as const,
      views: 189,
      inquiries: 8,
      score: 72
    },
    { 
      id: '3', 
      title: "Lote 32 - Pinar del Sol", 
      area: "7.5 há", 
      price: "$45.0M", 
      status: 'available' as const,
      views: 312,
      inquiries: 18,
      trend: 'up' as const,
      score: 92
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <DashboardHeader
        userName="Agente"
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        notificationCount={3}
        onExport={() => console.log('Export')}
      />

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            changeLabel={kpi.changeLabel}
            positive={kpi.positive}
            icon={kpi.icon}
            sparklineData={kpi.sparklineData}
            delay={index + 1}
          />
        ))}
      </div>

      {/* Quick Actions + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickActions className="lg:col-span-1" />
        <ActivityFeed 
          activities={recentActivities} 
          maxItems={5}
          className="lg:col-span-2"
        />
      </div>

      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Tendencia de Ventas</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar 
                dataKey="ventas" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="Ventas"
              />
              <Bar 
                dataKey="ingresos" 
                fill="hsl(var(--accent))" 
                radius={[4, 4, 0, 0]}
                name="Ingresos (M)"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Ventas por Proyecto</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={projectsData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {projectsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {projectsData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Propiedades Destacadas */}
      <PropertyInsights 
        properties={featuredProperties}
        maxItems={3}
        onViewAll={() => console.log('View all')}
        onViewProperty={(id) => console.log('View property', id)}
      />
    </div>
  );
};

export default Dashboard;
