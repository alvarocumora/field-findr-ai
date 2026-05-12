import { useMemo, useState } from 'react';
import { AlertTriangle, Boxes, CheckCircle2, ChevronLeft, ChevronRight, ImageIcon, Info, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { VISUAL_SCENARIO_DISCLAIMER } from '@/config/visualScenarios';
import {
  buildVisualScenarioSummary,
  formatVisualScenarioCurrency,
  getVisualScenarioStatusConfig,
  getVisualScenarioTypeConfig,
  visualScenarioRequiresDisclaimer,
} from '@/lib/visualScenarios';
import { cn } from '@/lib/utils';
import type { VisualScenario } from '@/types/visualScenario';
import ScenarioMetricGrid from './ScenarioMetricGrid';
import ScenarioStatusBadge from './ScenarioStatusBadge';
import ScenarioTypeBadge from './ScenarioTypeBadge';

interface VisualScenarioViewerProps {
  scenarios: VisualScenario[];
  className?: string;
  title?: string;
  onAnalyze?: (scenario: VisualScenario) => void;
  onExportPdf?: (scenario: VisualScenario) => void;
}

const VisualScenarioViewer = ({
  scenarios,
  className,
  title = 'Escenarios visuales de desarrollo',
  onAnalyze,
  onExportPdf,
}: VisualScenarioViewerProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeScenario = scenarios[activeIndex];

  const summary = useMemo(
    () => (activeScenario ? buildVisualScenarioSummary(activeScenario) : null),
    [activeScenario],
  );

  if (!scenarios.length || !activeScenario || !summary) {
    return (
      <Card className={cn('overflow-hidden border-dashed bg-card/70', className)}>
        <CardContent className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
          <ImageIcon className="mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Sin escenarios visuales todavía</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Esta propiedad aún no tiene escenarios conceptuales asociados. En el siguiente sprint se podrá integrar la ficha de propiedad y el flujo de creación.
          </p>
        </CardContent>
      </Card>
    );
  }

  const typeConfig = getVisualScenarioTypeConfig(activeScenario.type);
  const statusConfig = getVisualScenarioStatusConfig(activeScenario.status);
  const showDisclaimer = visualScenarioRequiresDisclaimer(activeScenario);
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < scenarios.length - 1;

  const goPrevious = () => setActiveIndex((current) => Math.max(0, current - 1));
  const goNext = () => setActiveIndex((current) => Math.min(scenarios.length - 1, current + 1));

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-primary">Visual Scenarios</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Montajes conceptuales para entender el potencial comercial del terreno.
          </p>
        </div>
        <Badge variant="outline" className="w-fit bg-background/70">
          {scenarios.length} escenario{scenarios.length === 1 ? '' : 's'}
        </Badge>
      </div>

      <Card className="overflow-hidden border-border/70 bg-card/95 shadow-xl">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <div className="relative min-h-[320px] overflow-hidden bg-muted lg:min-h-[560px]">
            {activeScenario.assets?.baseImageUrl ? (
              <img
                src={activeScenario.assets.baseImageUrl}
                alt={activeScenario.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted via-background to-muted">
                <ImageIcon className="h-16 w-16 text-muted-foreground/60" />
              </div>
            )}

            {activeScenario.assets?.overlayImageUrl && (
              <img
                src={activeScenario.assets.overlayImageUrl}
                alt={`${activeScenario.title} overlay`}
                className="absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-screen"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-background/20" />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <ScenarioTypeBadge type={activeScenario.type} />
              <ScenarioStatusBadge status={activeScenario.status} />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
              <div className="max-w-2xl">
                <div className="mb-3 flex flex-wrap gap-2">
                  {summary.tags.slice(0, 5).map((tag) => (
                    <Badge key={tag} variant="outline" className="border-white/20 bg-black/30 text-white backdrop-blur-md">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h3 className="text-2xl font-bold text-white sm:text-4xl">{activeScenario.title}</h3>
                {activeScenario.subtitle && (
                  <p className="mt-2 max-w-xl text-sm text-white/75 sm:text-base">{activeScenario.subtitle}</p>
                )}
              </div>
            </div>

            {scenarios.length > 1 && (
              <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-2">
                <Button variant="secondary" size="icon" onClick={goPrevious} disabled={!hasPrevious} className="rounded-full bg-background/80 backdrop-blur-md">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="icon" onClick={goNext} disabled={!hasNext} className="rounded-full bg-background/80 backdrop-blur-md">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm text-primary">
                <Boxes className="h-4 w-4" />
                <span className="font-medium">{typeConfig.label}</span>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                {activeScenario.description || typeConfig.description}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-start gap-3">
                {summary.isPublicReady ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{statusConfig.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{statusConfig.description}</p>
                </div>
              </div>
            </div>

            <ScenarioMetricGrid metrics={activeScenario.metrics} />

            {(activeScenario.estimatedCapex || activeScenario.estimatedRevenue) && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {activeScenario.estimatedCapex && (
                  <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">CAPEX ref.</p>
                    <p className="mt-2 text-lg font-semibold">{formatVisualScenarioCurrency(activeScenario.estimatedCapex)}</p>
                  </div>
                )}
                {activeScenario.estimatedRevenue && (
                  <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ingreso ref.</p>
                    <p className="mt-2 text-lg font-semibold">{formatVisualScenarioCurrency(activeScenario.estimatedRevenue)}</p>
                  </div>
                )}
              </div>
            )}

            {!!activeScenario.assumptions?.length && (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">Supuestos principales</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {activeScenario.assumptions.slice(0, 3).map((assumption) => (
                    <li key={assumption.id} className="flex gap-2">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{assumption.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!!activeScenario.risks?.length && (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">Riesgos / pendientes</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {activeScenario.risks.slice(0, 3).map((risk) => (
                    <li key={risk.id} className="flex gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <span>{risk.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {showDisclaimer && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs leading-5 text-amber-700 dark:text-amber-300">
                {VISUAL_SCENARIO_DISCLAIMER}
              </div>
            )}

            <div className="mt-auto flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={() => onAnalyze?.(activeScenario)} disabled={!onAnalyze}>
                <Sparkles className="mr-2 h-4 w-4" />
                Analizar con IA
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => onExportPdf?.(activeScenario)} disabled={!onExportPdf}>
                Descargar ficha PDF
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>

      {scenarios.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {scenarios.map((scenario, index) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                'min-w-[220px] rounded-2xl border p-3 text-left transition-all',
                index === activeIndex
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-muted/40',
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <ScenarioTypeBadge type={scenario.type} />
                <ScenarioStatusBadge status={scenario.status} />
              </div>
              <p className="line-clamp-2 text-sm font-semibold text-foreground">{scenario.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{scenario.subtitle || getVisualScenarioTypeConfig(scenario.type).description}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default VisualScenarioViewer;
