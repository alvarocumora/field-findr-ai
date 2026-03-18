import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  RotateCcw, RotateCw, ZoomIn, ZoomOut, Trash2, Camera, Save, RefreshCw, Ruler, ChevronDown, ChevronRight
} from 'lucide-react';
import { OBJECT_CATALOG, CATEGORY_LABELS, type ParcelaObjectType, type CatalogCategory } from './useParcelaState';

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
  const [expandedCategories, setExpandedCategories] = useState<Set<CatalogCategory>>(new Set(['vivienda']));

  const toggleCategory = (cat: CatalogCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Group catalog items by category
  const groupedItems = Object.entries(OBJECT_CATALOG).reduce((acc, [type, item]) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push({ type: type as ParcelaObjectType, ...item });
    return acc;
  }, {} as Record<CatalogCategory, (typeof OBJECT_CATALOG[ParcelaObjectType] & { type: ParcelaObjectType })[]>);

  const categoryOrder: CatalogCategory[] = ['vivienda', 'agua', 'cercos', 'vegetacion', 'outdoor', 'infraestructura', 'recreacion'];

  return (
    <Card className="w-56 flex flex-col h-full border-border/40 rounded-none sm:rounded-l-xl overflow-hidden">
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

      {/* Transform Controls */}
      <div className="p-2 space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
          Controles
        </p>
        <div className="grid grid-cols-2 gap-1">
          <Button variant="outline" size="sm" onClick={() => onRotate(-Math.PI / 8)} disabled={!selectedId} className="h-7 text-[10px]">
            <RotateCcw className="h-3 w-3 mr-0.5" />◀
          </Button>
          <Button variant="outline" size="sm" onClick={() => onRotate(Math.PI / 8)} disabled={!selectedId} className="h-7 text-[10px]">
            <RotateCw className="h-3 w-3 mr-0.5" />▶
          </Button>
          <Button variant="outline" size="sm" onClick={() => onScale(0.15)} disabled={!selectedId} className="h-7 text-[10px]">
            <ZoomIn className="h-3 w-3 mr-0.5" />+
          </Button>
          <Button variant="outline" size="sm" onClick={() => onScale(-0.15)} disabled={!selectedId} className="h-7 text-[10px]">
            <ZoomOut className="h-3 w-3 mr-0.5" />–
          </Button>
        </div>
        <Button variant="destructive" size="sm" onClick={onRemoveSelected} disabled={!selectedId} className="w-full h-7 text-[10px]">
          <Trash2 className="h-3 w-3 mr-1" />Eliminar
        </Button>
      </div>

      <Separator />

      {/* Actions */}
      <div className="p-2 space-y-1">
        <Button variant="outline" size="sm" onClick={onCapture} className="w-full h-7 text-[10px]">
          <Camera className="h-3 w-3 mr-1" /> Captura
        </Button>
        <Button variant="default" size="sm" onClick={onSave} className="w-full h-7 text-[10px]">
          <Save className="h-3 w-3 mr-1" /> Guardar
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset} className="w-full h-7 text-[10px] text-muted-foreground">
          <RefreshCw className="h-3 w-3 mr-1" /> Reset
        </Button>
      </div>

      {selectedId && (
        <div className="p-2 border-t border-border/40">
          <Badge variant="secondary" className="text-[10px]">Seleccionado</Badge>
        </div>
      )}
    </Card>
  );
};
