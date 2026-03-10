import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ZoomIn,
  ZoomOut,
  Locate,
  Map as MapIcon,
  Satellite,
  Mountain,
  Moon,
  Layers,
  Ruler,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MapMode } from './MapModeSelector';

interface CompactMapControlsProps {
  mapMode: MapMode;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onFitAll: () => void;
  onResetNorth: () => void;
  onResetView: () => void;
  onChangeMapMode: (mode: MapMode) => void;
  onOpenTools: () => void;
  activeLayersCount: number;
  listingsCount: number;
  drawnArea: number | null;
}

const CompactMapControls = ({
  mapMode,
  onZoomIn,
  onZoomOut,
  onLocate,
  onChangeMapMode,
  onOpenTools,
  activeLayersCount,
  listingsCount,
  drawnArea,
}: CompactMapControlsProps) => {
  const styles: { mode: MapMode; icon: typeof MapIcon; label: string }[] = [
    { mode: 'satellite', icon: Satellite, label: 'Satélite' },
    { mode: 'streets', icon: MapIcon, label: 'Calles' },
    { mode: 'dark', icon: Moon, label: 'Oscuro' },
    { mode: '3d', icon: Mountain, label: '3D' },
  ];

  const ControlBtn = ({
    onClick,
    icon: Icon,
    tooltip,
    className: btnClass,
  }: {
    onClick: () => void;
    icon: React.ElementType;
    tooltip: string;
    className?: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClick}
          className={cn('h-9 w-9 rounded-none text-white/80 hover:text-white hover:bg-white/10', btnClass)}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs bg-black/80 text-white border-white/10">{tooltip}</TooltipContent>
    </Tooltip>
  );

  return (
    <>
      {/* Navigation controls — right side */}
      <div className="absolute top-1/2 -translate-y-1/2 right-3 z-10 flex flex-col items-end">
        <div className="flex flex-col bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden divide-y divide-white/10">
          <ControlBtn onClick={onZoomIn} icon={ZoomIn} tooltip="Acercar" />
          <ControlBtn onClick={onZoomOut} icon={ZoomOut} tooltip="Alejar" />
          <ControlBtn onClick={onLocate} icon={Locate} tooltip="Mi ubicación" />
        </div>
      </div>

      {/* Bottom left — property count badge */}
      <div className="absolute bottom-14 left-3 z-10">
        <div className="bg-black/60 backdrop-blur-xl rounded-lg border border-white/10 px-2.5 py-1.5 shadow-lg shadow-black/20">
          <p className="text-xs font-medium text-white/90">
            {listingsCount} propiedades
          </p>
          {drawnArea !== null && (
            <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <Ruler className="h-3 w-3" />
              {drawnArea >= 10000
                ? `${(drawnArea / 10000).toFixed(2)} ha`
                : `${drawnArea.toFixed(0)} m²`}
            </p>
          )}
        </div>
      </div>

      {/* Bottom right — style toggle + tools */}
      <div className="absolute bottom-14 right-3 z-10 flex items-end gap-2">
        {/* Style toggle */}
        <div className="flex bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
          {styles.map(({ mode, icon: Icon, label }) => (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onChangeMapMode(mode)}
                  className={cn(
                    'h-9 w-9 rounded-none text-white/60 hover:text-white hover:bg-white/10',
                    mapMode === mode && 'bg-white/20 text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs bg-black/80 text-white border-white/10">{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Tools / Layers button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onOpenTools}
              className="h-9 w-9 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl shadow-black/30 relative text-white/70 hover:text-white hover:bg-white/10"
            >
              <Layers className="h-4 w-4" />
              {activeLayersCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 flex items-center justify-center text-[9px] font-bold"
                >
                  {activeLayersCount}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs bg-black/80 text-white border-white/10">Capas y herramientas</TooltipContent>
        </Tooltip>
      </div>
    </>
  );
};

export default CompactMapControls;
