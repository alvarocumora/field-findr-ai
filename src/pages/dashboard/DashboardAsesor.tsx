import { 
  Users, Building2, MessageSquare, Phone, Target, Clock,
  ChevronRight, Plus, DollarSign, Loader2, Flame, Bell, BellRing,
  CalendarClock, AlertTriangle, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

import { useAgentStats, useAgentLeads, useAgentGoals } from '@/hooks/useDashboardStats';
import { useProjects } from '@/hooks/useProjects';
import { useNotifications } from '@/hooks/useNotifications';
import { useProfile } from '@/hooks/useProfile';
import { LeadFormDialog } from '@/components/leads/LeadFormDialog';
import { ListingFormDialog } from '@/components/listings/ListingFormDialog';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Map, FileArchive, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import MorningBriefing from '@/components/dashboard/MorningBriefing';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';

const DashboardAsesor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data: stats, isLoading: statsLoading } = useAgentStats();
  const { data: leads, isLoading: leadsLoading } = useAgentLeads();
  const { data: goals, isLoading: goalsLoading } = useAgentGoals();
  const { projects, isLoading: projectsLoading } = useProjects();
  const { data: notifications } = useNotifications();

  // Hot leads: high score, not contacted in 48h+
  const { data: hotLeads } = useQuery({
    queryKey: ['hot-leads', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const { data } = await supabase
        .from('leads')
        .select('id, first_name, last_name, lead_score, phone, status, updated_at')
        .eq('user_id', user.id)
        .in('status', ['new', 'contacted', 'interested'])
        .lte('updated_at', twoDaysAgo.toISOString())
        .order('lead_score', { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!user,
  });

  // Upcoming follow-ups (next 24h)
  const { data: upcomingFollowUps } = useQuery({
    queryKey: ['upcoming-followups', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const { data } = await supabase
        .from('leads')
        .select('id, first_name, last_name, next_follow_up, phone')
        .eq('user_id', user.id)
        .gte('next_follow_up', now.toISOString())
        .lte('next_follow_up', tomorrow.toISOString())
        .order('next_follow_up', { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  // Expiring reservations (next 48h)
  const { data: expiringReservations } = useQuery({
    queryKey: ['expiring-reservations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const now = new Date();
      const twoDays = new Date();
      twoDays.setDate(twoDays.getDate() + 2);
      const { data } = await supabase
        .from('reservations')
        .select('id, buyer_name, expires_at, lot_id, status')
        .eq('user_id', user.id)
        .eq('status', 'pending_payment')
        .gte('expires_at', now.toISOString())
        .lte('expires_at', twoDays.toISOString())
        .order('expires_at', { ascending: true })
        .limit(3);
      return data || [];
    },
    enabled: !!user,
  });

  const unreadNotifs = notifications?.filter((n: any) => !n.read).slice(0, 3) || [];

  const hasNoProjects = !projectsLoading && projects.length === 0;

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    return `$${value.toLocaleString('es-CL')}`;
  };

  const userName = profile?.first_name || user?.email?.split('@')[0] || '';
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (projectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasNoProjects) {
    return <OnboardingWizard onComplete={() => window.location.reload()} />;
  }

  const statsConfig = [
    { label: 'Oportunidades', value: stats?.properties || 0, icon: Target, color: 'text-primary', delta: 'Total activas' },
    { label: 'Leads Activos', value: stats?.activeLeads || 0, icon: Users, color: 'text-blue-500', delta: '+3 esta semana' },
    { label: 'En Revisión', value: (leads || []).filter((l: any) => l.status === 'interested').length, icon: Clock, color: 'text-amber-500', delta: 'Revisión legal/técnica' },
    { label: 'Deals Prioritarios', value: (hotLeads || []).length, icon: Flame, color: 'text-red-500', delta: 'Alta prioridad' },
    { label: 'Ventas del Mes', value: formatCurrency(stats?.monthlySales || 0), icon: DollarSign, color: 'text-emerald-500' },
    { label: 'Lotes Vendidos', value: stats?.soldCount || 0, icon: Building2, color: 'text-purple-500' },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      hot: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', label: 'Caliente' },
      warm: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', label: 'Tibio' },
      cold: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', label: 'Frío' },
    };
    return styles[status as keyof typeof styles] || styles.cold;
  };

  const totalProjectLots = projects.reduce((sum, p: any) => sum + (p.total_lots || 0), 0);
  const totalSoldLots = projects.reduce((sum, p: any) => sum + (p.sold_lots || 0), 0);
  const globalProgress = totalProjectLots > 0 ? Math.round((totalSoldLots / totalProjectLots) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-8">
        {/* Morning Briefing */}
        <MorningBriefing />

        {/* Personalized Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{greeting()}, <span className="font-medium text-foreground">{userName}</span> 👋</p>
            <h1 className="text-3xl font-bold text-foreground">Mi Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              {totalSoldLots > 0 
                ? `${totalSoldLots} lotes vendidos de ${totalProjectLots} • ${globalProgress}% avance global`
                : 'Gestiona tus leads, propiedades y citas'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LeadFormDialog
              trigger={
                <Button variant="outline" className="rounded-xl gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Lead
                </Button>
              }
            />
            <ListingFormDialog
              trigger={
                <Button className="rounded-xl gap-2">
                  <Building2 className="h-4 w-4" />
                  Nueva Propiedad
                </Button>
              }
            />
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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Pipeline', icon: FolderKanban, onClick: () => navigate('/asesor/pipeline'), variant: 'default' as const },
            { label: 'Mis Proyectos', icon: Building2, onClick: () => navigate('/asesor/projects'), variant: 'outline' as const },
            { label: 'Ver Mapa', icon: Map, onClick: () => navigate('/explorar'), variant: 'outline' as const },
            { label: 'Nuevo Lead', icon: Users, onClick: () => {}, variant: 'outline' as const, isLeadDialog: true },
          ].map((action, i) => (
            action.isLeadDialog ? (
              <LeadFormDialog
                key={i}
                trigger={
                  <Button variant={action.variant} className="h-auto py-4 flex-col gap-2 w-full">
                    <action.icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                }
              />
            ) : (
              <Button key={i} variant={action.variant} className="h-auto py-4 flex-col gap-2" onClick={action.onClick}>
                <action.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            )
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Leads Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upcoming Actions Alert */}
            {((upcomingFollowUps && upcomingFollowUps.length > 0) || (expiringReservations && expiringReservations.length > 0)) && (
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Acciones Urgentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {expiringReservations?.map((res: any) => (
                    <div key={res.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/40">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          🔴 Reserva de {res.buyer_name} por vencer
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Vence {formatDistanceToNow(new Date(res.expires_at), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate('/asesor/reservations')}>
                        Ver
                      </Button>
                    </div>
                  ))}
                  {upcomingFollowUps?.map((lead: any) => (
                    <div key={lead.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/40">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          📞 Seguimiento: {lead.first_name} {lead.last_name || ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(lead.next_follow_up), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                      {lead.phone && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                            WA
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Leads Recientes</h2>
              <Button variant="ghost" size="sm" className="text-primary gap-1" onClick={() => navigate('/asesor/leads')}>
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
                              {lead.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
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
                            {lead.phone && (
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
                                <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${lead.name}, te contacto desde Ofertaterrenos.`)}`} target="_blank" rel="noopener noreferrer">
                                  <Phone className="h-4 w-4 text-green-600" />
                                </a>
                              </Button>
                            )}
                            {lead.email && (
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
                                <a href={`mailto:${lead.email}`}>
                                  <MessageSquare className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
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
                <LeadFormDialog
                  trigger={
                    <Button className="mt-4 gap-2">
                      <Plus className="h-4 w-4" />
                      Agregar Lead
                    </Button>
                  }
                />
              </Card>
            )}
          </div>

          {/* Right Column */}
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

            {/* Contextual Action */}
            <Card className="border-border/40 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">Acción del Día</h4>
                </div>
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return (
                    <p className="text-sm text-muted-foreground">
                      🌅 <strong>Mañana productiva:</strong> Revisa tus seguimientos pendientes. Los leads contactados antes del mediodía tienen 3x más conversión.
                    </p>
                  );
                  if (hour < 17) return (
                    <p className="text-sm text-muted-foreground">
                      📊 <strong>Hora de cerrar:</strong> Revisa las reservas del día y actualiza el estado de tus leads activos.
                    </p>
                  );
                  return (
                    <p className="text-sm text-muted-foreground">
                      🌙 <strong>Planifica mañana:</strong> Organiza tus citas y prepara cotizaciones para enviar temprano.
                    </p>
                  );
                })()}
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigate('/asesor/pipeline')}>
                  <FolderKanban className="h-3 w-3" />
                  Ir al Pipeline
                </Button>
              </CardContent>
            </Card>

            {/* Hot Leads */}
            {hotLeads && hotLeads.length > 0 && (
              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Oportunidades Calientes
                    <Badge variant="destructive" className="text-[10px] h-4 px-1.5">{hotLeads.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {hotLeads.map((lead: any) => {
                    const hoursSince = differenceInHours(new Date(), new Date(lead.updated_at));
                    return (
                      <div key={lead.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/40">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {lead.first_name} {lead.last_name || ''}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">Score: {lead.lead_score}</p>
                            <Badge variant="outline" className="text-[9px] h-3.5 px-1 border-red-500/30 text-red-500">
                              {hoursSince}h sin contacto
                            </Badge>
                          </div>
                        </div>
                        {lead.phone && (
                          <Button variant="ghost" size="sm" className="text-green-600" asChild>
                            <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${lead.first_name}, te contacto desde Ofertaterrenos.`)}`} target="_blank" rel="noopener noreferrer">
                              <Phone className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Inline Notifications */}
            {unreadNotifs.length > 0 && (
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-primary" />
                    Notificaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {unreadNotifs.map((notif: any) => (
                    <div key={notif.id} className="p-2 rounded-lg bg-muted/30 text-sm">
                      <p className="font-medium text-foreground text-xs">{notif.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full text-primary text-xs" onClick={() => navigate('/asesor/notifications')}>
                    Ver todas <ChevronRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Mini Project Summaries */}
            {projects.length > 0 && (
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-primary" />
                    Mis Proyectos
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{projects.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {projects.slice(0, 4).map((project: any) => {
                    const total = project.total_lots || 1;
                    const sold = project.sold_lots || 0;
                    const reserved = project.reserved_lots || 0;
                    const available = project.available_lots || 0;
                    const progress = Math.round((sold / total) * 100);
                    return (
                      <div key={project.id} className="cursor-pointer hover:bg-muted/30 p-2 rounded-lg transition-colors" onClick={() => navigate(`/proyecto/${project.id}`)}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                          <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-[9px] h-4 px-1.5">
                            {project.status === 'active' ? 'Activo' : 'Borrador'}
                          </Badge>
                        </div>
                        <Progress value={progress} className="h-1.5 mb-1" />
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="text-emerald-500">{available} disp</span>
                          <span>•</span>
                          <span className="text-amber-500">{reserved} res</span>
                          <span>•</span>
                          <span className="text-blue-500">{sold} vend</span>
                        </div>
                      </div>
                    );
                  })}
                  {projects.length > 4 && (
                    <Button variant="ghost" size="sm" className="w-full text-primary text-xs" onClick={() => navigate('/asesor/projects')}>
                      Ver todos ({projects.length}) <ChevronRight className="h-3 w-3" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAsesor;
