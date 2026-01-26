import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Users, 
  DollarSign, 
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const Dashboard = () => {
  const kpis = [
    { 
      title: "Ingresos del Mes", 
      value: "$125.5M", 
      change: "+15.3%", 
      positive: true, 
      icon: DollarSign,
      detail: "vs mes anterior"
    },
    { 
      title: "Parcelas Vendidas", 
      value: "23", 
      change: "+8", 
      positive: true, 
      icon: CheckCircle,
      detail: "este mes"
    },
    { 
      title: "Leads Activos", 
      value: "147", 
      change: "+12%", 
      positive: true, 
      icon: Users,
      detail: "en pipeline"
    },
    { 
      title: "Tasa de Conversión", 
      value: "34%", 
      change: "-2%", 
      positive: false, 
      icon: TrendingUp,
      detail: "últimos 30 días"
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
    { name: "Los Aromos", value: 28, color: "hsl(var(--secondary))" },
    { name: "Pinar del Sol", value: 22, color: "hsl(var(--accent))" },
    { name: "Otros", value: 15, color: "hsl(var(--muted))" },
  ];

  const recentActivities = [
    { type: "sale", title: "Venta confirmada - Lote 45", project: "Valle Verde", time: "Hace 2 horas", status: "success" },
    { type: "lead", title: "Nuevo lead calificado", project: "Los Aromos", time: "Hace 4 horas", status: "info" },
    { type: "meeting", title: "Reunión con cliente potencial", project: "Pinar del Sol", time: "Hace 6 horas", status: "warning" },
    { type: "document", title: "Contrato firmado - Lote 23", project: "Valle Verde", time: "Hace 8 horas", status: "success" },
    { type: "alert", title: "Pago pendiente - Cliente #127", project: "Los Aromos", time: "Hace 1 día", status: "error" },
  ];

  const featuredProperties = [
    { 
      id: 1, 
      title: "Lote 45 - Valle Verde", 
      area: "5.2 há", 
      price: "$32.5M", 
      status: "Disponible",
      views: 234,
      inquiries: 12
    },
    { 
      id: 2, 
      title: "Lote 18 - Los Aromos", 
      area: "3.8 há", 
      price: "$28.0M", 
      status: "Reservado",
      views: 189,
      inquiries: 8
    },
    { 
      id: 3, 
      title: "Lote 32 - Pinar del Sol", 
      area: "7.5 há", 
      price: "$45.0M", 
      status: "Disponible",
      views: 312,
      inquiries: 18
    },
  ];

  const upcomingTasks = [
    { title: "Visita a terreno - Cliente González", date: "Hoy 15:00", priority: "high" },
    { title: "Firma de contrato - Lote 23", date: "Mañana 10:00", priority: "high" },
    { title: "Seguimiento lead #234", date: "25 Nov", priority: "medium" },
    { title: "Revisión de documentos", date: "26 Nov", priority: "low" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Ejecutivo</h1>
          <p className="text-muted-foreground">Vista general de tu negocio de parcelas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Este Mes
          </Button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <kpi.icon className="h-5 w-5 text-primary" />
              </div>
              <Badge variant={kpi.positive ? "default" : "secondary"}>
                {kpi.positive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {kpi.change}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
              <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.detail}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Tendencia de Ventas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Bar dataKey="ventas" fill="hsl(var(--primary))" />
              <Bar dataKey="ingresos" fill="hsl(var(--secondary))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Ventas por Proyecto</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projectsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {projectsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Actividad Reciente y Tareas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Actividad Reciente</h3>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                {getStatusIcon(activity.status)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.project}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Próximas Tareas</h3>
          <div className="space-y-3">
            {upcomingTasks.map((task, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{task.date}</span>
                  </div>
                </div>
                <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "secondary" : "outline"}>
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Propiedades Destacadas */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Propiedades Destacadas</h3>
          <Button variant="outline" size="sm">Ver Todas</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredProperties.map((property) => (
            <div key={property.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-foreground">{property.title}</h4>
                  <p className="text-sm text-muted-foreground">{property.area}</p>
                </div>
                <Badge variant={property.status === "Disponible" ? "default" : "secondary"}>
                  {property.status}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-primary mb-3">{property.price}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{property.views} vistas</span>
                <span>{property.inquiries} consultas</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
