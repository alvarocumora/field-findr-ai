import { WorkspaceLoadError } from '@/components/dashboard/WorkspaceLoadError';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePanelToday, type PanelScope } from '@/hooks/usePanelToday';

const toneClass: Record<string, string> = {
  default: 'text-foreground',
  warning: 'text-amber-500',
  danger: 'text-destructive',
  success: 'text-primary',
};

const emptyCopy: Record<string, string> = {
  leads: 'Todo contactado',
  visits: 'Sin visitas agendadas hoy',
  reservations: 'Sin reservas por vencer',
  commissions: 'Sin comisiones pendientes',
  props: 'Nada por revisar',
  projects: 'Nada por revisar',
  tickets: 'Sin tickets abiertos',
};

const formatMoney = (value: number) =>
  value >= 1_000_000 ? `$${(value / 1_000_000).toFixed(1)}M` : `$${value.toLocaleString('es-CL')}`;

interface TodayPanelProps {
  scope: PanelScope;
  title?: string;
  className?: string;
}

/**
 * Bloque "Hoy": misma estructura para corredor, inmobiliaria y administración,
 * con el contenido resuelto por alcance en `usePanelToday`.
 */
const TodayPanel = ({ scope, title = 'Hoy', className }: TodayPanelProps) => {
  const { data: items = [], isLoading, error, refetch } = usePanelToday(scope);

  if (error) return <WorkspaceLoadError title="No pudimos cargar los pendientes" onRetry={refetch} />;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          : items.map((item) => (
              <Link
                key={item.key}
                to={item.href}
                className="group rounded-lg border border-border bg-card/50 p-3 transition-colors hover:border-primary/50 hover:bg-muted/40"
              >
                <p className="text-xs text-muted-foreground line-clamp-2">{item.label}</p>
                <p className={cn('mt-1 text-2xl font-semibold tabular-nums', toneClass[item.tone])}>
                  {item.hint === 'monto' ? formatMoney(item.value) : item.value}
                </p>
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  {item.value === 0 ? emptyCopy[item.key] ?? 'Sin pendientes' : 'Ver detalle'}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
      </CardContent>
    </Card>
  );
};

export default TodayPanel;
