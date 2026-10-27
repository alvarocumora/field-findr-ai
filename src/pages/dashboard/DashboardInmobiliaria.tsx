import { 
  Users, 
  Building2, 
  DollarSign,
  BarChart3,
  MapPin,
  UserCheck,
  FileText,
  ChevronRight,
  Eye,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgencyStats, useAgencyAgents, useAgencyProperties } from '@/hooks/useDashboardStats';
import { LeadFormDialog } from '@/components/leads/LeadFormDialog';
import { ListingFormDialog } from '@/components/listings/ListingFormDialog';
import PlanLimitsCard from '@/components/subscription/PlanLimitsCard';
import { AgencyShowcaseSettings } from '@/components/agency/AgencyShowcaseSettings';
import { TeamActivityFeed } from '@/components/dashboard/TeamActivityFeed';
import TodayPanel from '@/components/dashboard/TodayPanel';

const DashboardInmobiliaria = () => {
  const { data: stats, isLoading: statsLoading } = useAgencyStats();
  const { data: agents, isLoading: agentsLoading } = useAgencyAgents();
  const { data: properties, isLoading: propertiesLoading } = useAgencyProperties();

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    return `$${value.toLocaleString('es-CL')}`;
  };

  const statsConfig = [
    { label: 'Agentes Activos', value: stats?.agentCount || 0, icon: Users, color: 'text-blue-500' },
    { label: 'Propiedades Totales', value: stats?.totalProperties || 0, icon: Building2, color: 'text-emerald-500' },
    { label: 'Ventas del Mes', value: formatCurrency(stats?.monthlySales || 0), icon: DollarSign, color: 'text-purple-500' },
    { label: 'Visitas Totales', value: (stats?.totalViews || 0).toLocaleString('es-CL'), icon: Eye, color: 'text-amber-500' },
  ];

  // Calculate team metrics
  const totalSales = agents?.reduce((sum, a) => sum + a.sales, 0) || 0;
  const totalLeads = agents?.reduce((sum, a) => sum + a.leads, 0) || 0;
  const avgConversion = agents && agents.length > 0 
    ? Math.round(agents.reduce((sum, a) => sum + a.conversion, 0) / agents.length) 
    : 0;

  return (
    <>
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
              <LeadFormDialog />
              <ListingFormDialog />
            </div>
          </div>

          {/* Pendientes del equipo, mismo bloque que el resto de los paneles */}
          <TodayPanel scope="team" title="Hoy en tu equipo" />

          {/* Plan usage & limits */}
          <PlanLimitsCard />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsConfig.map((stat, index) => (
              <Card key={index} className="border-border/40 bg-card/50 backdrop-blur">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      )}
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
                    {agentsLoading ? (
                      <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : agents && agents.length > 0 ? (
                      <div className="space-y-4">
                        {agents.slice(0, 5).map((agent, index) => (
                          <div key={agent.id} className="flex items-center gap-4">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                              {index + 1}
                            </div>
                            <Avatar className="h-10 w-10">
                              {agent.avatar && <AvatarImage src={agent.avatar} />}
                              <AvatarFallback className="bg-muted">
                                {agent.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
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
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <Users className="h-8 w-8 mb-2" />
                        <p>No hay agentes registrados</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Team Performance */}
                <Card className="border-border/40">
                  <CardHeader>
                    <CardTitle className="text-lg">Métricas de Equipo</CardTitle>
                    <CardDescription>Resumen consolidado</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {agentsLoading ? (
                      <>
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Ventas del equipo</span>
                            <span className="font-medium">{totalSales} ventas</span>
                          </div>
                          <Progress value={Math.min((totalSales / 30) * 100, 100)} className="h-3" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Conversión promedio</span>
                            <span className="font-medium">{avgConversion}%</span>
                          </div>
                          <Progress value={avgConversion} className="h-3" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Total leads activos</span>
                            <span className="font-medium">{totalLeads} leads</span>
                          </div>
                          <Progress value={Math.min((totalLeads / 100) * 100, 100)} className="h-3" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Agentes activos</span>
                            <span className="font-medium">{agents?.length || 0} agentes</span>
                          </div>
                          <Progress value={Math.min(((agents?.length || 0) / 10) * 100, 100)} className="h-3" />
                        </div>
                      </>
                    )}
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
              
              {propertiesLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-border/40">
                      <CardContent className="p-4">
                        <Skeleton className="aspect-video rounded-lg mb-3" />
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-6 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : properties && properties.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {properties.map((property) => (
                    <Card key={property.id} className="border-border/40 hover:border-primary/30 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="aspect-video rounded-lg bg-muted mb-3 flex items-center justify-center overflow-hidden">
                          {property.image ? (
                            <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
                          ) : (
                            <MapPin className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <h4 className="font-semibold text-foreground truncate">{property.title}</h4>
                        <p className="text-lg font-bold text-primary mt-1">{property.price}</p>
                        <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {property.views} visitas
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
              ) : (
                <Card className="border-border/40 p-8 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg">Sin propiedades</h3>
                  <p className="text-muted-foreground mt-2">No hay propiedades registradas en el sistema</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="performance">
              <Card className="border-border/40 p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">Análisis de Rendimiento</h3>
                <p className="text-muted-foreground mt-2">Próximamente: Gráficos interactivos y reportes detallados</p>
              </Card>
            </TabsContent>
          </Tabs>

          <TeamActivityFeed />

          <AgencyShowcaseSettings />
        </div>
      </div>
    </>
  );
};

export default DashboardInmobiliaria;
