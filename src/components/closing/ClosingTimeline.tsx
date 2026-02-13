import { Badge } from '@/components/ui/badge';
import { ClosingStep, STEP_LABELS, ClosingStepType } from '@/hooks/useClosingSteps';
import { CheckCircle2, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STEP_ORDER: ClosingStepType[] = ['reserva', 'promesa', 'escritura', 'inscripcion_cbr'];

const STATUS_ICON = {
  completed: CheckCircle2,
  in_progress: Loader2,
  pending: Clock,
  blocked: AlertTriangle,
};
const STATUS_COLOR = {
  completed: 'bg-green-500 text-white',
  in_progress: 'bg-primary text-primary-foreground animate-pulse',
  pending: 'bg-muted text-muted-foreground',
  blocked: 'bg-red-500 text-white',
};

interface Props {
  steps: ClosingStep[];
}

export function ClosingTimeline({ steps }: Props) {
  const stepsMap = new Map(steps.map(s => [s.step_type, s]));

  return (
    <div className="flex items-start gap-0">
      {STEP_ORDER.map((type, i) => {
        const step = stepsMap.get(type);
        const status = step?.status || 'pending';
        const Icon = STATUS_ICON[status];

        return (
          <div key={type} className="flex items-start flex-1">
            <div className="flex flex-col items-center text-center">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${STATUS_COLOR[status]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-foreground mt-2">{STEP_LABELS[type]}</p>
              {step?.completed_at && (
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(step.completed_at), 'dd MMM', { locale: es })}
                </p>
              )}
              {step?.assigned_to && (
                <p className="text-[10px] text-muted-foreground truncate max-w-[80px]">{step.assigned_to}</p>
              )}
            </div>
            {i < STEP_ORDER.length - 1 && (
              <div className={`flex-1 h-0.5 mt-5 mx-1 ${status === 'completed' ? 'bg-green-500' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
