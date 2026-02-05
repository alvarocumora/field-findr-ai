import { 
  Users, 
  Building2, 
  MessageSquare,
  Phone,
  Target,
  Clock,
  ChevronRight,
  Plus,
  DollarSign,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import Layout from '@/components/Layout';
import { useAgentStats, useAgentLeads, useAgentGoals } from '@/hooks/useDashboardStats';

const DashboardAsesor = () => {
  const { data: stats, isLoading: statsLoading } = useAgentStats();
  const { data: leads, isLoading: leadsLoading } = useAgentLeads();
  const { data: goals, isLoading: goalsLoading } = useAgentGoals();

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    return `$${value.toLocaleString('es-CL')}`;
  };

  const statsConfig = [
    { label: 'Leads Activos', value: stats?.activeLeads || 0, icon: Users, color: 'text-blue-500' },
    { label: 'Propiedades', value: stats?.properties || 0, icon: Building2, color: 'text-emerald-500' },
    { label: 'Ventas del Mes', value: formatCurrency(stats?.monthlySales || 0), icon: DollarSign, color: 'text-purple-500' },
    { label: 'Lotes Vendidos', value: stats?.soldCount || 0, icon: Target, color: 'text-amber-500' },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      hot: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', label: 'Caliente' },
      warm: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', label: 'Tibio' },
      cold: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', label: 'Frío' },
    };
    return styles[status as keyof typeof styles] || styles.cold;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container py-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mi Dashboard</h1>
              <p className="text-muted-foreground mt-1">Gestiona tus leads, propiedades y citas</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="rounded-xl gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Lead
              </Button>
              <Button className="rounded-xl gap-2">
                <Building2 className="h-4 w-4" />
                Nueva Propiedad
              </Button>
            </div>
          </div>

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

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Leads Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Leads Recientes</h2>
                <Button variant="ghost" size="sm" className="text-primary gap-1">
                  Ver todos <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {leadsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : leads && leads.length > 0 ? (
                <div className="space-y-3">
                  {leads.map((lead) => {
                    const status = getStatusBadge(lead.status);
                    return (
                      <Card key={lead.id} className="border-border/40 hover:border-primary/30 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-foreground truncate">{lead.name}</h4>
                                <Badge variant="outline" className={`${status.bg} ${status.text} ${status.border} text-xs`}>
                                  {status.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{lead.interest}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {lead.budget}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {lead.lastContact}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="border-border/40 p-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg">Sin leads aún</h3>
                  <p className="text-muted-foreground mt-2">Agrega tu primer lead para comenzar a gestionar</p>
                  <Button className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar Lead
                  </Button>
                </Card>
              )}
            </div>

            {/* Goals Column */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Metas del Mes</h2>
              
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Progreso de Metas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {goalsLoading ? (
                    <>
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </>
                  ) : goals ? (
                    <>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Ventas</span>
                          <span className="font-medium">
                            {formatCurrency(goals.currentSales)} / {formatCurrency(goals.salesGoal)}
                          </span>
                        </div>
                        <Progress value={goals.salesProgress} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Leads convertidos</span>
                          <span className="font-medium">{goals.convertedLeads} / {goals.leadsGoal}</span>
                        </div>
                        <Progress value={goals.leadsProgress} className="h-2" />
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No hay datos de metas disponibles
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card className="border-border/40 bg-primary/5">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-foreground mb-2">💡 Consejo del día</h4>
                  <p className="text-sm text-muted-foreground">
                    Los leads que se contactan dentro de las primeras 24 horas tienen 3x más probabilidad de conversión.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardAsesor;
