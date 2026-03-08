import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Loader2, MapPin, ArrowUpDown, Star, Clock, Bell, TrendingDown, LayoutGrid, List } from 'lucide-react';
import SearchAutocomplete from '@/components/search/SearchAutocomplete';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import QuickPropertyCard from './QuickPropertyCard';
import FilterBar from './FilterBar';
import { Listing, formatPriceShort, getPricePerM2 } from '@/hooks/useListings';
import { cn } from '@/lib/utils';

type SortOption = 'featured' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc' | 'recent';
type TabFilter = 'all' | 'featured' | 'recent';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Destacados' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'area_desc', label: 'Superficie: mayor' },
  { value: 'area_asc', label: 'Superficie: menor' },
  { value: 'recent', label: 'Más recientes' },
];

const sortListings = (listings: Listing[], sort: SortOption): Listing[] => {
  const sorted = [...listings];
  switch (sort) {
    case 'price_asc': return sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    case 'price_desc': return sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    case 'area_asc': return sorted.sort((a, b) => (a.area_m2 ?? 0) - (b.area_m2 ?? 0));
    case 'area_desc': return sorted.sort((a, b) => (b.area_m2 ?? 0) - (a.area_m2 ?? 0));
    case 'recent': return sorted.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    default: return sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }
};

/* ── Skeleton Card ── */
const ListingSkeleton = () => (
  <div className="flex gap-3 p-3 rounded-xl">
    <Skeleton className="w-[120px] h-[88px] rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-2.5 py-1">
      <Skeleton className="h-4 w-3/5" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  </div>
);

interface ExploreListPanelProps {
  listings: Listing[];
  totalCount?: number;
  isLoading?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  hoveredListing?: Listing | null;
  selectedListing?: Listing | null;
  onListingHover?: (listing: Listing | null) => void;
  onListingClick?: (listing: Listing) => void;
  onListingPreview?: (listing: Listing) => void;
  // Filter props
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
}

