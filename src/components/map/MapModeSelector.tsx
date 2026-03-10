import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Map as MapIcon, Satellite, Mountain, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MapMode = 'satellite' | 'streets' | 'dark' | '3d';

interface MapModeSelectorProps {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
  className?: string;
}

const MapModeSelector = ({ mode, onChange, className }: MapModeSelectorProps) => {
  const modes: { value: MapMode; label: string; icon: React.ElementType; description: string }[] = [
    { value: 'satellite', label: 'Satélite', icon: Satellite, description: 'Vista satelital' },
    { value: 'streets', label: 'Calles', icon: MapIcon, description: 'Vista de calles' },
    { value: 'dark', label: 'Oscuro', icon: Moon, description: 'Vista oscura' },
    { value: '3d', label: '3D', icon: Mountain, description: 'Terreno 3D' },
  ];

  return (
    <div
      className={cn(
        'flex flex-col gap-1 p-1.5 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20',
        className
      )}
    >
      {modes.map(({ value, label, icon: Icon, description }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onChange(value)}
              className={cn(
                'h-10 w-10 transition-all duration-200 text-white/70 hover:text-white hover:bg-white/10',
                mode === value && 'bg-white/20 text-white ring-1 ring-white/30'
              )}
            >
              <Icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium bg-black/80 text-white border-white/10">
            <div className="text-sm">{description}</div>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};

export default MapModeSelector;
