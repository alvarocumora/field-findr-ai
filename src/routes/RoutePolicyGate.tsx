import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAccess } from '@/hooks/useAccess';
import { PLAN_DETAILS } from '@/hooks/useSubscription';
import {
  FEATURE_LABELS,
  minimumPlanForFeature,
} from '@/lib/access/planEntitlements';
import { evaluateRoutePolicy, type RoutePolicy, type RoutePolicyDecision } from '@/lib/access/routePolicy';
import { PageLoader } from '@/routes/routeUtils';

interface RoutePolicyGateProps {
  policy?: RoutePolicy;
  children: ReactNode;
}

const RoutePolicyGate = ({ policy, children }: RoutePolicyGateProps) => {
  const access = useAccess();

  if (access.isLoading) return <PageLoader />;

  const result = evaluateRoutePolicy(policy, access);
  if (result.allowed === true) return <>{children}</>;
  const decision = result as Exclude<RoutePolicyDecision, { allowed: true }>;
  const feature = decision.reason === 'feature' ? (decision as { feature: Parameters<typeof minimumPlanForFeature>[0] }).feature : undefined;
  const capability = decision.reason === 'capability' ? (decision as { capability: string }).capability : undefined;

  if (decision.reason === 'feature') {
    const minimumPlan = minimumPlanForFeature(feature);
    const plan = PLAN_DETAILS[minimumPlan];

    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center py-10">
        <Card className="w-full border-primary/20">
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold">
              {FEATURE_LABELS[feature]} no está incluido en tu plan
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Tu rol tiene acceso a esta operación, pero esta herramienta requiere el plan{' '}
              {plan.name} o superior.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link to="/suscripcion">Mejorar plan</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/pricing">Comparar planes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center py-10">
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Tu rol no permite esta operación</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Esta sección requiere el permiso {capability}. Si trabajas dentro de una
            inmobiliaria, un administrador puede ajustar tu rol o asignación al proyecto.
          </p>
          <Button className="mt-6" variant="outline" asChild>
            <Link to="/panel">Volver a mi panel</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoutePolicyGate;
