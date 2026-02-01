import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calendar,
  Bell,
  Settings,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  userName?: string;
  notificationCount?: number;
  onExport?: () => void;
  onSettings?: () => void;
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
  className?: string;
}

const periods = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta Semana' },
  { value: 'month', label: 'Este Mes' },
  { value: 'quarter', label: 'Este Trimestre' },
  { value: 'year', label: 'Este Año' },
];

export const DashboardHeader = ({
  title = 'Dashboard Ejecutivo',
  subtitle = 'Vista general de tu negocio de parcelas',
  userName,
  notificationCount = 0,
  onExport,
  onSettings,
  selectedPeriod = 'month',
  onPeriodChange,
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
        {/* Period Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">
                {periods.find(p => p.value === selectedPeriod)?.label || 'Este Mes'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {periods.map((period) => (
              <DropdownMenuItem
                key={period.value}
                onClick={() => onPeriodChange?.(period.value)}
                className={cn(
                  selectedPeriod === period.value && 'bg-primary/10 text-primary'
                )}
              >
                {period.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Export */}
        {onExport && (
          <Button variant="outline" onClick={onExport} className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        )}
        
        {/* Notifications */}
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </Badge>
          )}
        </Button>
        
        {/* Settings */}
        {onSettings && (
          <Button variant="outline" size="icon" onClick={onSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
