import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineStep {
  key: string;
  label: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  completedAt?: string | null;
}

interface PurchaseTimelineProps {
  steps: TimelineStep[];
}

export const PurchaseTimeline = ({ steps }: PurchaseTimelineProps) => {
  return (
    <div className="relative">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const isCompleted = step.status === 'completed';
        const isActive = step.status === 'in_progress';

        return (
          <div key={step.key} className="flex gap-4 relative">
            {/* Vertical line */}
            {!isLast && (
              <div className={cn(
                'absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-8px)]',
                isCompleted ? 'bg-primary' : 'bg-border'
              )} />
            )}

            {/* Icon */}
            <div className="relative z-10 mt-1 shrink-0">
              {isCompleted ? (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                </div>
              ) : isActive ? (
                <div className="h-8 w-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center animate-pulse">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-8 min-w-0', isLast && 'pb-0')}>
              <p className={cn(
                'text-sm font-semibold',
                isCompleted ? 'text-foreground' : isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              {step.completedAt && (
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  {new Date(step.completedAt).toLocaleDateString('es-CL', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
