import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PenTool,
  Edit3,
  Trash2,
  Save,
  X,
  CheckCircle,
  Ruler,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPolygonArea } from '@/lib/kmz/polygonValidator';
import { DrawingMode } from '@/hooks/usePolygonDrawing';

interface Lot {
  id: string;
  lot_number: string;
  area: number;
  status: string | null;
  polygon?: any;
}

interface LotDrawingToolProps {
  lots: Lot[];
  isDrawingMode: boolean;
  currentMode: DrawingMode;
  currentPolygon: {
    id: string;
    coordinates: [number, number][];
    area: number;
  } | null;
  selectedLotId: string | null;
  isSaving: boolean;
  onStartDrawing: () => void;
  onStartEditing: () => void;
  onStartDeleting: () => void;
  onCancelDrawing: () => void;
  onExitDrawingMode: () => void;
  onSelectLot: (lotId: string | null) => void;
  onSavePolygon: (lotId: string) => void;
  onDeletePolygon: (lotId: string) => void;
  className?: string;
}

export const LotDrawingTool = ({
  lots,
  isDrawingMode,
  currentMode,
  currentPolygon,
  selectedLotId,
  isSaving,
  onStartDrawing,
  onStartEditing,
  onStartDeleting,
  onCancelDrawing,
  onExitDrawingMode,
  onSelectLot,
  onSavePolygon,
  onDeletePolygon,
  className,
}: LotDrawingToolProps) => {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Get lots without polygons (for assignment)
  const lotsWithoutPolygons = lots.filter(
    (lot) => !lot.polygon || lot.polygon.length < 3
  );

  // Get lots with polygons (for editing/deleting)
  const lotsWithPolygons = lots.filter(
    (lot) => lot.polygon && lot.polygon.length >= 3
  );

  const handleSave = () => {
    if (selectedLotId) {
      onSavePolygon(selectedLotId);
    }
  };

  const handleConfirmDelete = (lotId: string) => {
    onDeletePolygon(lotId);
    setConfirmDelete(null);
  };

  const toolButtonClass = cn(
    'h-10 w-10 min-h-[40px] min-w-[40px]',
    'touch-manipulation transition-all duration-200'
  );

  if (!isDrawingMode) {
    return (
      <Card className={cn('p-3', className)}>
        <Button
          variant="default"
          size="sm"
          className="w-full gap-2"
          onClick={onStartDrawing}
        >
          <PenTool className="h-4 w-4" />
          Modo Edición de Polígonos
        </Button>
        {lotsWithoutPolygons.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {lotsWithoutPolygons.length} lotes sin polígono definido
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card className={cn('p-3 space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Edición de Polígonos</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onExitDrawingMode}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Drawing Tools */}
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1 justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={currentMode === 'draw' ? 'default' : 'outline'}
                className={toolButtonClass}
                onClick={onStartDrawing}
              >
                <PenTool className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Dibujar Polígono</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={currentMode === 'edit' ? 'default' : 'outline'}
                className={toolButtonClass}
                onClick={onStartEditing}
                disabled={lotsWithPolygons.length === 0}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Editar Existente</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={currentMode === 'delete' ? 'destructive' : 'outline'}
                className={toolButtonClass}
                onClick={onStartDeleting}
                disabled={lotsWithPolygons.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Eliminar Polígono</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn(toolButtonClass, 'text-destructive hover:text-destructive')}
                onClick={onCancelDrawing}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Cancelar</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Current Polygon Info */}
      {currentPolygon && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Polígono Dibujado</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Área:</span>
            </div>
            <Badge variant="secondary" className="justify-self-end">
              {formatPolygonArea(currentPolygon.area)}
            </Badge>

            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Vértices:</span>
            </div>
            <Badge variant="outline" className="justify-self-end">
              {currentPolygon.coordinates.length - 1}
            </Badge>
          </div>

          {/* Lot Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Asignar a lote:
            </label>
            <Select
              value={selectedLotId || ''}
              onValueChange={(value) => onSelectLot(value || null)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Seleccionar lote..." />
              </SelectTrigger>
              <SelectContent>
                {lotsWithoutPolygons.map((lot) => (
                  <SelectItem key={lot.id} value={lot.id}>
                    Lote {lot.lot_number} ({lot.area.toLocaleString()} m²)
                  </SelectItem>
                ))}
                {lotsWithoutPolygons.length === 0 && (
                  <SelectItem value="" disabled>
                    Todos los lotes tienen polígono
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Save Button */}
          <Button
            className="w-full gap-2"
            onClick={handleSave}
            disabled={!selectedLotId || isSaving}
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar Polígono'}
          </Button>
        </div>
      )}

      {/* Delete Mode - Lot List */}
      {currentMode === 'delete' && lotsWithPolygons.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Selecciona un lote para eliminar su polígono:
          </p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {lotsWithPolygons.map((lot) => (
              <div
                key={lot.id}
                className="flex items-center justify-between p-2 rounded-lg border hover:bg-destructive/5"
              >
                <span className="text-sm">
                  Lote {lot.lot_number}
                </span>
                {confirmDelete === lot.id ? (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={() => handleConfirmDelete(lot.id)}
                      disabled={isSaving}
                    >
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setConfirmDelete(null)}
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-destructive hover:text-destructive"
                    onClick={() => setConfirmDelete(lot.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>
          {currentMode === 'draw' && 'Doble clic para cerrar el polígono'}
          {currentMode === 'edit' && 'Arrastra los vértices para editar'}
          {currentMode === 'delete' && 'Selecciona un lote para eliminar'}
          {!currentMode && 'Selecciona una herramienta'}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <span>{lotsWithPolygons.length} con polígono</span>
        <span>{lotsWithoutPolygons.length} sin polígono</span>
      </div>
    </Card>
  );
};

export default LotDrawingTool;
