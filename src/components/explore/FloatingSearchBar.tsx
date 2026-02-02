import { useState } from 'react';
import { Search, SlidersHorizontal, X, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FloatingSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenFilters: () => void;
  activeFiltersCount: number;
  selectedTypes: string[];
  selectedRegions: string[];
  onRemoveType: (type: string) => void;
  onRemoveRegion: (region: string) => void;
  className?: string;
}

const TYPE_LABELS: Record<string, string> = {
  parcela_rural: 'Parcela Rural',
  sitio_industrial: 'Sitio Industrial',
  campo_agricola: 'Campo Agrícola',
  terreno_urbano: 'Terreno Urbano',
  terreno_costero: 'Terreno Costero',
  terreno_montana: 'Terreno de Montaña',
  inversion: 'Inversión',
};

const FloatingSearchBar = ({
  searchQuery,
  onSearchChange,
  onOpenFilters,
  activeFiltersCount,
  selectedTypes,
  selectedRegions,
  onRemoveType,
  onRemoveRegion,
  className,
}: FloatingSearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const hasActiveChips = selectedTypes.length > 0 || selectedRegions.length > 0;

  return (
    <div className={cn(
      "absolute top-0 left-0 right-0 z-20 p-3 transition-all duration-300",
      className
    )}>
      {/* Main search container - glassmorphism */}
      <div className={cn(
        "bg-background/85 backdrop-blur-xl rounded-2xl border shadow-lg transition-all duration-300",
        isFocused 
          ? "border-primary/40 shadow-primary/10" 
          : "border-border/40 shadow-black/10"
      )}>
        {/* Search row */}
        <div className="flex items-center gap-2 p-2">
          {/* Search input */}
          <div className="relative flex-1">
            <div className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors",
              isFocused ? "bg-primary/15" : "bg-muted/60"
            )}>
              <Search className={cn(
                "h-4 w-4 transition-colors",
                isFocused ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <Input
              placeholder="Buscar terrenos..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="pl-11 h-11 bg-transparent border-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted/80 transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Filters button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenFilters}
            className={cn(
              "h-11 w-11 rounded-xl shrink-0 relative transition-all",
              activeFiltersCount > 0 
                ? "bg-primary/10 text-primary hover:bg-primary/20" 
                : "hover:bg-muted"
            )}
          >
            <SlidersHorizontal className="h-5 w-5" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Active filters chips */}
        {hasActiveChips && (
          <div className="px-3 pb-3 -mt-1">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
              {selectedTypes.map(type => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="shrink-0 bg-primary/15 text-primary border-0 pl-2 pr-1 py-1 h-7 text-xs font-medium hover:bg-primary/25 transition-colors"
                >
                  {TYPE_LABELS[type] || type}
                  <button
                    onClick={() => onRemoveType(type)}
                    className="ml-1 p-0.5 rounded-full hover:bg-primary/30"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedRegions.map(region => (
                <Badge
                  key={region}
                  variant="secondary"
                  className="shrink-0 bg-accent/15 text-accent border-0 pl-2 pr-1 py-1 h-7 text-xs font-medium hover:bg-accent/25 transition-colors"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {region}
                  <button
                    onClick={() => onRemoveRegion(region)}
                    className="ml-1 p-0.5 rounded-full hover:bg-accent/30"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingSearchBar;