const ExploreListPanel = ({
  listings,
  totalCount,
  isLoading = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  searchQuery,
  onSearchChange,
  hoveredListing,
  selectedListing,
  onListingHover,
  onListingClick,
  onListingPreview,
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
  showAISearch,
  onToggleAISearch,
}: ExploreListPanelProps) => {
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || isLoadingMore || isLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore?.();
        }
      },
      { root: scrollContainerRef.current, rootMargin: '200px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, onLoadMore]);

  // Filter by tab
  const tabFilteredListings = useMemo(() => {
    if (activeTab === 'featured') return listings.filter(l => l.featured);
    if (activeTab === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return listings.filter(l => new Date(l.created_at) > oneWeekAgo);
    }
    return listings;
  }, [listings, activeTab]);

  const sortedListings = sortListings(tabFilteredListings, sortBy);

  // Smart summary
  const displayCount = totalCount ?? listings.length;
  const summary = useMemo(() => {
    if (listings.length === 0) return null;
    const prices = listings.map(l => l.price).sort((a, b) => a - b);
    const regions = new Set(listings.map(l => l.region).filter(Boolean));
    return { minPrice: prices[0], regionCount: regions.size };
  }, [listings]);

  // Best opportunity
  const bestOpportunity = useMemo(() => {
    let best: Listing | null = null;
    let bestRatio = Infinity;
    for (const l of listings) {
      const ppm2 = getPricePerM2(l.price, l.area_m2);
      if (ppm2 && ppm2 < bestRatio) { bestRatio = ppm2; best = l; }
    }
    return best;
  }, [listings]);

  const featuredCount = listings.filter(l => l.featured).length;
  const recentCount = listings.filter(l => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(l.created_at) > oneWeekAgo;
  }).length;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Search Header */}
      <div className="p-4 pb-2 space-y-3 border-b border-border/20">
        <SearchAutocomplete
          onSearchChange={onSearchChange}
          placeholder="Buscar terrenos, ubicaciones..."
        />

        {/* Compact Filters */}
        <FilterBar
          selectedTypes={selectedTypes}
          onToggleType={onToggleType}
          selectedRegions={selectedRegions}
          onToggleRegion={onToggleRegion}
          selectedCountries={selectedCountries}
          onToggleCountry={onToggleCountry}
          selectedTags={selectedTags}
          onToggleTag={onToggleTag}
          priceRange={priceRange}
          onPriceRangeChange={onPriceRangeChange}
          areaRange={areaRange}
          onAreaRangeChange={onAreaRangeChange}
          onClearFilters={onClearFilters}
          activeFiltersCount={activeFiltersCount}
          showAISearch={showAISearch}
          onToggleAISearch={onToggleAISearch}
          className="!bg-transparent !border-0 !backdrop-blur-0"
        />
      </div>

      {/* Summary + Tabs + Sort */}
      <div className="px-4 py-2 space-y-2 border-b border-border/10">
        {/* Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">{displayCount}</span>
            <span className="text-sm text-muted-foreground">
              terrenos{summary ? ` desde ${formatPriceShort(summary.minPrice)}` : ''}
              {summary && summary.regionCount > 1 ? ` en ${summary.regionCount} regiones` : ''}
            </span>
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-7 w-auto text-[11px] rounded-lg border-border/40 gap-1 px-2">
              <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {[
            { key: 'all' as TabFilter, label: 'Todos', count: listings.length },
            { key: 'featured' as TabFilter, label: 'Destacados', count: featuredCount, icon: Star },
            { key: 'recent' as TabFilter, label: 'Nuevos', count: recentCount, icon: Clock },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/50'
              )}
            >
              {tab.icon && <tab.icon className="h-3 w-3" />}
              {tab.label}
              <span className={cn(
                'text-[10px] px-1 py-0.5 rounded-full',
                activeTab === tab.key ? 'bg-primary/20' : 'bg-muted'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Best Opportunity */}
      {bestOpportunity && activeTab === 'all' && !isLoading && (
        <div
          className="mx-3 mt-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20 cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => onListingPreview?.(bestOpportunity)}
        >
          <div className="flex items-center gap-2 mb-0.5">
            <TrendingDown className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-primary">Mejor oportunidad</span>
          </div>
          <p className="text-xs text-foreground font-medium truncate">{bestOpportunity.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {formatPriceShort(getPricePerM2(bestOpportunity.price, bestOpportunity.area_m2) || 0)}/m² · {formatPriceShort(bestOpportunity.price)}
          </p>
        </div>
      )}

      {/* Listings Scroll Container */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="p-3">
          {isLoading ? (
            <div className="space-y-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <ListingSkeleton key={i} />
              ))}
            </div>
          ) : sortedListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Sin resultados</h4>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Ajusta los filtros o mueve el mapa para encontrar propiedades
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedListings.map((listing, index) => (
                <div
                  key={listing.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${Math.min(index * 20, 100)}ms` }}
                >
                  <QuickPropertyCard
                    listing={listing}
                    isHovered={hoveredListing?.id === listing.id}
                    isSelected={selectedListing?.id === listing.id}
                    onHover={onListingHover}
                    onClick={onListingClick}
                    onPreview={onListingPreview}
                    layout="horizontal"
                  />
                </div>
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="py-1" />

              {/* Loading more indicator */}
              {isLoadingMore && (
                <div className="space-y-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <ListingSkeleton key={`more-${i}`} />
                  ))}
                </div>
              )}

              {/* End of results */}
              {!hasMore && sortedListings.length > 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">
                  Mostrando {sortedListings.length} de {displayCount} resultados
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-4 py-3 border-t border-border/20">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-colors">
          <Bell className="h-3.5 w-3.5" />
          ¿No encuentras lo que buscas? Activar alertas
        </button>
      </div>
    </div>
  );
};

export default ExploreListPanel;
