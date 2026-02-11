import { useState } from 'react';
import { 
  ChevronDown, 
  X, 
  SlidersHorizontal, 
  Sparkles,
  MapPin,
  Tag,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatPrice } from '@/hooks/useListings';
import { cn } from '@/lib/utils';
import { LATAM_COUNTRIES, getCountryByName } from '@/lib/latam';

interface FilterBarProps {
  selectedTypes: string[];
  onToggleType: (type: string) => void;
  selectedRegions: string[];
  onToggleRegion: (region: string) => void;
  selectedCountries: string[];
  onToggleCountry: (country: string) => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  areaRange: [number, number];
  onAreaRangeChange: (range: [number, number]) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
  showAISearch?: boolean;
  onToggleAISearch?: () => void;
  className?: string;
}

const PROPERTY_TYPES = [
  { value: 'parcela_rural', label: 'Parcela Rural' },
  { value: 'sitio_industrial', label: 'Industrial' },
  { value: 'campo_agricola', label: 'Agrícola' },
  { value: 'terreno_urbano', label: 'Urbano' },
  { value: 'terreno_costero', label: 'Costero' },
  { value: 'terreno_montana', label: 'Montaña' },
  { value: 'inversion', label: 'Inversión' },
];

const REGIONS = [
  'Metropolitana', 'Valparaíso', 'Biobío', 'Araucanía', 
  'Coquimbo', 'Maule', "O'Higgins", 'Los Lagos'
];

const TAGS = [
  { value: 'agua', label: 'Agua' },
  { value: 'luz', label: 'Luz' },
  { value: 'camino', label: 'Camino' },
  { value: 'riego', label: 'Riego' },
  { value: 'bosque', label: 'Bosque' },
];

const PRICE_PRESETS = [
  { label: '< $50M', range: [0, 50000000] as [number, number] },
  { label: '$50M - $200M', range: [50000000, 200000000] as [number, number] },
  { label: '$200M - $500M', range: [200000000, 500000000] as [number, number] },
  { label: '> $500M', range: [500000000, 5000000000] as [number, number] },
];

