import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  userName?: string;
  roleLabel?: string;
  actions?: ReactNode;
  className?: string;
}

export const DashboardHeader = ({
  title = 'Dashboard Ejecutivo',
  subtitle = 'Vista general de tu negocio de parcelas',
  userName,
  roleLabel,
  actions,
  className,
}: DashboardHeaderProps) => {
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div
      className={cn(
        'flex flex-col lg:flex-row lg:items-end justify-between gap-4',
        'pb-6 border-b border-border/50',
        className,
      )}
    >
      <div className="space-y-1">
        {userName && (
          <p className="text-sm text-muted-foreground animate-fade-in">
            {greeting()},{' '}
            <span className="font-medium text-foreground">{userName}</span>
            {roleLabel && (
              <span className="ml-2 inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {roleLabel}
              </span>
            )}
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight animate-fade-in stagger-1">
          {title}
        </h1>
        <p className="text-muted-foreground text-sm animate-fade-in stagger-2">
          {subtitle}
        </p>
      </div>

      {actions && (
        <div className="animate-fade-in stagger-3">{actions}</div>
      )}
    </div>
  );
};

export default DashboardHeader;
