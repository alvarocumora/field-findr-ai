import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Boxes, ExternalLink, FileWarning, Layers, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ScenarioStatusBadge from '@/components/visual-scenarios/ScenarioStatusBadge';
import ScenarioTypeBadge from '@/components/visual-scenarios/ScenarioTypeBadge';
import VisualScenarioFormDialog from '@/components/visual-scenarios/VisualScenarioFormDialog';
import {
  useAdminVisualScenarios,
  useCreateVisualScenario,
  useDeleteVisualScenario,
  useUpdateVisualScenario,
  type VisualScenarioEditorInput,
} from '@/hooks/useVisualScenarios';
import { formatVisualScenarioCurrency } from '@/lib/visualScenarios';
import type { VisualScenario } from '@/types/visualScenario';

const VisualScenariosAdmin = () => {
  const { data: scenarios = [], isLoading, isError, refetch, isFetching } = useAdminVisualScenarios();
  const createScenario = useCreateVisualScenario();
  const updateScenario = useUpdateVisualScenario();
  const deleteScenario = useDeleteVisualScenario();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<VisualScenario | null>(null);

  const totalConcept = scenarios.filter((scenario) => scenario.status === 'concept').length;
  const totalDraft = scenarios.filter((scenario) => scenario.status === 'draft').length;
  const totalApproved = scenarios.filter((scenario) => scenario.status === 'approved').length;
  const isSubmitting = createScenario.isPending || updateScenario.isPending;

  const openCreate = () => {
    setSelectedScenario(null);
    setDialogOpen(true);
  };

  const openEdit = (scenario: VisualScenario) => {
    setSelectedScenario(scenario);
    setDialogOpen(true);
  };

  const handleSubmit = async (input: VisualScenarioEditorInput) => {
    try {
      if (selectedScenario) {
        await updateScenario.mutateAsync({ id: selectedScenario.id, input });
        toast.success('Escenario actualizado');
      } else {
        await createScenario.mutateAsync(input);
        toast.success('Escenario creado');
      }
      setDialogOpen(false);
      setSelectedScenario(null);
    } catch (error) {
      console.error('Visual scenario save error:', error);
      toast.error('No se pudo guardar el escenario');
    }
  };

  const handleDelete = async (scenario: VisualScenario) => {
    const confirmed = window.confirm(`¿Eliminar el escenario "${scenario.title}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      await deleteScenario.mutateAsync({ id: scenario.id, propertyId: scenario.propertyId });
      toast.success('Escenario eliminado');
    } catch (error) {
      console.error('Visual scenario delete error:', error);
      toast.error('No se pudo eliminar el escenario');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-primary">Admin</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Visual Scenarios</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Panel para crear, editar y auditar escenarios visuales persistidos en Supabase. Métricas avanzadas, GLB, IA y PDF se gestionarán en sprints posteriores.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Crear escenario
          </Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
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
          <Badge variant="outline">Admin CRUD básico</Badge>
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
                Crea un escenario desde el botón superior o aplica el seed de Teno para comenzar.
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
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/propiedad/${scenario.propertyId}`}>
                            Ver ficha
                            <ExternalLink className="ml-2 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(scenario)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-destructive/30 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(scenario)}
                          disabled={deleteScenario.isPending}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <VisualScenarioFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        scenario={selectedScenario}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default VisualScenariosAdmin;
