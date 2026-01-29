import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Settings2, 
  Layers, 
  Sun, 
  Eye,
  Mountain,
  Building2,
  Trees,
  Waves,
  AlertTriangle,
  Route
} from 'lucide-react';

export interface MapSettings {
  terrain3D: boolean;
  buildings3D: boolean;
  vegetation: boolean;
  water: boolean;
  roads: boolean;
  riskZones: boolean;
  terrainExaggeration: number;
  sunPosition: number;
  pitch: number;
}

interface EnhancedMapControlsProps {
  settings: MapSettings;
  onSettingsChange: (settings: Partial<MapSettings>) => void;
  onResetSettings: () => void;
}

const EnhancedMapControls = ({
  settings,
  onSettingsChange,
  onResetSettings,
}: EnhancedMapControlsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const layerItems = [
    { key: 'terrain3D' as const, label: 'Terreno 3D', icon: Mountain },
    { key: 'buildings3D' as const, label: 'Edificios 3D', icon: Building2 },
    { key: 'vegetation' as const, label: 'Vegetación', icon: Trees },
    { key: 'water' as const, label: 'Cuerpos de agua', icon: Waves },
    { key: 'roads' as const, label: 'Caminos', icon: Route },
    { key: 'riskZones' as const, label: 'Zonas de riesgo', icon: AlertTriangle },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">Configuración del mapa</TooltipContent>
      </Tooltip>

      <PopoverContent 
        side="right" 
        align="start" 
        className="w-72 p-4 bg-background/95 backdrop-blur-md border border-white/10"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Configuración del Mapa
            </h4>
            <Button variant="ghost" size="sm" onClick={onResetSettings} className="h-7 text-xs">
              Restablecer
            </Button>
          </div>

          {/* Layers */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Capas
            </Label>
            <div className="space-y-2">
              {layerItems.map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{label}</span>
                  </div>
                  <Switch
                    checked={settings[key]}
                    onCheckedChange={(checked) => onSettingsChange({ [key]: checked })}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Terrain Controls */}
          {settings.terrain3D && (
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Terreno
              </Label>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Mountain className="h-3 w-3" />
                      Exageración
                    </span>
                    <span className="text-muted-foreground">{settings.terrainExaggeration.toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={[settings.terrainExaggeration]}
                    min={0.5}
                    max={3}
                    step={0.1}
                    onValueChange={([value]) => onSettingsChange({ terrainExaggeration: value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Eye className="h-3 w-3" />
                      Inclinación
                    </span>
                    <span className="text-muted-foreground">{settings.pitch}°</span>
                  </div>
                  <Slider
                    value={[settings.pitch]}
                    min={0}
                    max={85}
                    step={5}
                    onValueChange={([value]) => onSettingsChange({ pitch: value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sun Position */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Iluminación
            </Label>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Sun className="h-3 w-3" />
                  Hora del día
                </span>
                <span className="text-muted-foreground">{settings.sunPosition}:00</span>
              </div>
              <Slider
                value={[settings.sunPosition]}
                min={6}
                max={18}
                step={1}
                onValueChange={([value]) => onSettingsChange({ sunPosition: value })}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>🌅 Amanecer</span>
                <span>🌞 Mediodía</span>
                <span>🌇 Atardecer</span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EnhancedMapControls;
