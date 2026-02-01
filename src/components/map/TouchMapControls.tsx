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

interface TouchMapControlsProps {
  mapMode: 'streets' | 'satellite' | '3d';
  isDrawing: boolean;
  drawnArea: number | null;
  showDrawTools: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  onFitAll: () => void;
  onResetNorth: () => void;
  onResetView: () => void;
  onChangeMapMode: (mode: 'streets' | 'satellite' | '3d') => void;
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

  // Common button classes for touch-friendly sizing (56px for better touch targets)
  const touchButtonClass = "h-14 w-14 min-h-[56px] min-w-[56px] touch-manipulation active:scale-95 transition-all duration-200 hover:bg-accent/80";
  const touchIconClass = "h-6 w-6";

  return (
    <>
      {/* Main Controls - Bottom Center (Mobile-optimized) */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 md:hidden">
        <Card className="bg-background/95 backdrop-blur-md border border-white/10 p-2 shadow-lg">
          <div className="flex items-center gap-1">
            {/* Zoom Controls */}
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={onZoomOut} 
              className={touchButtonClass}
              aria-label="Alejar"
            >
              <ZoomOut className={touchIconClass} />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={onZoomIn} 
              className={touchButtonClass}
              aria-label="Acercar"
            >
              <ZoomIn className={touchIconClass} />
            </Button>

            {/* Separator */}
            <div className="w-px h-8 bg-border mx-1" />

            {/* Location */}
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={onLocate} 
              className={touchButtonClass}
              aria-label="Mi ubicación"
            >
              <Target className={touchIconClass} />
            </Button>

            {/* Map Style Toggle */}
            <Button 
              size="icon" 
              variant={mapMode === 'satellite' ? 'secondary' : 'ghost'} 
              onClick={() => onChangeMapMode(mapMode === 'satellite' ? 'streets' : 'satellite')} 
              className={touchButtonClass}
              aria-label="Cambiar estilo de mapa"
            >
              {mapMode === 'satellite' ? (
                <MapIcon className={touchIconClass} />
              ) : (
                <Satellite className={touchIconClass} />
              )}
            </Button>

            {/* Layers */}
            <Button 
              size="icon" 
              variant={activeLayersCount > 0 ? 'secondary' : 'ghost'} 
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

            {/* Expand/Collapse More Options */}
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setIsExpanded(!isExpanded)} 
              className={touchButtonClass}
              aria-label={isExpanded ? "Menos opciones" : "Más opciones"}
            >
              {isExpanded ? (
                <ChevronDown className={touchIconClass} />
              ) : (
                <ChevronUp className={touchIconClass} />
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Expanded Controls - Above main controls */}
      {isExpanded && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-20 md:hidden animate-in slide-in-from-bottom-4 duration-200">
          <Card className="bg-background/95 backdrop-blur-md border border-white/10 p-2 shadow-lg">
            <div className="flex items-center gap-1">
              {/* 3D Mode */}
              <Button 
                size="icon" 
                variant={mapMode === '3d' ? 'secondary' : 'ghost'} 
                onClick={() => onChangeMapMode(mapMode === '3d' ? 'streets' : '3d')} 
                className={touchButtonClass}
                aria-label="Vista 3D"
              >
                <Mountain className={touchIconClass} />
              </Button>

              {/* Fit All */}
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={onFitAll} 
                className={touchButtonClass}
                aria-label="Ver todas las propiedades"
              >
                <Maximize2 className={touchIconClass} />
              </Button>

              {/* Reset North */}
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={onResetNorth} 
                className={touchButtonClass}
                aria-label="Orientar al norte"
              >
                <Compass className={touchIconClass} />
              </Button>

              {/* Reset View */}
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={onResetView} 
                className={touchButtonClass}
                aria-label="Restablecer vista"
              >
                <RotateCcw className={touchIconClass} />
              </Button>

              {/* Drawing Tools */}
              {showDrawTools && (
                <>
                  <div className="w-px h-8 bg-border mx-1" />
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
                      className={cn(touchButtonClass, "text-destructive")}
                      aria-label="Borrar área dibujada"
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

      {/* Touch Gesture Hints - Only show briefly on first load */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none md:hidden">
        {/* This could show gesture hints on first visit */}
      </div>
    </>
  );
};

export default TouchMapControls;
