import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useFavorites } from '@/hooks/useFavorites';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Heart, MapPin, Bell, TrendingDown, Search, Home, 
  ChevronRight, Sparkles, Calendar, Eye, Scale, Calculator
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import ActivityTimeline from '@/components/buyer/ActivityTimeline';
import PriceAlertCard from '@/components/buyer/PriceAlertCard';

const BuyerHome = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { data: favorites, isLoading: favsLoading } = useFavorites();

  // Get active reservations
  const { data: reservations, isLoading: resLoading } = useQuery({
    queryKey: ['buyer-reservations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('reservations')
        .select('*, lots(lot_number, project_id, projects(name))')
        .eq('user_id', user.id)
        .in('status', ['pending_payment', 'paid'])
        .order('created_at', { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!user,
  });

  // Get featured projects
  const { data: featuredProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ['featured-projects-buyer'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, name, location, region, country, images, available_lots, total_lots')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);
      return data || [];
    },
  });

  // Get saved searches
  const { data: savedSearches } = useQuery({
    queryKey: ['buyer-saved-searches', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!user,
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <Layout>
      <div className="container py-8 space-y-8 max-w-6xl">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            {greeting()}, {profile?.first_name || 'Explorador'} 👋
          </h1>
          <p className="text-muted-foreground">Tu centro de búsqueda de terrenos</p>
        </div>

        {/* First-run: nudge new buyers into the preference quiz. Before this,
            /quiz was only discoverable via a footer link. */}
        {profile && !profile.onboarding_completed && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 w-fit">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-foreground">Cuéntanos qué buscas</p>
                <p className="text-sm text-muted-foreground">
                  Responde 5 preguntas y personalizamos las recomendaciones de terrenos para ti.
                </p>
              </div>
              <Button asChild className="gap-2 shrink-0">
                <Link to="/quiz">
                  Hacer el quiz
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Explorar Mapa', icon: MapPin, href: '/explorar', variant: 'default' as const },
            { label: 'Mis Favoritos', icon: Heart, href: '/favoritos', variant: 'outline' as const, badge: favorites?.length },
            { label: 'Mis Alertas', icon: Bell, href: '/alertas', variant: 'outline' as const },
            { label: 'Mi Terreno', icon: Home, href: '/mi-terreno', variant: 'outline' as const },
            { label: 'Comparar', icon: Scale, href: '/comparar', variant: 'outline' as const },
            { label: 'Calculadoras', icon: Calculator, href: '/tools', variant: 'outline' as const },
          ].map((action) => (
            <Button
              key={action.href}
              variant={action.variant}
              className="h-auto py-4 flex-col gap-2 relative"
              onClick={() => navigate(action.href)}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.label}</span>
              {action.badge ? (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-[20px] text-[10px]">
                  {action.badge}
                </Badge>
              ) : null}
            </Button>
          ))}
        </div>

        {/* Active Reservations */}
        {!resLoading && reservations && reservations.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Reservas Activas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reservations.map((res: any) => (
                <div key={res.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/40">
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      Lote {res.lots?.lot_number} — {res.lots?.projects?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Estado: {res.status === 'paid' ? '✅ Pagada' : '⏳ Pendiente de pago'}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/mi-terreno')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Projects */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Proyectos Destacados
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/explorar')} className="gap-1 text-primary">
                Ver todos <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {projectsLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {featuredProjects?.map((project: any) => (
                  <Link key={project.id} to={`/proyecto/${project.id}`}>
                    <Card className="border-border/40 hover:border-primary/30 transition-all hover:shadow-md cursor-pointer overflow-hidden group">
                      {project.images?.[0] && (
                        <div className="h-28 overflow-hidden">
                          <img
                            src={project.images[0]}
                            alt={project.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm text-foreground truncate">{project.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {project.location || project.region}, {project.country}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {project.available_lots || 0} disponibles
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Saved Searches */}
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Búsquedas Guardadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {savedSearches && savedSearches.length > 0 ? (
                  savedSearches.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.notifications_enabled ? '🔔 Alertas activas' : 'Sin alertas'}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/explorar')}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Sin búsquedas guardadas</p>
                    <Button variant="link" size="sm" onClick={() => navigate('/explorar')} className="mt-1">
                      Buscar terrenos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Favorites */}
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4 text-destructive" />
                  Favoritos Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {favsLoading ? (
                  <Skeleton className="h-20" />
                ) : favorites && favorites.length > 0 ? (
                  <div className="space-y-2">
                    {favorites.slice(0, 3).map((fav: any) => (
                      <div key={fav.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <Heart className="h-4 w-4 text-destructive" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-foreground">
                            {fav.listings?.title || 'Propiedad'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fav.listings?.location}
                          </p>
                        </div>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="w-full text-primary" onClick={() => navigate('/favoritos')}>
                      Ver todos ({favorites.length})
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Heart className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Sin favoritos aún</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price Alerts */}
            <PriceAlertCard />

            {/* Price Alert CTA */}
            <Card className="border-border/40 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-4 text-center space-y-3">
                <TrendingDown className="h-8 w-8 mx-auto text-primary" />
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Alertas de Precio</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recibe notificaciones cuando baje el precio de tus favoritos
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                  Configurar Alertas
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity Timeline */}
        <ActivityTimeline />
      </div>
    </Layout>
  );
};

export default BuyerHome;
