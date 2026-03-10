import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ZoomIn,
  ZoomOut,
  Locate,
  Maximize2,
  Compass,
  Mountain,
  Satellite,
  Moon,
  Map as MapIcon,
  RotateCcw,
  PenTool,
  Trash2,
  Target,
  Layers,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { MapMode } from './MapModeSelector';

interface TouchMapControlsProps {
  mapMode: MapMode;
  isDrawing: boolean;
  drawnArea: number | null;
  showDrawTools: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onFitAll: () => void;
  onResetNorth: () => void;
  onResetView: () => void;
  onChangeMapMode: (mode: MapMode) => void;
  onStartDrawing: () => void;
  onClearDrawing: () => void;
  onOpenLayers: () => void;
  activeLayersCount: number;
}

const TouchMapControls = ({
  mapMode,
  isDrawing,
  drawnArea,
  showDrawTools,
  onZoomIn,
  onZoomOut,
  onLocate,
  onFitAll,
  onResetNorth,
  onResetView,
  onChangeMapMode,
  onStartDrawing,
  onClearDrawing,
  onOpenLayers,
  activeLayersCount,
}: TouchMapControlsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const touchButtonClass = "h-14 w-14 min-h-[56px] min-w-[56px] touch-manipulation active:scale-95 transition-all duration-200 text-white/80 hover:text-white hover:bg-white/10";
  const touchIconClass = "h-6 w-6";

  const modeIcons: Record<MapMode, typeof MapIcon> = {
    satellite: Satellite,
    streets: MapIcon,
    dark: Moon,
    '3d': Mountain,
  };

  const nextMode = (): MapMode => {
    const order: MapMode[] = ['satellite', 'streets', 'dark', '3d'];
    const idx = order.indexOf(mapMode);
    return order[(idx + 1) % order.length];
  };

  const NextIcon = modeIcons[nextMode()];

  return (
    <>
      {/* Main Controls - Bottom Center */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 md:hidden">
        <Card className="bg-black/60 backdrop-blur-xl border border-white/10 p-2 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={onZoomOut} className={touchButtonClass} aria-label="Alejar">
              <ZoomOut className={touchIconClass} />
            </Button>
            <Button size="icon" variant="ghost" onClick={onZoomIn} className={touchButtonClass} aria-label="Acercar">
              <ZoomIn className={touchIconClass} />
            </Button>

            <div className="w-px h-8 bg-white/10 mx-1" />

            <Button size="icon" variant="ghost" onClick={onLocate} className={touchButtonClass} aria-label="Mi ubicación">
              <Target className={touchIconClass} />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => onChangeMapMode(nextMode())}
              className={touchButtonClass}
              aria-label="Cambiar estilo de mapa"
            >
              <NextIcon className={touchIconClass} />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={onOpenLayers}
              className={cn(touchButtonClass, "relative")}
              aria-label="Capas de información"
            >
              <Layers className={touchIconClass} />
              {activeLayersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {activeLayersCount}
                </span>
              )}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className={touchButtonClass}
              aria-label={isExpanded ? "Menos opciones" : "Más opciones"}
            >
              {isExpanded ? <ChevronDown className={touchIconClass} /> : <ChevronUp className={touchIconClass} />}
            </Button>
          </div>
        </Card>
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-20 md:hidden animate-in slide-in-from-bottom-4 duration-200">
          <Card className="bg-black/60 backdrop-blur-xl border border-white/10 p-2 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={onFitAll} className={touchButtonClass} aria-label="Ver todas">
                <Maximize2 className={touchIconClass} />
              </Button>
              <Button size="icon" variant="ghost" onClick={onResetNorth} className={touchButtonClass} aria-label="Norte">
                <Compass className={touchIconClass} />
              </Button>
              <Button size="icon" variant="ghost" onClick={onResetView} className={touchButtonClass} aria-label="Restablecer">
                <RotateCcw className={touchIconClass} />
              </Button>

              {showDrawTools && (
                <>
                  <div className="w-px h-8 bg-white/10 mx-1" />
                  <Button
                    size="icon"
                    variant={isDrawing ? 'default' : 'ghost'}
                    onClick={onStartDrawing}
                    className={touchButtonClass}
                    aria-label="Dibujar área"
                  >
                    <PenTool className={touchIconClass} />
                  </Button>
                  {drawnArea !== null && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={onClearDrawing}
                      className={cn(touchButtonClass, "text-red-400")}
                      aria-label="Borrar área"
                    >
                      <Trash2 className={touchIconClass} />
                    </Button>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default TouchMapControls;
