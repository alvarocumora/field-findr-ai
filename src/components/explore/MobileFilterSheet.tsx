import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, MapPin, Check } from 'lucide-react';
import { formatPrice } from '@/hooks/useListings';
import { cn } from '@/lib/utils';

const PROPERTY_TYPES = [
  { value: 'parcela_rural', label: 'Parcela Rural', icon: '🌾' },
  { value: 'sitio_industrial', label: 'Sitio Industrial', icon: '🏭' },
  { value: 'campo_agricola', label: 'Campo Agrícola', icon: '🚜' },
  { value: 'terreno_urbano', label: 'Terreno Urbano', icon: '🏙️' },
  { value: 'terreno_costero', label: 'Terreno Costero', icon: '🏖️' },
  { value: 'terreno_montana', label: 'Terreno de Montaña', icon: '⛰️' },
  { value: 'inversion', label: 'Inversión', icon: '📈' },
];

const REGIONS = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', "O'Higgins", 'Maule', 'Ñuble', 'Biobío',
  'Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
];

const TAGS = [
  { value: 'agua', label: 'Agua', icon: '💧' },
  { value: 'luz', label: 'Luz', icon: '⚡' },
  { value: 'camino', label: 'Camino', icon: '🛤️' },
  { value: 'riego', label: 'Riego', icon: '🌊' },
  { value: 'bosque', label: 'Bosque', icon: '🌲' },
  { value: 'lago', label: 'Lago', icon: '🏞️' },
  { value: 'playa', label: 'Playa', icon: '🏝️' },
];

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTypes: string[];
  selectedRegions: string[];
  selectedTags: string[];
  priceRange: [number, number];
  areaRange: [number, number];
  onToggleType: (type: string) => void;
  onToggleRegion: (region: string) => void;
  onToggleTag: (tag: string) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onAreaRangeChange: (range: [number, number]) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
  resultsCount: number;
}

const MobileFilterSheet = ({
  isOpen,
  onClose,
  selectedTypes,
  selectedRegions,
  selectedTags,
  priceRange,
  areaRange,
  onToggleType,
  onToggleRegion,
  onToggleTag,
  onPriceRangeChange,
  onAreaRangeChange,
  onClearFilters,
  activeFiltersCount,
  resultsCount,
}: MobileFilterSheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-[20px] p-0 border-t border-border/40"
      >
        {/* Header */}
        <SheetHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/30 px-4 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Filtros</SheetTitle>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar ({activeFiltersCount})
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Scrollable content */}
        <ScrollArea className="h-[calc(85vh-140px)]">
          <div className="px-4 py-6 space-y-8">
            {/* Property Types */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                Tipo de Terreno
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {PROPERTY_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => onToggleType(type.value)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl transition-all text-left",
                      "border min-h-[52px]",
                      selectedTypes.includes(type.value)
                        ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20"
                        : "bg-muted/30 border-transparent hover:bg-muted/50"
                    )}
                  >
                    <span className="text-lg">{type.icon}</span>
                    <span className={cn(
                      "text-sm leading-tight",
                      selectedTypes.includes(type.value) 
                        ? "text-foreground font-medium" 
                        : "text-muted-foreground"
                    )}>
                      {type.label}
                    </span>
                    {selectedTypes.includes(type.value) && (
                      <Check className="h-4 w-4 text-primary ml-auto shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Regions */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent"></span>
                Región
              </h4>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map(region => (
                  <Badge
                    key={region}
                    variant={selectedRegions.includes(region) ? 'default' : 'outline'}
                    onClick={() => onToggleRegion(region)}
                    className={cn(
                      "cursor-pointer transition-all text-sm py-2 px-3 h-auto",
                      selectedRegions.includes(region)
                        ? "bg-accent text-accent-foreground hover:bg-accent/90"
                        : "hover:bg-muted border-border/50"
                    )}
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    {region}
                  </Badge>
                ))}
              </div>
            </section>

            {/* Price Range */}
            <section className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                Precio (CLP)
              </h4>
              <div className="px-2 pt-2">
                <Slider
                  value={[Math.log10(priceRange[0] + 1), Math.log10(priceRange[1])]}
                  min={0}
                  max={10}
                  step={0.1}
                  onValueChange={([min, max]) => {
                    onPriceRangeChange([
                      Math.round(Math.pow(10, min) - 1),
                      Math.round(Math.pow(10, max))
                    ]);
                  }}
                  className="py-4"
                />
                <div className="flex justify-between mt-2">
                  <div className="px-3 py-2 rounded-lg bg-muted/50 text-xs font-medium text-foreground">
                    {formatPrice(priceRange[0])}
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-muted/50 text-xs font-medium text-foreground">
                    {formatPrice(priceRange[1])}
                  </div>
                </div>
              </div>
            </section>

            {/* Area Range */}
            <section className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                Superficie (m²)
              </h4>
              <div className="px-2 pt-2">
                <Slider
                  value={[Math.log10(areaRange[0] + 1), Math.log10(areaRange[1])]}
                  min={0}
                  max={6}
                  step={0.1}
                  onValueChange={([min, max]) => {
                    onAreaRangeChange([
                      Math.round(Math.pow(10, min) - 1),
                      Math.round(Math.pow(10, max))
                    ]);
                  }}
                  className="py-4"
                />
                <div className="flex justify-between mt-2">
                  <div className="px-3 py-2 rounded-lg bg-muted/50 text-xs font-medium text-foreground">
                    {areaRange[0].toLocaleString()} m²
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-muted/50 text-xs font-medium text-foreground">
                    {areaRange[1].toLocaleString()} m²
                  </div>
                </div>
              </div>
            </section>

            {/* Tags / Características */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500"></span>
                Características
              </h4>
              <div className="flex flex-wrap gap-2">
                {TAGS.map(tag => (
                  <Badge
                    key={tag.value}
                    variant={selectedTags.includes(tag.value) ? 'default' : 'outline'}
                    onClick={() => onToggleTag(tag.value)}
                    className={cn(
                      "cursor-pointer transition-all text-sm py-2 px-3 h-auto",
                      selectedTags.includes(tag.value)
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-muted border-border/50"
                    )}
                  >
                    <span className="mr-1">{tag.icon}</span>
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>

        {/* Footer with apply button */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-xl border-t border-border/30 px-4 py-4 safe-area-inset-bottom">
          <Button 
            onClick={onClose}
            className="w-full h-12 rounded-xl text-base font-medium"
          >
            Ver {resultsCount} resultados
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileFilterSheet;
