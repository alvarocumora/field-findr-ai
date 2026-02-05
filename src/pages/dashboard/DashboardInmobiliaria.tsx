import { useState } from 'react';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign,
  BarChart3,
  MapPin,
  UserCheck,
  FileText,
  ChevronRight,
  Plus,
  Eye,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';

const DashboardInmobiliaria = () => {
  // Placeholder data
  const stats = [
    { label: 'Agentes Activos', value: '8', change: '+2', icon: Users, color: 'text-blue-500' },
    { label: 'Propiedades Totales', value: '156', change: '+12', icon: Building2, color: 'text-emerald-500' },
    { label: 'Ventas del Mes', value: '$18.5M', change: '+32%', icon: DollarSign, color: 'text-purple-500' },
    { label: 'Visitas Mensuales', value: '2.4k', change: '+15%', icon: Eye, color: 'text-amber-500' },
  ];

  const agents = [
    { id: '1', name: 'Carlos Mendoza', sales: 5, leads: 18, conversion: 28, avatar: null },
    { id: '2', name: 'María González', sales: 7, leads: 22, conversion: 32, avatar: null },
    { id: '3', name: 'Juan Pérez', sales: 3, leads: 14, conversion: 21, avatar: null },
    { id: '4', name: 'Ana Silva', sales: 4, leads: 16, conversion: 25, avatar: null },
  ];

  const recentProperties = [
    { id: '1', title: 'Parcela Premium Las Condes', price: '$180.000.000', views: 234, leads: 8, status: 'active' },
    { id: '2', title: 'Terreno Industrial Pudahuel', price: '$450.000.000', views: 156, leads: 5, status: 'active' },
    { id: '3', title: 'Campo Agrícola Maule', price: '$320.000.000', views: 89, leads: 3, status: 'reserved' },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container py-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard Inmobiliaria</h1>
              <p className="text-muted-foreground mt-1">Gestiona tu equipo, propiedades y rendimiento comercial</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="rounded-xl gap-2">
                <FileText className="h-4 w-4" />
                Reportes
              </Button>
              <Button className="rounded-xl gap-2">
                <Plus className="h-4 w-4" />
                Agregar Agente
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="border-border/40 bg-card/50 backdrop-blur">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <Badge variant="secondary" className="text-xs">
                        {stat.change}
                      </Badge>
                    </div>
                    <div className={`h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content */}
          <Tabs defaultValue="team" className="space-y-6">
            <TabsList className="bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="team" className="rounded-lg gap-2">
                <UserCheck className="h-4 w-4" />
                Equipo
              </TabsTrigger>
              <TabsTrigger value="properties" className="rounded-lg gap-2">
                <Building2 className="h-4 w-4" />
                Propiedades
              </TabsTrigger>
              <TabsTrigger value="performance" className="rounded-lg gap-2">
                <BarChart3 className="h-4 w-4" />
                Rendimiento
              </TabsTrigger>
            </TabsList>

            <TabsContent value="team" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Agent Leaderboard */}
                <Card className="border-border/40">
                  <CardHeader>
                    <CardTitle className="text-lg">Ranking de Agentes</CardTitle>
                    <CardDescription>Rendimiento del mes actual</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {agents.sort((a, b) => b.sales - a.sales).map((agent, index) => (
                        <div key={agent.id} className="flex items-center gap-4">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {index + 1}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-muted">
                              {agent.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{agent.name}</p>
                            <p className="text-xs text-muted-foreground">{agent.leads} leads • {agent.conversion}% conversión</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground">{agent.sales}</p>
                            <p className="text-xs text-muted-foreground">ventas</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Team Performance */}
                <Card className="border-border/40">
                  <CardHeader>
                    <CardTitle className="text-lg">Métricas de Equipo</CardTitle>
                    <CardDescription>Resumen consolidado</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Meta de ventas mensual</span>
                        <span className="font-medium">$18.5M / $25M</span>
                      </div>
                      <Progress value={74} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Conversión de leads</span>
                        <span className="font-medium">26.5%</span>
                      </div>
                      <Progress value={26} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Propiedades vendidas</span>
                        <span className="font-medium">19 / 30</span>
                      </div>
                      <Progress value={63} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Satisfacción del cliente</span>
                        <span className="font-medium">4.8 / 5.0</span>
                      </div>
                      <Progress value={96} className="h-3" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="properties" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Propiedades Recientes</h3>
                <Button variant="ghost" size="sm" className="text-primary gap-1">
                  Ver todas <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentProperties.map((property) => (
                  <Card key={property.id} className="border-border/40 hover:border-primary/30 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="aspect-video rounded-lg bg-muted mb-3 flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h4 className="font-semibold text-foreground truncate">{property.title}</h4>
                      <p className="text-lg font-bold text-primary mt-1">{property.price}</p>
                      <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {property.views} visitas
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {property.leads} leads
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={property.status === 'reserved' ? 'bg-amber-500/10 text-amber-500' : ''}
                        >
                          {property.status === 'reserved' ? 'Reservada' : 'Activa'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance">
              <Card className="border-border/40 p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">Análisis de Rendimiento</h3>
                <p className="text-muted-foreground mt-2">Próximamente: Gráficos interactivos y reportes detallados</p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardInmobiliaria;
