import { Card } from '@/components/ui/card';
import { formatVisualScenarioMetric } from '@/lib/visualScenarios';
import type { VisualScenarioMetric } from '@/types/visualScenario';

interface ScenarioMetricGridProps {
  metrics?: VisualScenarioMetric[];
}

const ScenarioMetricGrid = ({ metrics = [] }: ScenarioMetricGridProps) => {
  if (!metrics.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {metrics.slice(0, 6).map((metric) => {
        const formatted = formatVisualScenarioMetric(metric);

        return (
          <Card key={metric.key} className="border-border/60 bg-background/70 p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-2 text-xl font-semibold text-foreground">
              {formatted.formattedValue}
            </p>
            {metric.description && (
              <p className="mt-1 text-xs text-muted-foreground">{metric.description}</p>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default ScenarioMetricGrid;
