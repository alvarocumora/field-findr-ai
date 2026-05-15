import { Link } from 'react-router-dom';
import { Boxes, ExternalLink, FileWarning, Layers, RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ScenarioStatusBadge from '@/components/visual-scenarios/ScenarioStatusBadge';
import ScenarioTypeBadge from '@/components/visual-scenarios/ScenarioTypeBadge';
import { useAdminVisualScenarios } from '@/hooks/useVisualScenarios';
import { formatVisualScenarioCurrency } from '@/lib/visualScenarios';

const VisualScenariosAdmin = () => {
  const { data: scenarios = [], isLoading, isError, refetch, isFetching } = useAdminVisualScenarios();

  const totalConcept = scenarios.filter((scenario) => scenario.status === 'concept').length;
  const totalDraft = scenarios.filter((scenario) => scenario.status === 'draft').length;
  const totalApproved = scenarios.filter((scenario) => scenario.status === 'approved').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-primary">Admin</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Visual Scenarios</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Panel inicial para auditar escenarios visuales persistidos en Supabase. La edición completa se implementará en el siguiente sprint.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Layers className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{scenarios.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Boxes className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Conceptuales</p>
              <p className="text-2xl font-bold">{totalConcept}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <FileWarning className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Borradores</p>
              <p className="text-2xl font-bold">{totalDraft}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Layers className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">Validados</p>
              <p className="text-2xl font-bold">{totalApproved}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Escenarios registrados</CardTitle>
          <Badge variant="outline">Lectura admin</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              No se pudieron cargar los escenarios. Revisa que la migración esté aplicada y que el usuario tenga permisos admin.
            </div>
          ) : scenarios.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="font-semibold text-foreground">No hay escenarios registrados</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Aplica el seed de Teno o crea escenarios desde Supabase para comenzar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="rounded-xl border border-border/70 bg-background/70 p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <ScenarioTypeBadge type={scenario.type} />
                        <ScenarioStatusBadge status={scenario.status} />
                        {scenario.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{scenario.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {scenario.description || scenario.subtitle || 'Sin descripción'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Property ID: <span className="font-mono">{scenario.propertyId}</span>
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 text-sm lg:items-end">
                      <span className="text-muted-foreground">
                        CAPEX: {formatVisualScenarioCurrency(scenario.estimatedCapex)}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/propiedad/${scenario.propertyId}`}>
                          Ver ficha
                          <ExternalLink className="ml-2 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VisualScenariosAdmin;
