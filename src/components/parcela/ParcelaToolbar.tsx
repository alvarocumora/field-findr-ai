import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  RotateCcw, RotateCw, ZoomIn, ZoomOut, Trash2, Camera, Save, RefreshCw,
  Ruler, ChevronDown, ChevronRight, Undo2, Redo2, Sun, Eye, Grid3X3,
  Move, RotateCcw as RotateIcon, Maximize, Footprints, FileDown
} from 'lucide-react';
import { OBJECT_CATALOG, CATEGORY_LABELS, type ParcelaObjectType, type CatalogCategory, type ViewMode, type TransformMode } from './useParcelaState';

interface ParcelaToolbarProps {
  onAddObject: (type: ParcelaObjectType) => void;
  onRotate: (delta: number) => void;
  onScale: (delta: number) => void;
  onRemoveSelected: () => void;
  onCapture: () => void;
  onSave: () => void;
  onReset: () => void;
  onExportPdf?: () => void;
  selectedId: string | null;
  lotInfo?: { lotNumber: string; area: number; price?: number };
  // New controls
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  snapEnabled?: boolean;
  onToggleSnap?: () => void;
  viewMode?: ViewMode;
  onSetViewMode?: (mode: ViewMode) => void;
  transformMode?: TransformMode;
  onSetTransformMode?: (mode: TransformMode) => void;
  solarHour?: number;
  onSetSolarHour?: (hour: number) => void;
  measureMode?: boolean;
  onToggleMeasure?: () => void;
}

