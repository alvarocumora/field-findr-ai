import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { UpcomingFollowUps } from './dashboard/UpcomingFollowUps';
import { PropertyInsights } from './dashboard/PropertyInsights';
import { useAuth } from '@/hooks/useAuth';
import {
  useDashboardKPIs,
  useDashboardActivity,
  useDashboardProperties,
  useSalesChartData,
  useProjectSalesDistribution,
} from '@/hooks/useDashboardData';

const formatCurrency = (value: number) => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
  return `$${value.toLocaleString('es-CL')}`;
};

const Dashboard = () => {
  const { user } = useAuth();
  
  const { data: kpiData, isLoading: kpiLoading } = useDashboardKPIs();
  const { data: activities = [], isLoading: activitiesLoading } = useDashboardActivity();
  const { data: properties = [], isLoading: propertiesLoading } = useDashboardProperties();
  const { data: salesData = [], isLoading: salesLoading } = useSalesChartData();
  const { data: projectsData = [], isLoading: projectsLoading } = useProjectSalesDistribution();

  const kpis = [
    { 
      title: "Ingresos del Mes", 
      value: kpiLoading ? '...' : formatCurrency(kpiData?.monthlyRevenue || 0), 
      change: kpiData?.monthlyRevenue ? '+' : undefined,
      positive: true, 
      icon: DollarSign,
      changeLabel: "este mes",
    },
    { 
      title: "Parcelas Vendidas", 
      value: kpiLoading ? '...' : String(kpiData?.soldCount || 0), 
      change: kpiData?.soldCount ? `+${kpiData.soldCount}` : undefined,
      positive: true, 
      icon: CheckCircle,
      changeLabel: "este mes",
    },
    { 
      title: "Leads Activos", 
      value: kpiLoading ? '...' : String(kpiData?.activeLeads || 0), 
      positive: true, 
      icon: Users,
      changeLabel: "en pipeline",
    },
    { 
      title: "Tasa de Conversión", 
      value: kpiLoading ? '...' : `${kpiData?.conversionRate || 0}%`, 
      positive: (kpiData?.conversionRate || 0) > 0, 
      icon: TrendingUp,
      changeLabel: "lotes vendidos / total",
    },
  ];

  const userName = user?.user_metadata?.first_name || 'Agente';

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <DashboardHeader userName={userName} />

      {/* KPIs */}
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
            delay={index + 1}
          />
        ))}
      </div>

      {/* Quick Actions + Follow-ups + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <QuickActions />
          <UpcomingFollowUps />
        </div>
        <ActivityFeed 
          activities={activities} 
          maxItems={5}
          className="lg:col-span-2"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Tendencia de Ventas</h3>
          {salesLoading ? (
            <Skeleton className="w-full h-[280px]" />
          ) : salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="ventas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Ventas" />
                <Bar dataKey="ingresos" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Ingresos (M)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
              Sin datos de ventas aún
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Ventas por Proyecto</h3>
          {projectsLoading ? (
            <Skeleton className="w-full h-[280px]" />
          ) : projectsData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={projectsData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {projectsData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {projectsData.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
              Sin datos de proyectos aún
            </div>
          )}
        </Card>
      </div>

      {/* Properties */}
      <PropertyInsights 
        properties={properties}
        maxItems={3}
        onViewAll={() => console.log('View all')}
        onViewProperty={(id) => console.log('View property', id)}
      />
    </div>
  );
};

export default Dashboard;
