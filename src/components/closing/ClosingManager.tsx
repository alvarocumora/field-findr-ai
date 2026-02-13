import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllClosingSteps, useUpdateClosingStep, STEP_LABELS, ClosingStepStatus } from '@/hooks/useClosingSteps';
import { ClosingTimeline } from './ClosingTimeline';
import { FileText, ChevronDown, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_NEXT: Record<string, ClosingStepStatus> = {
  pending: 'in_progress',
  in_progress: 'completed',
};

const ClosingManager = () => {
  const { data: allSteps = [], isLoading } = useAllClosingSteps();
  const updateStep = useUpdateClosingStep();
  const [filter, setFilter] = useState('all');

  // Group by reservation
  const grouped = allSteps.reduce((acc, step) => {
    const rId = step.reservation_id || 'unknown';
    if (!acc[rId]) acc[rId] = { reservation: step.reservations, steps: [] };
    acc[rId].steps.push(step);
    return acc;
  }, {} as Record<string, { reservation: any; steps: typeof allSteps }>);

  const entries = Object.entries(grouped).filter(([, g]) => {
    if (filter === 'all') return true;
    return g.steps.some(s => s.status === filter);
  });

  const handleAdvance = (stepId: string, currentStatus: string) => {
    const next = STATUS_NEXT[currentStatus];
    if (!next) return;
    updateStep.mutate(
      { id: stepId, status: next, ...(next === 'completed' ? { completed_at: new Date().toISOString() } : {}) },
      {
        onSuccess: () => toast.success('Paso actualizado'),
        onError: () => toast.error('Error al actualizar'),
      }
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cierres Legales</h1>
          <p className="text-sm text-muted-foreground">Timeline de cierre para cada transacción</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="in_progress">En Progreso</SelectItem>
            <SelectItem value="completed">Completados</SelectItem>
            <SelectItem value="blocked">Bloqueados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      ) : entries.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin cierres en curso</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Los cierres legales se crean automáticamente cuando una reserva es pagada. El proceso incluye: Reserva → Promesa → Escritura → Inscripción CBR.
          </p>
          <Button variant="outline" className="mt-4 gap-2" asChild>
            <a href="/asesor/reservations">
              <FileText className="h-4 w-4" />
              Ir a Reservas
            </a>
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {entries.map(([rId, group]) => {
            const res = group.reservation;
            const lot = res?.lots;
            const project = lot?.projects;

            return (
              <Card key={rId}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {project?.name || 'Proyecto'} — Lote {lot?.lot_number}
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">{res?.buyer_name}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ClosingTimeline steps={group.steps} />

                  <div className="flex flex-wrap gap-2">
                    {group.steps
                      .filter(s => s.status === 'pending' || s.status === 'in_progress')
                      .map(s => (
                        <Button
                          key={s.id}
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs rounded-lg"
                          disabled={updateStep.isPending}
                          onClick={() => handleAdvance(s.id, s.status)}
                        >
                          <ArrowRight className="h-3 w-3" />
                          Avanzar {STEP_LABELS[s.step_type]}
                        </Button>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClosingManager;
