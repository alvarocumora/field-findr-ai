import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProjectTimelineProps {
  projectId: string;
  createdAt: string;
}

export const ProjectTimeline = ({ projectId, createdAt }: ProjectTimelineProps) => {
  const { data: reservations } = useQuery({
    queryKey: ['project-timeline', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('reservations')
        .select('id, created_at, status, paid_at')
        .in('lot_id', 
          (await supabase.from('lots').select('id').eq('project_id', projectId)).data?.map(l => l.id) || []
        )
        .order('created_at', { ascending: true });
      return data || [];
    },
  });

  const { data: lots } = useQuery({
    queryKey: ['project-timeline-lots', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('lots')
        .select('id, status, sale_date, reservation_date')
        .eq('project_id', projectId);
      return data || [];
    },
  });

  const totalLots = lots?.length || 0;
  const soldLots = lots?.filter(l => l.status === 'sold').length || 0;
  const firstReservation = reservations?.[0];
  const firstSale = lots?.find(l => l.sale_date);
  const paidReservations = reservations?.filter(r => r.status === 'paid' || r.status === 'converted') || [];

  const milestones = [
    {
      date: createdAt,
      label: 'Proyecto publicado',
      icon: <Calendar className="h-4 w-4" />,
      completed: true,
    },
    {
      date: firstReservation?.created_at,
      label: 'Primera reserva',
      icon: <Clock className="h-4 w-4" />,
      completed: !!firstReservation,
    },
    {
      date: firstSale?.sale_date,
      label: 'Primera venta',
      icon: <CheckCircle className="h-4 w-4" />,
      completed: !!firstSale,
    },
    {
      date: soldLots >= Math.ceil(totalLots * 0.5) ? new Date().toISOString() : undefined,
      label: '50% vendido',
      icon: <TrendingUp className="h-4 w-4" />,
      completed: totalLots > 0 && soldLots >= Math.ceil(totalLots * 0.5),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Historia del Proyecto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {milestones.map((milestone, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`mt-0.5 p-1.5 rounded-full ${milestone.completed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {milestone.icon}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${milestone.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {milestone.label}
                </p>
                {milestone.completed && milestone.date && (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(milestone.date), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                )}
                {!milestone.completed && (
                  <Badge variant="outline" className="text-[10px] mt-1">Pendiente</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {totalLots > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Actividad total</span>
              <span className="font-semibold">{paidReservations.length} reservas confirmadas</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