export const ParcelaToolbar = ({
  onAddObject, onRotate, onScale, onRemoveSelected,
  onCapture, onSave, onReset, onExportPdf, selectedId, lotInfo,
  onUndo, onRedo, canUndo, canRedo,
  snapEnabled, onToggleSnap,
  viewMode, onSetViewMode,
  transformMode, onSetTransformMode,
  solarHour = 14, onSetSolarHour,
  measureMode, onToggleMeasure,
}: ParcelaToolbarProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<CatalogCategory>>(new Set(['vivienda']));

  const toggleCategory = (cat: CatalogCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const groupedItems = Object.entries(OBJECT_CATALOG).reduce((acc, [type, item]) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push({ type: type as ParcelaObjectType, ...item });
    return acc;
  }, {} as Record<CatalogCategory, (typeof OBJECT_CATALOG[ParcelaObjectType] & { type: ParcelaObjectType })[]>);

  const categoryOrder: CatalogCategory[] = ['vivienda', 'agua', 'cercos', 'vegetacion', 'outdoor', 'infraestructura', 'recreacion'];

  const formatHour = (h: number) => {
    const hh = Math.floor(h);
    return `${hh.toString().padStart(2, '0')}:00`;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="w-60 flex flex-col h-full border-border/40 rounded-none sm:rounded-l-xl overflow-hidden">
        {/* Lot Info */}
        {lotInfo && (
          <div className="p-3 border-b border-border/40 bg-card">
            <p className="text-xs font-semibold text-foreground">Lote #{lotInfo.lotNumber}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Ruler className="h-3 w-3" />
              {lotInfo.area.toLocaleString('es-CL')} m²
            </div>
            {lotInfo.price && (
              <p className="text-xs text-muted-foreground">${lotInfo.price.toLocaleString('es-CL')}</p>
            )}
          </div>
        )}

        {/* View / Transform Mode Bar */}
        <div className="p-2 border-b border-border/40 space-y-2">
          {/* View modes */}
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'orbit' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-7 text-[10px]"
                  onClick={() => onSetViewMode?.('orbit')}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Vista orbital</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'top' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-7 text-[10px]"
                  onClick={() => onSetViewMode?.('top')}
                >
                  <Grid3X3 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Vista cenital</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'pedestrian' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-7 text-[10px]"
                  onClick={() => onSetViewMode?.('pedestrian')}
                >
                  <Footprints className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Vista peatón (WASD)</TooltipContent>
            </Tooltip>
          </div>

          {/* Transform modes */}
          {viewMode !== 'pedestrian' && (
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={transformMode === 'translate' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 h-7 text-[10px]"
                    onClick={() => onSetTransformMode?.('translate')}
                  >
                    <Move className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mover</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={transformMode === 'rotate' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 h-7 text-[10px]"
                    onClick={() => onSetTransformMode?.('rotate')}
                  >
                    <RotateIcon className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rotar</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={transformMode === 'scale' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 h-7 text-[10px]"
                    onClick={() => onSetTransformMode?.('scale')}
                  >
                    <Maximize className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Escalar</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Solar simulation slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Sun className="h-3 w-3" />
                <span>Sol: {formatHour(solarHour)}</span>
              </div>
            </div>
            <Slider
              value={[solarHour]}
              min={5}
              max={21}
              step={0.5}
              onValueChange={([v]) => onSetSolarHour?.(v)}
              className="w-full"
            />
            {/* Season presets */}
            <div className="flex gap-1 mt-1">
              <Button variant="ghost" size="sm" className="h-5 text-[8px] flex-1 px-0" onClick={() => onSetSolarHour?.(14)}>
                ☀️ Verano
              </Button>
              <Button variant="ghost" size="sm" className="h-5 text-[8px] flex-1 px-0" onClick={() => onSetSolarHour?.(10)}>
                ❄️ Invierno
              </Button>
              <Button variant="ghost" size="sm" className="h-5 text-[8px] flex-1 px-0" onClick={() => onSetSolarHour?.(7)}>
                🌅 Amanecer
              </Button>
              <Button variant="ghost" size="sm" className="h-5 text-[8px] flex-1 px-0" onClick={() => onSetSolarHour?.(19)}>
                🌇 Atardecer
              </Button>
            </div>
          </div>

          {/* Quick toggles */}
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={snapEnabled ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-6 text-[9px]"
                  onClick={onToggleSnap}
                >
                  <Grid3X3 className="h-2.5 w-2.5 mr-0.5" />Snap
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ajustar a grilla (50cm)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={measureMode ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-6 text-[9px]"
                  onClick={onToggleMeasure}
                >
                  <Ruler className="h-2.5 w-2.5 mr-0.5" />Medir
                </Button>
              </TooltipTrigger>
              <TooltipContent>Modo medición de distancias</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Catalog by category */}
        <ScrollArea className="flex-1">
          <div className="py-1">
            {categoryOrder.map((cat) => {
              const items = groupedItems[cat] || [];
              const catInfo = CATEGORY_LABELS[cat];
              const isExpanded = expandedCategories.has(cat);

              return (
                <div key={cat}>
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent/30 transition-colors text-left"
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    <span className="text-sm">{catInfo.icon}</span>
                    <span className="text-[11px] font-medium text-foreground">{catInfo.label}</span>
                    <Badge variant="secondary" className="ml-auto text-[9px] h-4 px-1">{items.length}</Badge>
                  </button>
                  {isExpanded && (
                    <div className="px-2 pb-1 grid grid-cols-2 gap-1">
                      {items.map(({ type, icon, label }) => (
                        <button
                          key={type}
                          onClick={() => onAddObject(type)}
                          className="flex flex-col items-center p-1.5 rounded-md hover:bg-accent/50 transition-colors text-center group"
                          title={OBJECT_CATALOG[type].description}
                        >
                          <span className="text-lg leading-none">{icon}</span>
                          <span className="text-[9px] text-muted-foreground group-hover:text-foreground leading-tight mt-0.5 line-clamp-1">
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <Separator />

        {/* Undo / Redo */}
        <div className="p-2 flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo} className="flex-1 h-7 text-[10px]">
                <Undo2 className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Deshacer (Ctrl+Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onRedo} disabled={!canRedo} className="flex-1 h-7 text-[10px]">
                <Redo2 className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rehacer (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>

        {/* Transform Controls (legacy rotate/scale for non-gizmo mode) */}
        {selectedId && (
          <>
            <Separator />
            <div className="p-2 space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
                Objeto seleccionado
              </p>
              <div className="grid grid-cols-2 gap-1">
                <Button variant="outline" size="sm" onClick={() => onRotate(-Math.PI / 8)} className="h-7 text-[10px]">
                  <RotateCcw className="h-3 w-3 mr-0.5" />◀
                </Button>
                <Button variant="outline" size="sm" onClick={() => onRotate(Math.PI / 8)} className="h-7 text-[10px]">
                  <RotateCw className="h-3 w-3 mr-0.5" />▶
                </Button>
                <Button variant="outline" size="sm" onClick={() => onScale(0.15)} className="h-7 text-[10px]">
                  <ZoomIn className="h-3 w-3 mr-0.5" />+
                </Button>
                <Button variant="outline" size="sm" onClick={() => onScale(-0.15)} className="h-7 text-[10px]">
                  <ZoomOut className="h-3 w-3 mr-0.5" />–
                </Button>
              </div>
              <Button variant="destructive" size="sm" onClick={onRemoveSelected} className="w-full h-7 text-[10px]">
                <Trash2 className="h-3 w-3 mr-1" />Eliminar
              </Button>
            </div>
          </>
        )}

        <Separator />

        {/* Actions */}
        <div className="p-2 space-y-1">
          <Button variant="outline" size="sm" onClick={onCapture} className="w-full h-7 text-[10px]">
            <Camera className="h-3 w-3 mr-1" /> Captura PNG
          </Button>
          {onExportPdf && (
            <Button variant="outline" size="sm" onClick={onExportPdf} className="w-full h-7 text-[10px]">
              <FileDown className="h-3 w-3 mr-1" /> Exportar PDF
            </Button>
          )}
          <Button variant="default" size="sm" onClick={onSave} className="w-full h-7 text-[10px]">
            <Save className="h-3 w-3 mr-1" /> Guardar
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset} className="w-full h-7 text-[10px] text-muted-foreground">
            <RefreshCw className="h-3 w-3 mr-1" /> Reset
          </Button>
        </div>
      </Card>
    </TooltipProvider>
  );
};
