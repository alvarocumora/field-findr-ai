import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, Phone, Mail, ArrowRight } from 'lucide-react';
import { useUpcomingFollowUps } from '@/hooks/useDashboardData';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { format, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

interface UpcomingFollowUpsProps {
  className?: string;
}

export const UpcomingFollowUps = ({ className }: UpcomingFollowUpsProps) => {
  const { data: followUps = [], isLoading } = useUpcomingFollowUps();
  const navigate = useNavigate();

  if (isLoading || followUps.length === 0) return null;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Próximos Seguimientos
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/asesor/leads')} className="gap-1 text-xs">
            Ver todos <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {followUps.map((lead) => {
          const followUpDate = new Date(lead.next_follow_up!);
          const overdue = isPast(followUpDate) && !isToday(followUpDate);
          const today = isToday(followUpDate);

          return (
            <div
              key={lead.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50',
                overdue && 'border-destructive/30 bg-destructive/5',
                today && 'border-primary/30 bg-primary/5'
              )}
              onClick={() => navigate('/asesor/leads')}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {lead.first_name} {lead.last_name || ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(followUpDate, "d MMM, HH:mm", { locale: es })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {overdue && (
                  <Badge variant="destructive" className="text-[10px]">Vencido</Badge>
                )}
                {today && (
                  <Badge className="text-[10px] bg-primary">Hoy</Badge>
                )}
                {lead.phone && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`tel:${lead.phone}`);
                    }}
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </Button>
                )}
                {lead.email && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`mailto:${lead.email}`);
                    }}
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default UpcomingFollowUps;
