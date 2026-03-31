import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Flame, Clock, TrendingUp, Sun } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const MorningBriefing = () => {
  const { user } = useAuth();

  const { data: briefing, isLoading } = useQuery({
    queryKey: ['morning-briefing', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Fetch data in parallel
      const [leadsRes, reservationsRes, projectsRes, notificationsRes] = await Promise.all([
        supabase
          .from('leads')
          .select('id, status, lead_score')
          .eq('user_id', user.id)
          .in('status', ['new', 'contacted', 'interested'])
          .order('lead_score', { ascending: false }),
        supabase
          .from('reservations')
          .select('id, expires_at, status, lot_id')
          .in('status', ['pending_payment'])
          .limit(10),
        supabase
          .from('projects')
          .select('id, name, total_lots, sold_lots, available_lots')
          .eq('user_id', user.id)
          .eq('status', 'active'),
        supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('read', false),
      ]);

      const hotLeads = (leadsRes.data || []).filter(l => (l.lead_score || 0) >= 50).length;
      const expiringReservations = (reservationsRes.data || []).filter(r => {
        const expires = new Date(r.expires_at);
        const now = new Date();
        const hoursLeft = (expires.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursLeft > 0 && hoursLeft <= 24;
      }).length;

      const projects = projectsRes.data || [];
      const milestoneProject = projects.find(p => {
        const sold = p.sold_lots || 0;
        const total = p.total_lots || 0;
        const pct = total > 0 ? (sold / total) * 100 : 0;
        return pct >= 75 && pct < 100;
      });

      return {
        hotLeads,
        expiringReservations,
        milestoneProject,
        unreadNotifications: notificationsRes.data?.length || 0,
        totalActiveLeads: leadsRes.data?.length || 0,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-48 mb-2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4 mt-1" />
        </CardContent>
      </Card>
    );
  }

  if (!briefing) return null;

  const items: string[] = [];
  if (briefing.hotLeads > 0) items.push(`${briefing.hotLeads} leads calientes esperan contacto`);
  if (briefing.expiringReservations > 0) items.push(`${briefing.expiringReservations} reserva${briefing.expiringReservations > 1 ? 's' : ''} por vencer hoy`);
  if (briefing.milestoneProject) items.push(`${briefing.milestoneProject.name} alcanzó el 75%+ de ventas 🎉`);
  if (briefing.unreadNotifications > 0) items.push(`${briefing.unreadNotifications} notificaciones sin leer`);

  if (items.length === 0) {
    items.push('Todo en orden. ¡Buen día para cerrar ventas!');
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-amber-500/5 border-primary/20 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sun className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-foreground">{greeting}</span>
          <Badge variant="outline" className="text-[10px] gap-1">
            <Sparkles className="h-3 w-3" />
            Briefing IA
          </Badge>
        </div>
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default MorningBriefing;
