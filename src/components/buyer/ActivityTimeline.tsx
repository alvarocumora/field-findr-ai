import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Eye, Heart, Search, Calendar, MapPin, Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const EVENT_CONFIG: Record<string, { icon: typeof Eye; label: string; color: string }> = {
  view_project: { icon: Eye, label: 'Visitó proyecto', color: 'text-blue-500 bg-blue-500/10' },
  view_lot: { icon: MapPin, label: 'Vio lote', color: 'text-emerald-500 bg-emerald-500/10' },
  search: { icon: Search, label: 'Búsqueda', color: 'text-purple-500 bg-purple-500/10' },
  favorite: { icon: Heart, label: 'Favorito', color: 'text-destructive bg-destructive/10' },
  reserve: { icon: Calendar, label: 'Reserva', color: 'text-amber-500 bg-amber-500/10' },
};

const ActivityTimeline = () => {
  const { user } = useAuth();

  const { data: events, isLoading } = useQuery({
    queryKey: ['user-activity-timeline', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card className="border-border/40">
        <CardHeader><CardTitle className="text-base">Tu Actividad Reciente</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-40" /></CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Tu Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Aún no tienes actividad registrada</p>
            <p className="text-xs mt-1">Explora proyectos y terrenos para ver tu historial aquí</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Tu Actividad Reciente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
          
          {events.map((event: any) => {
            const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.search;
            const Icon = config.icon;
            const metadata = event.metadata as Record<string, any> || {};

            return (
              <div key={event.id} className="flex items-start gap-4 relative">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{config.label}</p>
                    <Badge variant="outline" className="text-[10px]">{event.event_type}</Badge>
                  </div>
                  {metadata.project_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">{metadata.project_name}</p>
                  )}
                  {metadata.query && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">"{metadata.query}"</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: es })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;
