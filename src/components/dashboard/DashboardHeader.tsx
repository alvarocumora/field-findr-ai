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
        'pb-6 border-b border-border/60',
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {userName && (
          <p className="text-sm text-muted-foreground">
            {greeting()},{' '}
            <span className="font-medium text-foreground">{userName}</span>
            {roleLabel && (
              <span className="ml-2 inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {roleLabel}
              </span>
            )}
          </p>
        )}
        <h1 className="font-editorial text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      </div>

      {actions && (
        <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">{actions}</div>
      )}
    </div>
  );
};

export default DashboardHeader;
