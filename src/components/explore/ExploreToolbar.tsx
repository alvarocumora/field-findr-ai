import { useMemo } from 'react';
import { MapPin, ArrowUpDown, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Listing, formatPriceShort } from '@/hooks/useListings';
import { cn } from '@/lib/utils';

export type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'area_desc' | 'price_m2';
export type TabFilter = 'all' | 'featured' | 'best_price';

interface ExploreToolbarProps {
  listings: Listing[];
  activeTab: TabFilter;
  onTabChange: (tab: TabFilter) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onOpenMap: () => void;
  className?: string;
}

const ExploreToolbar = ({
  listings,
  activeTab,
  onTabChange,
  sortBy,
  onSortChange,
  onOpenMap,
  className,
}: ExploreToolbarProps) => {
  const summary = useMemo(() => {
    const count = listings.length;
    const regions = new Set(listings.map(l => l.region).filter(Boolean));
    const minPrice = listings.length > 0 ? Math.min(...listings.map(l => l.price)) : 0;
    return { count, regionCount: regions.size, minPrice };
  }, [listings]);

  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center gap-3 py-3', className)}>
      {/* Summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span>
          <strong className="text-foreground">{summary.count}</strong> terrenos
          {summary.minPrice > 0 && (
            <> desde <strong className="text-primary">{formatPriceShort(summary.minPrice)}</strong></>
          )}
          {summary.regionCount > 0 && (
            <> en <strong className="text-foreground">{summary.regionCount}</strong> regiones</>
          )}
        </span>
      </div>

      <div className="flex-1" />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabFilter)} className="flex-shrink-0">
        <TabsList className="h-8 bg-muted/50">
          <TabsTrigger value="all" className="text-xs h-7 px-3">Todos</TabsTrigger>
          <TabsTrigger value="featured" className="text-xs h-7 px-3">Destacados</TabsTrigger>
          <TabsTrigger value="best_price" className="text-xs h-7 px-3">Mejor precio/m²</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Sort */}
      <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg flex-shrink-0">
          <ArrowUpDown className="h-3 w-3 mr-1" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Más recientes</SelectItem>
          <SelectItem value="price_asc">Menor precio</SelectItem>
          <SelectItem value="price_desc">Mayor precio</SelectItem>
          <SelectItem value="area_desc">Mayor superficie</SelectItem>
          <SelectItem value="price_m2">Mejor precio/m²</SelectItem>
        </SelectContent>
      </Select>

      {/* Map button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenMap}
        className="h-8 rounded-lg gap-1.5 flex-shrink-0 border-primary/30 text-primary hover:bg-primary/5"
      >
        <Map className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Ver en mapa</span>
      </Button>
    </div>
  );
};

export default ExploreToolbar;
