import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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
  Layers,
  Building2,
  TrendingUp,
  Zap,
  TreePine,
  AlertTriangle,
  Route,
  Waves,
  Database,
  Globe,
  Info,
  Droplets,
  Mountain,
  Leaf,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface InfoLayerState {
  zoning: boolean;
  heatmap: boolean;
  infrastructure: boolean;
  riskZones: boolean;
  waterBodies: boolean;
  greenAreas: boolean;
  roads: boolean;
  // New layers
  hydrology: boolean;
  mining: boolean;
  biodiversity: boolean;
  isochrone: boolean;
}

export interface InfoLayerConfig {
  opacity: number;
  heatmapIntensity: number;
  useRealData: boolean;
}

interface MapInfoLayersProps {
  layers: InfoLayerState;
  config: InfoLayerConfig;
  onLayerChange: (layer: keyof InfoLayerState, value: boolean) => void;
  onConfigChange: (config: Partial<InfoLayerConfig>) => void;
}

const MapInfoLayers = ({
  layers,
  config,
  onLayerChange,
  onConfigChange,
}: MapInfoLayersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const layerGroups = [
    {
      title: 'Análisis de Inversión',
      layers: [
        { 
          key: 'heatmap' as const, 
          label: 'Heatmap Precio/m²', 
          icon: TrendingUp, 
          description: 'Mapa de calor con precio real por m² de la plataforma',
          color: '#10b981'
        },
        { 
          key: 'isochrone' as const, 
          label: 'Isócronas de Conectividad', 
          icon: Route, 
          description: 'Click en propiedad → muestra 5/10/15 min en auto',
          color: '#6366f1'
        },
        { 
          key: 'zoning' as const, 
          label: 'Zonificación Urbana', 
          icon: Building2, 
          description: 'Uso de suelo permitido',
          color: '#8b5cf6'
        },
      ],
    },
    {
      title: 'Infraestructura',
      layers: [
        { 
          key: 'infrastructure' as const, 
          label: 'Servicios Básicos', 
          icon: Zap, 
          description: 'Agua, luz, alcantarillado',
          color: '#f59e0b'
        },
        { 
          key: 'roads' as const, 
          label: 'Red Vial', 
          icon: Route, 
          description: 'Carreteras y caminos',
          color: '#64748b'
        },
      ],
    },
    {
      title: 'Riesgos y Medio Ambiente',
      layers: [
        { 
          key: 'riskZones' as const, 
          label: 'Zonas de Riesgo', 
          icon: AlertTriangle, 
          description: 'Inundaciones, deslizamientos',
          color: '#ef4444'
        },
        { 
          key: 'waterBodies' as const, 
          label: 'Cuerpos de Agua', 
          icon: Waves, 
          description: 'Ríos, lagos, humedales',
          color: '#0ea5e9'
        },
        { 
          key: 'greenAreas' as const, 
          label: 'Áreas Verdes', 
          icon: TreePine, 
          description: 'Parques, reservas naturales',
          color: '#22c55e'
        },
      ],
    },
    {
      title: 'Hidrografía (DGA)',
      layers: [
        { 
          key: 'hydrology' as const, 
          label: 'Red Hidrográfica', 
          icon: Droplets, 
          description: 'Ríos, cuencas, acuíferos, derechos de agua',
          color: '#06b6d4'
        },
      ],
    },
    {
      title: 'Minería (SERNAGEOMIN)',
      layers: [
        { 
          key: 'mining' as const, 
          label: 'Catastro Minero', 
          icon: Mountain, 
          description: 'Concesiones, faenas, pasivos ambientales',
          color: '#a855f7'
        },
      ],
    },
    {
      title: 'Biodiversidad (MMA)',
      layers: [
        { 
          key: 'biodiversity' as const, 
          label: 'Ecosistemas y Especies', 
          icon: Leaf, 
          description: 'Ecosistemas, especies amenazadas, corredores',
          color: '#84cc16'
        },
      ],
    },
  ];

  const activeLayersCount = Object.values(layers).filter(Boolean).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 relative"
            >
              <Layers className="h-4 w-4" />
              {activeLayersCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary"
                >
                  {activeLayersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">Capas de información</TooltipContent>
      </Tooltip>

      <PopoverContent 
        side="right" 
        align="start" 
        className="w-80 p-4 bg-background/95 backdrop-blur-md border border-white/10"
      >
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Capas de Información
            </h4>
            <Badge variant="outline" className="text-xs">
              {activeLayersCount} activas
            </Badge>
          </div>

          {/* Layer Groups */}
          {layerGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                {group.title}
              </Label>
              <div className="space-y-2">
                {group.layers.map(({ key, label, icon: Icon, description, color }) => (
                  <div 
                    key={key} 
                    className={`
                      flex items-center justify-between p-2 rounded-lg transition-colors
                      ${layers[key] ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'}
                    `}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div 
                        className="w-6 h-6 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color }} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{label}</span>
                        <span className="text-[10px] text-muted-foreground">{description}</span>
                      </div>
                    </div>
                    <Switch
                      checked={layers[key]}
                      onCheckedChange={(checked) => onLayerChange(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Configuration */}
          {activeLayersCount > 0 && (
            <div className="space-y-3 pt-3 border-t border-white/10">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Configuración
              </Label>
              
              {/* Real Data Toggle */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center bg-primary/20">
                    {config.useRealData ? (
                      <Globe className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Database className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {config.useRealData ? 'Datos Reales' : 'Datos Demo'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {config.useRealData ? 'IDE Chile / MINVU' : 'Datos de demostración'}
                    </span>
                  </div>
                </div>
                <Switch
                  checked={config.useRealData}
                  onCheckedChange={(checked) => onConfigChange({ useRealData: checked })}
                />
              </div>

              {config.useRealData && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-info/10 border border-info/20">
                  <Info className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-muted-foreground">
                    Los datos se obtienen de servicios WMS oficiales de IDE Chile, MINVU, SERNAGEOMIN y otros organismos públicos.
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Opacidad</span>
                  <span className="text-muted-foreground">{Math.round(config.opacity * 100)}%</span>
                </div>
                <Slider
                  value={[config.opacity]}
                  min={0.1}
                  max={1}
                  step={0.1}
                  onValueChange={([value]) => onConfigChange({ opacity: value })}
                />
              </div>

              {layers.heatmap && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Intensidad Heatmap</span>
                    <span className="text-muted-foreground">{Math.round(config.heatmapIntensity * 100)}%</span>
                  </div>
                  <Slider
                    value={[config.heatmapIntensity]}
                    min={0.1}
                    max={1}
                    step={0.1}
                    onValueChange={([value]) => onConfigChange({ heatmapIntensity: value })}
                  />
                </div>
              )}
            </div>
          )}

          {/* Heatmap Legend */}
          {layers.heatmap && (
            <div className="space-y-2 pt-3 border-t border-white/10">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Leyenda Precio/m²
              </Label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground">Bajo</span>
                <div className="flex-1 h-3 rounded-full" style={{
                  background: 'linear-gradient(to right, rgba(0,0,255,0.6), rgb(0,255,255), rgb(0,255,0), rgb(255,255,0), rgb(255,165,0), rgb(255,0,0))'
                }} />
                <span className="text-[10px] text-muted-foreground">Alto</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Basado en datos reales de propiedades publicadas
              </p>
            </div>
          )}

          {/* Isochrone Legend */}
          {layers.isochrone && (
            <div className="space-y-2 pt-3 border-t border-white/10">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Isócronas de Conectividad
              </Label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: '5 min', color: '#10b981' },
                  { label: '10 min', color: '#f59e0b' },
                  { label: '15 min', color: '#ef4444' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 rounded-sm border border-white/20"
                      style={{ backgroundColor: item.color, opacity: 0.5 }}
                    />
                    <span className="text-[10px] text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Haz click en una propiedad para ver sus isócronas
              </p>
            </div>
          )}

          {/* Legend */}
          {layers.zoning && (
            <div className="space-y-2 pt-3 border-t border-white/10">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Leyenda Zonificación
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Residencial', color: '#22c55e' },
                  { label: 'Comercial', color: '#3b82f6' },
                  { label: 'Industrial', color: '#f59e0b' },
                  { label: 'Agrícola', color: '#84cc16' },
                  { label: 'Mixto', color: '#8b5cf6' },
                  { label: 'Protegido', color: '#ef4444' },
                ].map((zone) => (
                  <div key={zone.label} className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 rounded-sm border border-white/20"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span className="text-[10px] text-muted-foreground">{zone.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {layers.riskZones && (
            <div className="space-y-2 pt-3 border-t border-white/10">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Leyenda Riesgos
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Inundación', color: '#0ea5e9' },
                  { label: 'Deslizamiento', color: '#f59e0b' },
                  { label: 'Sísmico', color: '#ef4444' },
                  { label: 'Tsunami', color: '#6366f1' },
                ].map((risk) => (
                  <div key={risk.label} className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 rounded-sm border border-white/20"
                      style={{ backgroundColor: risk.color, opacity: 0.6 }}
                    />
                    <span className="text-[10px] text-muted-foreground">{risk.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {layers.hydrology && (
            <div className="space-y-2 pt-3 border-t border-white/10">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Leyenda Hidrografía
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Ríos', color: '#0ea5e9' },
                  { label: 'Lagos', color: '#0284c7' },
                  { label: 'Cuencas', color: '#06b6d4' },
                  { label: 'Acuíferos', color: '#22d3ee' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 rounded-sm border border-white/20"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[10px] text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {layers.mining && (
            <div className="space-y-2 pt-3 border-t border-white/10">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Leyenda Minería
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Exploración', color: '#fbbf24' },
                  { label: 'Explotación', color: '#a855f7' },
                  { label: 'Faena activa', color: '#22c55e' },
                  { label: 'Pasivo amb.', color: '#ef4444' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 rounded-sm border border-white/20"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[10px] text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {layers.biodiversity && (
            <div className="space-y-2 pt-3 border-t border-white/10">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Leyenda Biodiversidad
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Ecosistema', color: '#22c55e' },
                  { label: 'Esp. amenazada', color: '#ef4444' },
                  { label: 'Corredor', color: '#84cc16' },
                  { label: 'Humedal', color: '#0ea5e9' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 rounded-sm border border-white/20"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[10px] text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MapInfoLayers;
