import { MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MapErrorStateProps {
  error?: string | null;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
}

const MapErrorState = ({ error, onRetry, className, variant = 'default' }: MapErrorStateProps) => {
  const isCompact = variant === 'compact';

  return (
    <div 
      className={cn(
        'flex items-center justify-center bg-muted/30 border border-border/50 rounded-xl',
        isCompact ? 'p-4' : 'p-8',
        className
      )}
    >
      <div className={cn('text-center', isCompact ? 'space-y-2' : 'space-y-4')}>
        <div className={cn(
          'mx-auto rounded-full bg-muted/50 flex items-center justify-center',
          isCompact ? 'w-10 h-10' : 'w-16 h-16'
        )}>
          {error ? (
            <AlertCircle className={cn('text-destructive', isCompact ? 'h-5 w-5' : 'h-8 w-8')} />
          ) : (
            <MapPin className={cn('text-muted-foreground', isCompact ? 'h-5 w-5' : 'h-8 w-8')} />
          )}
        </div>
        
        <div className="space-y-1">
          <p className={cn(
            'font-medium text-foreground',
            isCompact ? 'text-sm' : 'text-base'
          )}>
            {error ? 'Error al cargar el mapa' : 'Mapa no disponible'}
          </p>
          {error && !isCompact && (
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {error}
            </p>
          )}
        </div>

        {onRetry && (
          <Button 
            variant="outline" 
            size={isCompact ? 'sm' : 'default'}
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
        )}
      </div>
    </div>
  );
};

export default MapErrorState;
