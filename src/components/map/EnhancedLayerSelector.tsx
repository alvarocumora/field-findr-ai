import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Layers,
  Building2,
  Droplets,
  Leaf,
  Mountain,
  AlertTriangle,
  Zap,
  FileText,
  Search,
  Lock,
  Check,
  ExternalLink,
  Route,
  Waves,
  TreePine,
  Flame,
} from 'lucide-react';
import { 
  ENHANCED_GIS_LAYERS, 
  GISLayerConfig 
} from '@/services/landDataService';
import { cn } from '@/lib/utils';

interface EnhancedLayerSelectorProps {
  activeLayers: string[];
  onLayerToggle: (layerId: string, enabled: boolean) => void;
  isPremium?: boolean;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  zoning: Building2,
  water: Droplets,
  environment: Leaf,
  mining: Mountain,
  risk: AlertTriangle,
  infrastructure: Zap,
  cadastral: FileText,
};

const categoryLabels: Record<string, string> = {
  zoning: 'Zonificación',
  water: 'Recursos Hídricos',
  environment: 'Medio Ambiente',
  mining: 'Minería',
  risk: 'Riesgos Naturales',
  infrastructure: 'Infraestructura',
  cadastral: 'Catastro',
};

const categoryDescriptions: Record<string, string> = {
  zoning: 'Uso de suelo, límites urbanos, coeficientes',
  water: 'Derechos de agua, acuíferos, cuencas',
  environment: 'Áreas protegidas, humedales, bosque nativo',
  mining: 'Concesiones, faenas, pasivos ambientales',
  risk: 'Inundación, deslizamiento, tsunami, volcánico',
  infrastructure: 'Red vial, servicios básicos',
  cadastral: 'Propiedades, avalúo fiscal',
};

const EnhancedLayerSelector = ({ 
  activeLayers, 
  onLayerToggle,
  isPremium = false,
}: EnhancedLayerSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['zoning', 'water', 'risk']);

  const activeLayersCount = activeLayers.length;

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const categories = ['zoning', 'water', 'environment', 'mining', 'risk', 'infrastructure', 'cadastral'];

  const filteredLayers = ENHANCED_GIS_LAYERS.filter(layer =>
    layer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    layer.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLayersByCategory = (category: string) => 
    filteredLayers.filter(layer => layer.category === category);

  const getLayerIcon = (layer: GISLayerConfig) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      'urban-limits': Building2,
      'land-use': Building2,
      'water-rights': Droplets,
      'aquifers': Waves,
      'scarcity-zones': AlertTriangle,
      'rivers-basins': Droplets,
      'protected-areas': TreePine,
      'wetlands': Leaf,
      'native-forest': TreePine,
      'mining-concessions': Mountain,
      'flood-zones': Waves,
      'landslide-zones': Mountain,
      'tsunami-zones': Waves,
      'volcanic-zones': Mountain,
      'fire-risk': Flame,
      'road-network': Route,
      'utilities': Zap,
      'cadastral-parcels': FileText,
      'fiscal-appraisal': FileText,
    };
    return iconMap[layer.id] || categoryIcons[layer.category];
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 relative"
            >
              <Layers className="h-5 w-5" />
              {activeLayersCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary"
                >
                  {activeLayersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Capas GIS</TooltipContent>
      </Tooltip>

      <SheetContent side="right" className="w-96 sm:w-[480px] p-0">
        <SheetHeader className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle>Capas de Datos GIS</SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Datos oficiales de Chile
                </p>
              </div>
            </div>
            <Badge variant="outline">
              {activeLayersCount} activas
            </Badge>
          </div>
        </SheetHeader>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar capas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-4 space-y-4">
            {categories.map(category => {
              const categoryLayers = getLayersByCategory(category);
              if (categoryLayers.length === 0) return null;

              const CategoryIcon = categoryIcons[category];
              const isExpanded = expandedCategories.includes(category);
              const activeCategoryLayers = categoryLayers.filter(l => activeLayers.includes(l.id));

              return (
                <div key={category} className="space-y-2">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10"
                      >
                        <CategoryIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium text-sm">{categoryLabels[category]}</span>
                        <p className="text-xs text-muted-foreground">
                          {categoryDescriptions[category]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeCategoryLayers.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {activeCategoryLayers.length}
                        </Badge>
                      )}
                      <svg
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Category Layers */}
                  {isExpanded && (
                    <div className="pl-2 space-y-1">
                      {categoryLayers.map(layer => {
                        const LayerIcon = getLayerIcon(layer);
                        const isActive = activeLayers.includes(layer.id);
                        const isLocked = layer.premium && !isPremium;

                        return (
                          <div
                            key={layer.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-lg transition-colors",
                              isActive ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50",
                              isLocked && "opacity-60"
                            )}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div 
                                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 bg-primary/10"
                              >
                                <LayerIcon className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium truncate">{layer.name}</span>
                                  {layer.premium && (
                                    <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-muted-foreground truncate">
                                    {layer.description}
                                  </span>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <a 
                                        href={layer.sourceUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-primary"
                                        onClick={e => e.stopPropagation()}
                                      >
                                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                      </a>
                                    </TooltipTrigger>
                                    <TooltipContent>Fuente: {layer.source}</TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                            
                            {isLocked ? (
                              <Badge variant="outline" className="text-xs ml-2">
                                Premium
                              </Badge>
                            ) : (
                              <Switch
                                checked={isActive}
                                onCheckedChange={(checked) => onLayerToggle(layer.id, checked)}
                                className="ml-2"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Premium Upsell */}
            {!isPremium && (
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Desbloquea todas las capas</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Accede a datos premium: coeficientes de edificación, servicios básicos, catastro y avalúo fiscal.
                </p>
                <Button size="sm" className="w-full">
                  Actualizar a Premium
                </Button>
              </div>
            )}

            {/* Data Sources */}
            <div className="pt-4 border-t border-white/10">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Fuentes de Datos
              </Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {['MINVU', 'DGA', 'MMA', 'CONAF', 'SERNAGEOMIN', 'MOP', 'SHOA', 'SII'].map(source => (
                  <Badge key={source} variant="outline" className="text-[10px]">
                    {source}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default EnhancedLayerSelector;
