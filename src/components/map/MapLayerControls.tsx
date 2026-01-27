import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Layers,
  Mountain,
  MapPin,
  Building2,
  Droplets,
  Zap,
  TreePine,
  AlertTriangle,
  Sun,
} from 'lucide-react';

export interface MapLayerState {
  terrain3D: boolean;
  satellite: boolean;
  buildings3D: boolean;
  contours: boolean;
  water: boolean;
  vegetation: boolean;
  roads: boolean;
  riskZones: boolean;
}

export interface MapControlState {
  pitch: number;
  bearing: number;
  sunPosition: number; // 0-24 hours
}

interface MapLayerControlsProps {
  layers: MapLayerState;
  controls: MapControlState;
  onLayerChange: (layer: keyof MapLayerState, value: boolean) => void;
  onControlChange: (control: keyof MapControlState, value: number) => void;
  onResetView: () => void;
}

const MapLayerControls = ({
  layers,
  controls,
  onLayerChange,
  onControlChange,
  onResetView,
}: MapLayerControlsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const layerOptions = [
    { key: 'terrain3D', label: 'Terreno 3D', icon: Mountain, description: 'Visualización topográfica' },
    { key: 'satellite', label: 'Satélite', icon: MapPin, description: 'Vista aérea' },
    { key: 'buildings3D', label: 'Edificios 3D', icon: Building2, description: 'Construcciones en 3D' },
    { key: 'contours', label: 'Curvas de nivel', icon: Mountain, description: 'Líneas de elevación' },
    { key: 'water', label: 'Cuerpos de agua', icon: Droplets, description: 'Ríos y lagos' },
    { key: 'vegetation', label: 'Vegetación', icon: TreePine, description: 'Cobertura vegetal' },
    { key: 'roads', label: 'Caminos', icon: Zap, description: 'Red vial' },
    { key: 'riskZones', label: 'Zonas de riesgo', icon: AlertTriangle, description: 'Inundaciones y riesgos' },
  ] as const;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          className="h-9 w-9 shadow-md bg-background/95 backdrop-blur-sm border border-white/10"
        >
          <Layers className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side="right" 
        align="start" 
        className="w-80 glass border-white/10 p-4"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">Capas del Mapa</h4>
            <Button variant="ghost" size="sm" onClick={onResetView} className="text-xs">
              Resetear vista
            </Button>
          </div>

          {/* Layer toggles */}
          <div className="space-y-3">
            {layerOptions.map(({ key, label, icon: Icon, description }) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <Label className="text-sm font-medium cursor-pointer">{label}</Label>
                    <span className="text-xs text-muted-foreground">{description}</span>
                  </div>
                </div>
                <Switch
                  checked={layers[key]}
                  onCheckedChange={(checked) => onLayerChange(key, checked)}
                />
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 pt-4">
            <h4 className="font-semibold text-foreground mb-3">Controles 3D</h4>
            
            {/* Pitch Control */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Inclinación</Label>
                <span className="text-xs text-muted-foreground">{controls.pitch}°</span>
              </div>
              <Slider
                value={[controls.pitch]}
                min={0}
                max={85}
                step={5}
                onValueChange={([value]) => onControlChange('pitch', value)}
              />
            </div>

            {/* Rotation Control */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Rotación</Label>
                <span className="text-xs text-muted-foreground">{controls.bearing}°</span>
              </div>
              <Slider
                value={[controls.bearing]}
                min={0}
                max={360}
                step={15}
                onValueChange={([value]) => onControlChange('bearing', value)}
              />
            </div>

            {/* Sun Position (for shadow simulation) */}
            {layers.terrain3D && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    <Label className="text-sm">Hora del día</Label>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {String(Math.floor(controls.sunPosition)).padStart(2, '0')}:00
                  </span>
                </div>
                <Slider
                  value={[controls.sunPosition]}
                  min={6}
                  max={20}
                  step={1}
                  onValueChange={([value]) => onControlChange('sunPosition', value)}
                />
              </div>
            )}
          </div>

          {/* Quick presets */}
          <div className="border-t border-white/10 pt-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Vistas rápidas</h4>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  onControlChange('pitch', 0);
                  onControlChange('bearing', 0);
                }}
              >
                2D
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  onControlChange('pitch', 45);
                  onControlChange('bearing', -17);
                }}
              >
                Perspectiva
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  onControlChange('pitch', 70);
                  onControlChange('bearing', 0);
                }}
              >
                Inmersivo
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MapLayerControls;
