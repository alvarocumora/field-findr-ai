import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ZoomIn,
  ZoomOut,
  Map as MapIcon,
  Satellite,
  Mountain,
  Layers,
  Ruler,
} from 'lucide-react';
import type { MapMode } from './MapModeSelector';

interface CompactMapControlsProps {
  mapMode: MapMode;
  onZoomIn: () => void;
  onZoomOut: () => void;
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

  return (
    <>
      {/* Property count - top right */}
      <div className="absolute top-3 right-3 z-10">
        <div className="bg-background/90 backdrop-blur-sm rounded-lg border border-border/50 px-3 py-1.5 shadow-sm">
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

      {/* Controls stack - bottom right */}
      <div className="absolute bottom-6 right-3 z-10 flex flex-col gap-2 items-end">
        {/* Zoom */}
        <div className="flex flex-col bg-background/90 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" onClick={onZoomIn} className="h-9 w-9 rounded-none border-b border-border/30">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Acercar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" onClick={onZoomOut} className="h-9 w-9 rounded-none">
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Alejar</TooltipContent>
          </Tooltip>
        </div>

        {/* Style toggle */}
        <div className="flex bg-background/90 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm overflow-hidden">
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
              <TooltipContent side="left">{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Tools button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onOpenTools}
              className="h-9 w-9 bg-background/90 backdrop-blur-sm border border-border/50 shadow-sm relative"
            >
              <Layers className="h-4 w-4" />
              {activeLayersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                  {activeLayersCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Capas y herramientas</TooltipContent>
        </Tooltip>
      </div>
    </>
  );
};

export default CompactMapControls;
