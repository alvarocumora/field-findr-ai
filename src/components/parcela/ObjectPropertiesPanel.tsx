import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Trash2, RotateCcw, Crosshair, Copy, Lock, Unlock, ArrowDown, Eye, EyeOff } from 'lucide-react';
import type { PlacedObject } from './useParcelaState';
import { OBJECT_CATALOG } from './useParcelaState';

interface ObjectPropertiesPanelProps {
  obj: PlacedObject;
  onUpdate: (id: string, updates: Partial<PlacedObject>) => void;
  onRemove: (id: string) => void;
  onCenterInLot: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onSnapToGround?: (id: string) => void;
  docked?: boolean;
}

export const ObjectPropertiesPanel = ({ obj, onUpdate, onRemove, onCenterInLot, onDuplicate, onSnapToGround, docked = false }: ObjectPropertiesPanelProps) => {
  const catalog = obj.type !== 'glb_custom' ? OBJECT_CATALOG[obj.type] : null;
  const label = catalog?.label || obj.modelName || 'Modelo GLB';
  const icon = catalog?.icon || '📦';

  const rotDeg = Math.round((obj.rotation * 180) / Math.PI);

  return (
    <div className={docked
      ? 'bg-background/70 p-4 w-full space-y-3'
      : 'absolute top-14 right-3 z-20 bg-background/95 backdrop-blur-sm rounded-xl border border-border/40 p-3 w-56 space-y-2.5 shadow-xl'
    }>
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

      {/* V2 scene state */}
      <div className="grid grid-cols-2 gap-1">
        <Button
          variant={obj.visible === false ? 'outline' : 'secondary'}
          size="sm"
          className="h-7 text-[9px]"
          onClick={() => onUpdate(obj.id, { visible: obj.visible === false })}
        >
          {obj.visible === false ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
          {obj.visible === false ? 'Oculto' : 'Visible'}
        </Button>
        <Button
          variant={obj.locked ? 'secondary' : 'outline'}
          size="sm"
          className="h-7 text-[9px]"
          onClick={() => onUpdate(obj.id, { locked: !obj.locked })}
        >
          {obj.locked ? <Lock className="mr-1 h-3 w-3" /> : <Unlock className="mr-1 h-3 w-3" />}
          {obj.locked ? 'Bloqueado' : 'Libre'}
        </Button>
      </div>

      {obj.points?.length ? (
        <div className="space-y-2 rounded-lg border border-border/40 bg-muted/20 p-2">
          <div className="flex items-center justify-between">
            <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Trazado</Label>
            <span className="text-[9px] text-muted-foreground">{obj.points.length} puntos</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[9px] text-muted-foreground">Ancho</Label>
              <span className="text-[9px] text-muted-foreground">{(obj.width ?? 1).toFixed(1)} m</span>
            </div>
            <Slider
              value={[obj.width ?? 1]}
              min={obj.type === 'cerco_trazado' ? 0.08 : 0.5}
              max={obj.type === 'camino_trazado' ? 10 : obj.type === 'sendero_trazado' ? 4 : 0.4}
              step={obj.type === 'cerco_trazado' ? 0.02 : 0.25}
              disabled={obj.locked}
              onValueChange={([v]) => onUpdate(obj.id, { width: v })}
            />
          </div>
        </div>
      ) : (
      <>
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

      </>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-1">
        <Button variant="outline" size="sm" className="h-6 text-[9px]" disabled={obj.locked || Boolean(obj.points?.length)} onClick={() => onUpdate(obj.id, { rotation: 0 })}>
          <RotateCcw className="h-2.5 w-2.5 mr-0.5" /> Reset
        </Button>
        <Button variant="outline" size="sm" className="h-6 text-[9px]" disabled={obj.locked || Boolean(obj.points?.length)} onClick={() => onCenterInLot(obj.id)}>
          <Crosshair className="h-2.5 w-2.5 mr-0.5" /> Centrar
        </Button>
        {onDuplicate && (
          <Button variant="outline" size="sm" className="h-6 text-[9px]" onClick={() => onDuplicate(obj.id)}>
            <Copy className="h-2.5 w-2.5 mr-0.5" /> Duplicar
          </Button>
        )}
        {onSnapToGround && (
          <Button variant="outline" size="sm" className="h-6 text-[9px]" disabled={obj.locked || Boolean(obj.points?.length)} onClick={() => onSnapToGround(obj.id)}>
            <ArrowDown className="h-2.5 w-2.5 mr-0.5" /> Al suelo
          </Button>
        )}
      </div>
    </div>
  );
};
