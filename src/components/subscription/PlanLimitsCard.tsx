import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Building2, FolderKanban, Star, Sparkles, ArrowUpRight, Infinity as InfinityIcon } from 'lucide-react';
import { usePlanLimits, type PlanLimitUsage } from '@/hooks/usePlanLimits';
import { PLAN_ORDER_ALL, PLAN_DETAILS, type PlanType } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

const rowMeta = {
  listings: { icon: Building2, label: 'Publicaciones activas', unit: '' },
  projects: { icon: FolderKanban, label: 'Proyectos activos', unit: '' },
  featured: { icon: Star, label: 'Destacadas este mes', unit: '/mes' },
  superFeatured: { icon: Sparkles, label: 'Super destacadas este mes', unit: '/mes' },
};

const nextPlanFor = (plan: PlanType): PlanType | null => {
  const order = PLAN_ORDER_ALL;
  const idx = order.indexOf(plan);
  if (idx < 0) return 'corredora';
  return order[idx + 1] ?? null;
};

const UsageRow = ({
  usage,
  icon: Icon,
  label,
  unit,
}: {
  usage: PlanLimitUsage;
  icon: typeof Building2;
  label: string;
  unit: string;
}) => {
  const color =
    usage.isAtLimit ? 'text-destructive'
    : usage.isNearLimit ? 'text-amber-500'
    : 'text-muted-foreground';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2 text-foreground">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span>{label}</span>
        </div>
        <div className={cn('font-medium tabular-nums flex items-center gap-1', color)}>
          <span>{usage.used}</span>
          <span className="text-muted-foreground">/</span>
          {usage.isUnlimited ? (
            <InfinityIcon className="h-3.5 w-3.5" />
          ) : (
            <span>{usage.limit}</span>
          )}
          {unit && <span className="text-muted-foreground text-xs">{unit}</span>}
        </div>
      </div>
      <Progress
        value={usage.isUnlimited ? 8 : usage.percent}
        className={cn(
          'h-1.5',
          usage.isAtLimit && '[&>div]:bg-destructive',
          !usage.isAtLimit && usage.isNearLimit && '[&>div]:bg-amber-500'
        )}
      />
    </div>
  );
};

export const PlanLimitsCard = ({ compact = false }: { compact?: boolean }) => {
  const { plan, planDetails, isLoading, listings, projects, featured, superFeatured } = usePlanLimits();

  const nextPlan = nextPlanFor(plan);
  const nextPlanDetails = nextPlan ? PLAN_DETAILS[nextPlan] : null;
  const anyAtLimit = listings.isAtLimit || projects.isAtLimit || featured.isAtLimit;
  const anyNear = listings.isNearLimit || projects.isNearLimit || featured.isNearLimit;

  return (
    <Card className={cn('border-border', anyAtLimit && 'border-destructive/50')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              Plan {planDetails.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {planDetails.target}
            </p>
          </div>
          <Badge
            variant={anyAtLimit ? 'destructive' : anyNear ? 'secondary' : 'outline'}
            className="text-xs shrink-0"
          >
            {anyAtLimit ? 'Límite alcanzado' : anyNear ? 'Uso alto' : 'Activo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="h-24 animate-pulse bg-muted rounded" />
        ) : (
          <div className="space-y-3">
            <UsageRow usage={listings} {...rowMeta.listings} />
            {!compact && <UsageRow usage={projects} {...rowMeta.projects} />}
            <UsageRow usage={featured} {...rowMeta.featured} />
            {!compact && planDetails.includedSuperFeatured > 0 && (
              <UsageRow usage={superFeatured} {...rowMeta.superFeatured} />
            )}
          </div>
        )}

        {(anyAtLimit || anyNear) && nextPlanDetails && (
          <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
            <p className="text-xs text-foreground">
              {anyAtLimit ? 'Alcanzaste el límite de tu plan.' : 'Estás cerca del tope de tu plan.'}
              {' '}Con <span className="font-medium">{nextPlanDetails.name}</span> obtienes{' '}
              {nextPlanDetails.maxPublications >= 9999 ? 'publicaciones ilimitadas' : `${nextPlanDetails.maxPublications} publicaciones`}
              {nextPlanDetails.includedFeatured > 0 && ` y ${nextPlanDetails.includedFeatured} destacadas/mes`}.
            </p>
            <Button asChild size="sm" className="w-full gap-1">
              <Link to="/pricing">
                Mejorar plan
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}

        {!anyAtLimit && !anyNear && plan === 'free' && (
          <Button asChild variant="outline" size="sm" className="w-full gap-1">
            <Link to="/pricing">
              Ver planes de pago
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanLimitsCard;
