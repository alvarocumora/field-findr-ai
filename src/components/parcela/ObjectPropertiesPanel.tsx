import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Trash2, RotateCcw, Crosshair } from 'lucide-react';
import type { PlacedObject } from './useParcelaState';
import { OBJECT_CATALOG } from './useParcelaState';

interface ObjectPropertiesPanelProps {
  obj: PlacedObject;
  onUpdate: (id: string, updates: Partial<PlacedObject>) => void;
  onRemove: (id: string) => void;
  onCenterInLot: (id: string) => void;
}

export const ObjectPropertiesPanel = ({ obj, onUpdate, onRemove, onCenterInLot }: ObjectPropertiesPanelProps) => {
  const catalog = obj.type !== 'glb_custom' ? OBJECT_CATALOG[obj.type] : null;
  const label = catalog?.label || obj.modelName || 'Modelo GLB';
  const icon = catalog?.icon || '📦';

  const rotDeg = Math.round((obj.rotation * 180) / Math.PI);

  return (
    <div className="absolute top-3 left-3 z-10 bg-background/90 backdrop-blur-sm rounded-lg border border-border/40 p-3 w-52 space-y-2.5 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{icon}</span>
          <span className="text-[11px] font-semibold text-foreground truncate max-w-[120px]">{label}</span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onRemove(obj.id)}>
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>

      {/* Position */}
      <div className="space-y-1">
        <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Posición (m)</Label>
        <div className="grid grid-cols-3 gap-1">
          {(['X', 'Y', 'Z'] as const).map((axis, i) => (
            <div key={axis}>
              <span className="text-[8px] text-muted-foreground">{axis}</span>
              <Input
                type="number"
                value={obj.position[i].toFixed(1)}
                onChange={e => {
                  const val = parseFloat(e.target.value) || 0;
                  const newPos: [number, number, number] = [...obj.position];
                  newPos[i] = val;
                  onUpdate(obj.id, { position: newPos });
                }}
                className="h-6 text-[10px] px-1"
                step={0.5}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Rotación</Label>
          <span className="text-[9px] text-muted-foreground">{rotDeg}°</span>
        </div>
        <Slider
          value={[rotDeg]}
          min={0}
          max={360}
          step={5}
          onValueChange={([v]) => onUpdate(obj.id, { rotation: (v * Math.PI) / 180 })}
        />
      </div>

      {/* Scale */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Escala</Label>
          <span className="text-[9px] text-muted-foreground">{obj.scale.toFixed(2)}x</span>
        </div>
        <Slider
          value={[obj.scale * 100]}
          min={30}
          max={300}
          step={5}
          onValueChange={([v]) => onUpdate(obj.id, { scale: v / 100 })}
        />
      </div>

      {/* Quick actions */}
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-6 text-[9px]"
          onClick={() => onUpdate(obj.id, { rotation: 0 })}
        >
          <RotateCcw className="h-2.5 w-2.5 mr-0.5" /> Reset
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-6 text-[9px]"
          onClick={() => onCenterInLot(obj.id)}
        >
          <Crosshair className="h-2.5 w-2.5 mr-0.5" /> Centrar
        </Button>
      </div>
    </div>
  );
};
