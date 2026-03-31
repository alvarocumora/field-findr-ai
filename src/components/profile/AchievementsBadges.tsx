import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trophy, Eye, Scale, Bookmark, ShoppingCart, Sparkles } from 'lucide-react';

interface Achievement {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  threshold: number;
  eventType: string;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'explorer', icon: <Eye className="h-5 w-5" />, label: 'Explorador', description: 'Visitaste 10+ proyectos', threshold: 10, eventType: 'view_project' },
  { id: 'analyst', icon: <Scale className="h-5 w-5" />, label: 'Analista', description: 'Usaste el comparador', threshold: 1, eventType: 'compare_lots' },
  { id: 'collector', icon: <Bookmark className="h-5 w-5" />, label: 'Coleccionista', description: 'Guardaste 5+ favoritos', threshold: 5, eventType: 'add_favorite' },
  { id: 'decisive', icon: <ShoppingCart className="h-5 w-5" />, label: 'Decidido', description: 'Reservaste un lote', threshold: 1, eventType: 'create_reservation' },
  { id: 'immersive', icon: <Sparkles className="h-5 w-5" />, label: 'Inmersivo', description: 'Usaste el diseñador 3D', threshold: 1, eventType: 'use_3d_designer' },
];

const AchievementsBadges = () => {
  const { user } = useAuth();

  const { data: events } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user) return {};
      const { data } = await supabase
        .from('user_events')
        .select('event_type')
        .eq('user_id', user.id);
      
      const counts: Record<string, number> = {};
      (data || []).forEach((e: any) => {
        counts[e.event_type] = (counts[e.event_type] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user,
  });

  const unlockedCount = ACHIEVEMENTS.filter(a => (events?.[a.eventType] || 0) >= a.threshold).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Logros ({unlockedCount}/{ACHIEVEMENTS.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <TooltipProvider>
            {ACHIEVEMENTS.map(achievement => {
              const count = events?.[achievement.eventType] || 0;
              const unlocked = count >= achievement.threshold;
              return (
                <Tooltip key={achievement.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all w-20 ${
                        unlocked
                          ? 'border-amber-500/50 bg-amber-500/5 text-amber-600'
                          : 'border-muted bg-muted/30 text-muted-foreground/40 grayscale'
                      }`}
                    >
                      {achievement.icon}
                      <span className="text-[10px] font-medium text-center leading-tight">{achievement.label}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">{achievement.label}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    {!unlocked && (
                      <p className="text-xs text-amber-600 mt-1">{count}/{achievement.threshold} completado</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementsBadges;