const FilterBar = ({
  selectedTypes,
  onToggleType,
  selectedRegions,
  onToggleRegion,
  selectedCountries,
  onToggleCountry,
  selectedTags,
  onToggleTag,
  priceRange,
  onPriceRangeChange,
  areaRange,
  onAreaRangeChange,
  onClearFilters,
  activeFiltersCount,
  showAISearch = false,
  onToggleAISearch,
  className,
}: FilterBarProps) => {
  const [expanded, setExpanded] = useState(false);

  const getTypeLabel = () => {
    if (selectedTypes.length === 0) return 'Tipo';
    if (selectedTypes.length === 1) {
      return PROPERTY_TYPES.find(t => t.value === selectedTypes[0])?.label || 'Tipo';
    }
    return `${selectedTypes.length} tipos`;
  };

  const getRegionLabel = () => {
    if (selectedRegions.length === 0) return 'Región';
    if (selectedRegions.length === 1) return selectedRegions[0];
    return `${selectedRegions.length} regiones`;
  };

  const getPriceLabel = () => {
    const hasMin = priceRange[0] > 0;
    const hasMax = priceRange[1] < 5000000000;
    if (!hasMin && !hasMax) return 'Precio';
    if (hasMin && hasMax) return `${formatPrice(priceRange[0])} – ${formatPrice(priceRange[1])}`;
    if (hasMin) return `Desde ${formatPrice(priceRange[0])}`;
    return `Hasta ${formatPrice(priceRange[1])}`;
  };

  const hasPriceFilter = priceRange[0] > 0 || priceRange[1] < 5000000000;

  return (
    <div className={cn('bg-background/80 backdrop-blur-xl border-b border-border/30', className)}>
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        {/* Collapsed bar */}
        <div className="container px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {/* Type Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-9 rounded-xl gap-1 flex-shrink-0 border-border/50',
                    selectedTypes.length > 0 && 'border-primary/30 bg-primary/5'
                  )}
                >
                  {getTypeLabel()}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-1">
                  {PROPERTY_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted"
                    >
                      <Checkbox
                        checked={selectedTypes.includes(type.value)}
                        onCheckedChange={() => onToggleType(type.value)}
                      />
                      <span className="text-sm">{type.label}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Country Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-9 rounded-xl gap-1 flex-shrink-0 border-border/50',
                    selectedCountries.length > 0 && 'border-primary/30 bg-primary/5'
                  )}
                >
                  <Globe className="h-3.5 w-3.5" />
                  {selectedCountries.length === 0 ? 'País' : selectedCountries.length === 1 
                    ? LATAM_COUNTRIES.find(c => c.name === selectedCountries[0])?.flag + ' ' + selectedCountries[0]
                    : `${selectedCountries.length} países`}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-1">
                  {LATAM_COUNTRIES.map((country) => (
                    <label
                      key={country.code}
                      className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted"
                    >
                      <Checkbox
                        checked={selectedCountries.includes(country.name)}
                        onCheckedChange={() => onToggleCountry(country.name)}
                      />
                      <span className="text-sm">{country.flag} {country.name}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Region Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-9 rounded-xl gap-1 flex-shrink-0 border-border/50',
                    selectedRegions.length > 0 && 'border-primary/30 bg-primary/5'
                  )}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {getRegionLabel()}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {REGIONS.map((region) => (
                    <label
                      key={region}
                      className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted"
                    >
                      <Checkbox
                        checked={selectedRegions.includes(region)}
                        onCheckedChange={() => onToggleRegion(region)}
                      />
                      <span className="text-sm">{region}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Price Filter - with presets */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-9 rounded-xl gap-1 flex-shrink-0 border-border/50',
                    hasPriceFilter && 'border-primary/30 bg-primary/5'
                  )}
                >
                  {getPriceLabel()}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4" align="start">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Rango de precio</h4>
                  
                  {/* Quick presets */}
                  <div className="flex flex-wrap gap-1.5">
                    {PRICE_PRESETS.map((preset) => {
                      const isActive = priceRange[0] === preset.range[0] && priceRange[1] === preset.range[1];
                      return (
                        <Badge
                          key={preset.label}
                          variant={isActive ? 'default' : 'outline'}
                          className={cn(
                            'cursor-pointer text-xs transition-colors',
                            isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                          )}
                          onClick={() => onPriceRangeChange(isActive ? [0, 5000000000] : preset.range)}
                        >
                          {preset.label}
                        </Badge>
                      );
                    })}
                  </div>

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
                  <div className="flex justify-between text-xs text-muted-foreground font-medium">
                    <span>{formatPrice(priceRange[0])}</span>
                    <span>{formatPrice(priceRange[1])}</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* More Filters Toggle */}
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl gap-1 flex-shrink-0 border-border/50"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Más filtros</span>
                {activeFiltersCount > 3 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    +{activeFiltersCount - 3}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>

            {/* AI Search Toggle */}
            {onToggleAISearch && (
              <Button
                variant={showAISearch ? 'default' : 'outline'}
                size="sm"
                onClick={onToggleAISearch}
                className="h-9 rounded-xl gap-1 flex-shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">IA</span>
              </Button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-9 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Expanded section */}
        <CollapsibleContent>
          <div className="container px-4 py-4 border-t border-border/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Area Range */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Superficie (m²)
                </h4>
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
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{areaRange[0].toLocaleString()} m²</span>
                  <span>{areaRange[1].toLocaleString()} m²</span>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3 md:col-span-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5" />
                  Características
                </h4>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((tag) => (
                    <Badge
                      key={tag.value}
                      variant={selectedTags.includes(tag.value) ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-all',
                        selectedTags.includes(tag.value)
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )}
                      onClick={() => onToggleTag(tag.value)}
                    >
                      {tag.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default FilterBar;
