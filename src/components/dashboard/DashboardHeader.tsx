import { Badge } from '@/components/ui/badge';
import { CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  userName?: string;
  className?: string;
}

export const DashboardHeader = ({
  title = 'Dashboard Ejecutivo',
  subtitle = 'Vista general de tu negocio de parcelas',
  userName,
  className
}: DashboardHeaderProps) => {
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className={cn(
      'flex flex-col sm:flex-row sm:items-center justify-between gap-4',
      'pb-6 border-b border-border/50',
      className
    )}>
      <div className="space-y-1">
        {userName && (
          <p className="text-sm text-muted-foreground animate-fade-in">
            {greeting()}, <span className="font-medium text-foreground">{userName}</span>
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight animate-fade-in stagger-1">
          {title}
        </h1>
        <p className="text-muted-foreground text-sm animate-fade-in stagger-2">
          {subtitle}
        </p>
      </div>
      
      <div className="flex items-center gap-2 animate-fade-in stagger-3">
        <Badge variant="outline" className="gap-1.5 text-xs text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" />
          Este mes
        </Badge>
      </div>
    </div>
  );
};

export default DashboardHeader;
