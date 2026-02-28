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
  Compass,
  Maximize2,
  RotateCcw,
  Map as MapIcon,
  Satellite,
  Mountain,
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
  onFitAll,
  onResetNorth,
  onResetView,
  onChangeMapMode,
  onOpenTools,
  activeLayersCount,
  listingsCount,
  drawnArea,
}: CompactMapControlsProps) => {
  const styles: { mode: MapMode; icon: typeof MapIcon; label: string }[] = [
    { mode: 'streets', icon: MapIcon, label: 'Calles' },
    { mode: 'satellite', icon: Satellite, label: 'Satélite' },
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
          className={cn('h-9 w-9 rounded-none', btnClass)}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs">{tooltip}</TooltipContent>
    </Tooltip>
  );

  return (
    <>
      {/* Property count badge - top left to avoid SearchAreaButton overlap */}
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-background/90 backdrop-blur-sm rounded-lg border border-border/50 px-2.5 py-1.5 shadow-sm">
          <p className="text-xs font-medium text-foreground">
            {listingsCount} propiedades
          </p>
          {drawnArea !== null && (
            <p className="text-[10px] text-primary flex items-center gap-1 mt-0.5">
              <Ruler className="h-3 w-3" />
              {drawnArea >= 10000
                ? `${(drawnArea / 10000).toFixed(2)} ha`
                : `${drawnArea.toFixed(0)} m²`}
            </p>
          )}
        </div>
      </div>

      {/* Navigation controls - right side, vertically centered */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
        {/* Zoom + Navigation */}
        <div className="flex flex-col bg-background/90 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg overflow-hidden divide-y divide-border/30">
          <ControlBtn onClick={onZoomIn} icon={ZoomIn} tooltip="Acercar" />
          <ControlBtn onClick={onZoomOut} icon={ZoomOut} tooltip="Alejar" />
          <ControlBtn onClick={onLocate} icon={Locate} tooltip="Mi ubicación" />
          <ControlBtn onClick={onFitAll} icon={Maximize2} tooltip="Ver todas las propiedades" />
          <ControlBtn onClick={onResetNorth} icon={Compass} tooltip="Orientar al norte" />
          <ControlBtn onClick={onResetView} icon={RotateCcw} tooltip="Restablecer vista" />
        </div>
      </div>

      {/* Bottom controls - style toggle + tools */}
      <div className="absolute bottom-8 right-3 z-10 flex flex-col gap-2 items-end">
        {/* Style toggle */}
        <div className="flex bg-background/90 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg overflow-hidden">
          {styles.map(({ mode, icon: Icon, label }) => (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={mapMode === mode ? 'secondary' : 'ghost'}
                  onClick={() => onChangeMapMode(mode)}
                  className="h-9 w-9 rounded-none"
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">{label}</TooltipContent>
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
              className="h-9 w-9 bg-background/90 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg relative"
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
          <TooltipContent side="left" className="text-xs">Capas y herramientas</TooltipContent>
        </Tooltip>
      </div>
    </>
  );
};

export default CompactMapControls;
