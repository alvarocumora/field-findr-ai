import { Badge } from '@/components/ui/badge';
import { getVisualScenarioTypeConfig } from '@/lib/visualScenarios';
import { cn } from '@/lib/utils';
import type { VisualScenarioType } from '@/types/visualScenario';

interface ScenarioTypeBadgeProps {
  type: VisualScenarioType;
  className?: string;
}

const ScenarioTypeBadge = ({ type, className }: ScenarioTypeBadgeProps) => {
  const config = getVisualScenarioTypeConfig(type);

  return (
    <Badge variant="secondary" className={cn('bg-background/80 backdrop-blur-sm', className)}>
      {config.shortLabel}
    </Badge>
  );
};

export default ScenarioTypeBadge;
