import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, PenTool, Trash2, Maximize2, Compass, RotateCcw } from 'lucide-react';
import type { InfoLayerState, InfoLayerConfig } from './MapInfoLayers';

interface MapToolsDrawerProps {
  open: boolean;
  onClose: () => void;
  infoLayers: InfoLayerState;
  layerConfig: InfoLayerConfig;
  onLayerChange: (layer: keyof InfoLayerState, value: boolean) => void;
  onConfigChange: (config: Partial<InfoLayerConfig>) => void;
  showDrawTools: boolean;
  isDrawing: boolean;
  drawnArea: number | null;
  onStartDrawing: () => void;
  onClearDrawing: () => void;
  onFitAll?: () => void;
  onResetNorth?: () => void;
  onResetView?: () => void;
}

const layerItems: { key: keyof InfoLayerState; label: string; desc: string; icon: string }[] = [
  { key: 'heatmap', label: 'Heatmap Precio/m²', desc: 'Densidad de valores', icon: '🔥' },
  { key: 'isochrone', label: 'Isócronas', desc: 'Tiempos de acceso', icon: '⏱️' },
  { key: 'zoning', label: 'Zonificación', desc: 'Uso de suelo', icon: '🏠' },
  { key: 'infrastructure', label: 'Servicios', desc: 'Agua, luz, gas', icon: '⚡' },
  { key: 'roads', label: 'Red Vial', desc: 'Carreteras', icon: '🛣️' },
  { key: 'riskZones', label: 'Riesgos', desc: 'Inundación, sísmica', icon: '⚠️' },
  { key: 'waterBodies', label: 'Agua', desc: 'Ríos, lagos', icon: '💧' },
  { key: 'greenAreas', label: 'Áreas Verdes', desc: 'Parques, reservas', icon: '🌳' },
  { key: 'hydrology', label: 'Hidrografía', desc: 'DGA - Cuencas', icon: '🌊' },
  { key: 'mining', label: 'Minería', desc: 'Concesiones', icon: '⛏️' },
  { key: 'biodiversity', label: 'Biodiversidad', desc: 'Ecosistemas', icon: '🦜' },
];

const MapToolsDrawer = ({
  open,
  onClose,
  infoLayers,
  layerConfig,
  onLayerChange,
  onConfigChange,
  showDrawTools,
  isDrawing,
  drawnArea,
  onStartDrawing,
  onClearDrawing,
  onFitAll,
  onResetNorth,
  onResetView,
}: MapToolsDrawerProps) => {
  if (!open) return null;

  const activeCount = Object.values(infoLayers).filter(Boolean).length;

  return (
    <div className="absolute top-0 left-0 bottom-0 z-20 w-72 bg-background/95 backdrop-blur-xl border-r border-border/50 shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div>
          <h3 className="text-sm font-semibold">Capas y Herramientas</h3>
          {activeCount > 0 && (
            <p className="text-[11px] text-muted-foreground">{activeCount} activas</p>
          )}
        </div>
        <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* GIS Layers */}
          <div className="space-y-2">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">
              Capas de Información
            </Label>
            <div className="space-y-1">
              {layerItems.map(({ key, label, desc, icon }) => (
                <button
                  key={key}
                  onClick={() => onLayerChange(key, !infoLayers[key])}
                  className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors ${
                    infoLayers[key]
                      ? 'bg-primary/10 text-foreground'
                      : 'hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <span className="text-base leading-none">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    infoLayers[key] ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {infoLayers[key] && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Layer Settings */}
          {activeCount > 0 && (
            <div className="space-y-3 pt-2 border-t border-border/30">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Configuración
              </Label>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Opacidad</span>
                  <span className="text-muted-foreground">{Math.round(layerConfig.opacity * 100)}%</span>
                </div>
                <Slider
                  value={[layerConfig.opacity]}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onValueChange={([v]) => onConfigChange({ opacity: v })}
                />
              </div>
              {infoLayers.heatmap && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Intensidad Heatmap</span>
                    <span className="text-muted-foreground">{Math.round(layerConfig.heatmapIntensity * 100)}%</span>
                  </div>
                  <Slider
                    value={[layerConfig.heatmapIntensity]}
                    min={0.1}
                    max={1.5}
                    step={0.05}
                    onValueChange={([v]) => onConfigChange({ heatmapIntensity: v })}
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">Datos Reales</p>
                  <p className="text-[10px] text-muted-foreground">IDE Chile / MINVU</p>
                </div>
                <Switch
                  checked={layerConfig.useRealData}
                  onCheckedChange={(v) => onConfigChange({ useRealData: v })}
                />
              </div>
            </div>
          )}

          {/* Navigation shortcuts */}
          {(onFitAll || onResetNorth || onResetView) && (
            <div className="space-y-2 pt-2 border-t border-border/30">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Navegación
              </Label>
              <div className="flex flex-wrap gap-2">
                {onFitAll && (
                  <Button size="sm" variant="outline" onClick={onFitAll} className="h-8 text-xs gap-1.5">
                    <Maximize2 className="h-3.5 w-3.5" />
                    Ver todas
                  </Button>
                )}
                {onResetNorth && (
                  <Button size="sm" variant="outline" onClick={onResetNorth} className="h-8 text-xs gap-1.5">
                    <Compass className="h-3.5 w-3.5" />
                    Norte
                  </Button>
                )}
                {onResetView && (
                  <Button size="sm" variant="outline" onClick={onResetView} className="h-8 text-xs gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restablecer
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Drawing Tools */}
          {showDrawTools && (
            <div className="space-y-2 pt-2 border-t border-border/30">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Herramientas de Dibujo
              </Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isDrawing ? 'default' : 'outline'}
                  onClick={onStartDrawing}
                  className="flex-1 h-9 text-xs"
                >
                  <PenTool className="h-3.5 w-3.5 mr-1.5" />
                  Dibujar área
                </Button>
                {drawnArea !== null && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onClearDrawing}
                    className="h-9 text-xs text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              {drawnArea !== null && (
                <p className="text-xs text-primary font-medium">
                  Área: {drawnArea >= 10000
                    ? `${(drawnArea / 10000).toFixed(2)} ha`
                    : `${drawnArea.toFixed(0)} m²`}
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MapToolsDrawer;
