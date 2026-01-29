import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Map as MapIcon, Satellite, Mountain } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MapMode = 'streets' | 'satellite' | '3d';

interface MapModeSelectorProps {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
  className?: string;
}

const MapModeSelector = ({ mode, onChange, className }: MapModeSelectorProps) => {
  const modes: { value: MapMode; label: string; icon: React.ElementType; description: string }[] = [
    { value: 'streets', label: 'Calles', icon: MapIcon, description: 'Vista de calles' },
    { value: 'satellite', label: 'Satélite', icon: Satellite, description: 'Vista satelital' },
    { value: '3d', label: '3D', icon: Mountain, description: 'Terreno 3D' },
  ];

  return (
    <div
      className={cn(
        'flex flex-col gap-1 p-1.5 rounded-xl bg-background/90 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5',
        className
      )}
    >
      {modes.map(({ value, label, icon: Icon, description }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={mode === value ? 'secondary' : 'ghost'}
              onClick={() => onChange(value)}
              className={cn(
                'h-10 w-10 transition-all duration-200',
                mode === value && 'bg-primary/20 text-primary ring-1 ring-primary/30'
              )}
            >
              <Icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            <div className="text-sm">{description}</div>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};

export default MapModeSelector;
