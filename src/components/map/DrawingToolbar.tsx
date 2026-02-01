import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PenTool,
  Trash2,
  Square,
  Circle,
  Edit3,
  Check,
  X,
  Ruler,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DrawingMode = 'polygon' | 'rectangle' | 'circle' | 'edit' | null;

interface DrawingToolbarProps {
  currentMode: DrawingMode;
  isDrawing: boolean;
  drawnArea: number | null;
  onStartPolygon: () => void;
  onStartRectangle?: () => void;
  onStartCircle?: () => void;
  onEditMode?: () => void;
  onConfirm?: () => void;
  onCancel: () => void;
  onClear: () => void;
  className?: string;
}

const formatArea = (area: number) => {
  if (area >= 10000) {
    const hectares = area / 10000;
    return `${hectares.toFixed(2)} há`;
  }
  return `${area.toLocaleString()} m²`;
};

export const DrawingToolbar = ({
  currentMode,
  isDrawing,
  drawnArea,
  onStartPolygon,
  onStartRectangle,
  onStartCircle,
  onEditMode,
  onConfirm,
  onCancel,
  onClear,
  className
}: DrawingToolbarProps) => {
  const toolButtonClass = cn(
    'h-10 w-10 min-h-[40px] min-w-[40px]',
    'touch-manipulation transition-all duration-200'
  );

  return (
    <Card className={cn('drawing-toolbar', className)}>
      <TooltipProvider delayDuration={300}>
        {/* Drawing Tools */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={currentMode === 'polygon' ? 'default' : 'ghost'}
                className={toolButtonClass}
                onClick={onStartPolygon}
              >
                <PenTool className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Dibujar Polígono</p>
            </TooltipContent>
          </Tooltip>

          {onStartRectangle && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={currentMode === 'rectangle' ? 'default' : 'ghost'}
                  className={toolButtonClass}
                  onClick={onStartRectangle}
                >
                  <Square className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Dibujar Rectángulo</p>
              </TooltipContent>
            </Tooltip>
          )}

          {onStartCircle && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={currentMode === 'circle' ? 'default' : 'ghost'}
                  className={toolButtonClass}
                  onClick={onStartCircle}
                >
                  <Circle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Dibujar Círculo</p>
              </TooltipContent>
            </Tooltip>
          )}

          {onEditMode && drawnArea !== null && (
            <>
              <div className="w-px h-6 bg-border mx-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={currentMode === 'edit' ? 'default' : 'ghost'}
                    className={toolButtonClass}
                    onClick={onEditMode}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Editar Polígono</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* Separator */}
        {(isDrawing || drawnArea !== null) && (
          <div className="w-px h-6 bg-border mx-1" />
        )}

        {/* Drawing Actions */}
        {isDrawing && (
          <div className="flex items-center gap-1">
            {onConfirm && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(toolButtonClass, 'text-green-600 hover:text-green-600 hover:bg-green-500/10')}
                    onClick={onConfirm}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Confirmar</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(toolButtonClass, 'text-destructive hover:text-destructive hover:bg-destructive/10')}
                  onClick={onCancel}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Cancelar</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Clear Button */}
        {drawnArea !== null && !isDrawing && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn(toolButtonClass, 'text-destructive hover:text-destructive hover:bg-destructive/10')}
                onClick={onClear}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Borrar Área</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Area Display */}
        {drawnArea !== null && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <Badge 
              variant="secondary" 
              className="gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20"
            >
              <Ruler className="h-3.5 w-3.5" />
              {formatArea(drawnArea)}
            </Badge>
          </>
        )}
      </TooltipProvider>
    </Card>
  );
};

export default DrawingToolbar;
