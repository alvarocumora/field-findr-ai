import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  RotateCcw, RotateCw, ZoomIn, ZoomOut, Trash2, Camera, Save, RefreshCw, Ruler
} from 'lucide-react';
import { OBJECT_CATALOG, type ParcelaObjectType } from './useParcelaState';

interface ParcelaToolbarProps {
  onAddObject: (type: ParcelaObjectType) => void;
  onRotate: (delta: number) => void;
  onScale: (delta: number) => void;
  onRemoveSelected: () => void;
  onCapture: () => void;
  onSave: () => void;
  onReset: () => void;
  selectedId: string | null;
  lotInfo?: { lotNumber: string; area: number; price?: number };
}

export const ParcelaToolbar = ({
  onAddObject, onRotate, onScale, onRemoveSelected,
  onCapture, onSave, onReset, selectedId, lotInfo,
}: ParcelaToolbarProps) => {
  const catalogItems = Object.entries(OBJECT_CATALOG) as [ParcelaObjectType, typeof OBJECT_CATALOG[ParcelaObjectType]][];

  return (
    <Card className="w-56 flex flex-col h-full border-border/40 rounded-none sm:rounded-xl overflow-hidden">
      {/* Lot Info */}
      {lotInfo && (
        <div className="p-3 border-b border-border/40 bg-card">
          <p className="text-xs font-semibold text-foreground">Lote #{lotInfo.lotNumber}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Ruler className="h-3 w-3" />
            {lotInfo.area} m²
          </div>
          {lotInfo.price && (
            <p className="text-xs text-muted-foreground">${lotInfo.price.toLocaleString('es-CL')}</p>
          )}
        </div>
      )}

      {/* Catalog */}
      <div className="p-2 border-b border-border/40">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1 mb-1">
          Catálogo
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 grid grid-cols-2 gap-1.5">
          {catalogItems.map(([type, info]) => (
            <button
              key={type}
              onClick={() => onAddObject(type)}
              className="flex flex-col items-center p-2 rounded-lg hover:bg-accent/50 transition-colors text-center group"
            >
              <span className="text-xl mb-0.5">{info.icon}</span>
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground leading-tight">
                {info.label}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      {/* Transform Controls */}
      <div className="p-2 space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
          Controles
        </p>
        <div className="grid grid-cols-2 gap-1">
          <Button
            variant="outline" size="sm"
            onClick={() => onRotate(-Math.PI / 8)}
            disabled={!selectedId}
            className="h-8 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Rotar
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => onRotate(Math.PI / 8)}
            disabled={!selectedId}
            className="h-8 text-xs"
          >
            <RotateCw className="h-3 w-3 mr-1" />
            Rotar
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => onScale(0.15)}
            disabled={!selectedId}
            className="h-8 text-xs"
          >
            <ZoomIn className="h-3 w-3 mr-1" />
            +
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => onScale(-0.15)}
            disabled={!selectedId}
            className="h-8 text-xs"
          >
            <ZoomOut className="h-3 w-3 mr-1" />
            –
          </Button>
        </div>
        <Button
          variant="destructive" size="sm"
          onClick={onRemoveSelected}
          disabled={!selectedId}
          className="w-full h-8 text-xs"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Eliminar
        </Button>
      </div>

      <Separator />

      {/* Actions */}
      <div className="p-2 space-y-1">
        <Button variant="outline" size="sm" onClick={onCapture} className="w-full h-8 text-xs">
          <Camera className="h-3 w-3 mr-1" /> Captura
        </Button>
        <Button variant="default" size="sm" onClick={onSave} className="w-full h-8 text-xs">
          <Save className="h-3 w-3 mr-1" /> Guardar
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset} className="w-full h-8 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 mr-1" /> Reset
        </Button>
      </div>

      {selectedId && (
        <div className="p-2 border-t border-border/40">
          <Badge variant="secondary" className="text-[10px]">
            Seleccionado
          </Badge>
        </div>
      )}
    </Card>
  );
};
