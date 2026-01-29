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
  PenTool,
  Trash2,
  Layers,
  Ruler,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapControlsToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onFitAll: () => void;
  onResetNorth: () => void;
  onResetView: () => void;
  onStartDrawing?: () => void;
  onClearDrawing?: () => void;
  onOpenLayers?: () => void;
  isDrawing?: boolean;
  drawnArea?: number | null;
  showDrawTools?: boolean;
  activeLayersCount?: number;
  className?: string;
}

const MapControlsToolbar = ({
  onZoomIn,
  onZoomOut,
  onLocate,
  onFitAll,
  onResetNorth,
  onResetView,
  onStartDrawing,
  onClearDrawing,
  onOpenLayers,
  isDrawing = false,
  drawnArea = null,
  showDrawTools = true,
  activeLayersCount = 0,
  className,
}: MapControlsToolbarProps) => {
  const ControlButton = ({
    onClick,
    icon: Icon,
    tooltip,
    active = false,
    variant = 'ghost',
    className: buttonClassName,
  }: {
    onClick: () => void;
    icon: React.ElementType;
    tooltip: string;
    active?: boolean;
    variant?: 'ghost' | 'secondary' | 'default' | 'destructive';
    className?: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant={active ? 'secondary' : variant}
          onClick={onClick}
          className={cn(
            'h-10 w-10 transition-all duration-200',
            active && 'bg-primary/20 text-primary ring-1 ring-primary/30',
            buttonClassName
          )}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-medium">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Navigation Controls */}
      <div className="flex flex-col gap-1 p-1.5 rounded-xl bg-background/90 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5">
        <ControlButton onClick={onZoomIn} icon={ZoomIn} tooltip="Acercar" />
        <ControlButton onClick={onZoomOut} icon={ZoomOut} tooltip="Alejar" />
        <div className="h-px bg-border/50 mx-2 my-1" />
        <ControlButton onClick={onLocate} icon={Locate} tooltip="Mi ubicación" />
        <ControlButton onClick={onFitAll} icon={Maximize2} tooltip="Ver todas" />
        <div className="h-px bg-border/50 mx-2 my-1" />
        <ControlButton onClick={onResetNorth} icon={Compass} tooltip="Orientar al norte" />
        <ControlButton onClick={onResetView} icon={RotateCcw} tooltip="Restablecer vista" />
      </div>

      {/* Layers Control */}
      {onOpenLayers && (
        <div className="relative p-1.5 rounded-xl bg-background/90 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5">
          <ControlButton
            onClick={onOpenLayers}
            icon={Layers}
            tooltip="Capas de información"
            active={activeLayersCount > 0}
          />
          {activeLayersCount > 0 && (
            <Badge
              variant="default"
              className="absolute -top-1.5 -right-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground"
            >
              {activeLayersCount}
            </Badge>
          )}
        </div>
      )}

      {/* Drawing Tools */}
      {showDrawTools && onStartDrawing && (
        <div className="flex flex-col gap-1 p-1.5 rounded-xl bg-background/90 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5">
          <ControlButton
            onClick={onStartDrawing}
            icon={PenTool}
            tooltip={isDrawing ? 'Dibujando...' : 'Dibujar área'}
            active={isDrawing}
          />
          {drawnArea !== null && onClearDrawing && (
            <>
              <div className="h-px bg-border/50 mx-2 my-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={onClearDrawing}
                    className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  Borrar área
                </TooltipContent>
              </Tooltip>
              {/* Area Display */}
              <div className="px-2 py-1.5 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] font-medium text-primary">
                  <Ruler className="h-3 w-3" />
                  <span>
                    {drawnArea >= 10000
                      ? `${(drawnArea / 10000).toFixed(2)} ha`
                      : `${drawnArea.toFixed(0)} m²`}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MapControlsToolbar;
