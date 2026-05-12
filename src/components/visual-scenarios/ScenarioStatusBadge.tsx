import { Badge } from '@/components/ui/badge';
import { getVisualScenarioStatusConfig } from '@/lib/visualScenarios';
import { cn } from '@/lib/utils';
import type { VisualScenarioStatus } from '@/types/visualScenario';

interface ScenarioStatusBadgeProps {
  status: VisualScenarioStatus;
  className?: string;
}

const statusClassName: Record<VisualScenarioStatus, string> = {
  draft: 'border-muted-foreground/30 bg-muted text-muted-foreground',
  concept: 'border-primary/30 bg-primary/10 text-primary',
  review: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  approved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  archived: 'border-slate-500/30 bg-slate-500/10 text-slate-500',
};

const ScenarioStatusBadge = ({ status, className }: ScenarioStatusBadgeProps) => {
  const config = getVisualScenarioStatusConfig(status);

  return (
    <Badge variant="outline" className={cn(statusClassName[status], className)}>
      {config.label}
    </Badge>
  );
};

export default ScenarioStatusBadge;
