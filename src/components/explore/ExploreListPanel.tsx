import { useState, useRef, useCallback, useEffect, useMemo, useDeferredValue } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2, MapPin, ArrowUpDown, Star, Clock, Bell, TrendingDown, LayoutGrid, List, Wheat, Factory, Truck, Zap, Home, Droplets, Car, ShieldCheck } from 'lucide-react';
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
import ValuationFilters from './ValuationFilters';
import { Listing, formatPriceShort, getPricePerM2 } from '@/hooks/useListings';
import { cn } from '@/lib/utils';

type TerritorialFilterState = {
  aptitudes: string[];
  hasWater: boolean | null;
  hasRoad: boolean | null;
  legalStatus: string | null;
};

const APTITUDE_OPTIONS = [
  { key: 'agricola', label: 'Agrícola', icon: Wheat },
  { key: 'industrial', label: 'Industrial', icon: Factory },
  { key: 'logistico', label: 'Logístico', icon: Truck },
  { key: 'energetico', label: 'Energético', icon: Zap },
  { key: 'residencial', label: 'Residencial', icon: Home },
];

const TerritorialFilters = ({ onFilterChange }: { listings: Listing[]; onFilterChange: (filter: TerritorialFilterState) => void }) => {
  const [filter, setFilter] = useState<TerritorialFilterState>({
    aptitudes: [], hasWater: null, hasRoad: null, legalStatus: null,
  });

  const update = (next: TerritorialFilterState) => { setFilter(next); onFilterChange(next); };

  const toggleAptitude = (key: string) => {
    const aptitudes = filter.aptitudes.includes(key)
      ? filter.aptitudes.filter(a => a !== key)
      : [...filter.aptitudes, key];
    update({ ...filter, aptitudes });
  };

  const hasAny = filter.aptitudes.length > 0 || filter.hasWater !== null || filter.hasRoad !== null || filter.legalStatus !== null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {APTITUDE_OPTIONS.map(opt => {
          const active = filter.aptitudes.includes(opt.key);
          return (
            <button
              key={opt.key}
              onClick={() => toggleAptitude(opt.key)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border',
                active
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'text-muted-foreground border-border/40 hover:bg-muted/50'
              )}
            >
              <opt.icon className="h-3 w-3" />
              {opt.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => update({ ...filter, hasWater: filter.hasWater === true ? null : true })}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border',
            filter.hasWater === true
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'text-muted-foreground border-border/40 hover:bg-muted/50'
          )}
        >
          <Droplets className="h-3 w-3" />
          Con agua
        </button>
        <button
          onClick={() => update({ ...filter, hasRoad: filter.hasRoad === true ? null : true })}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border',
            filter.hasRoad === true
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'text-muted-foreground border-border/40 hover:bg-muted/50'
          )}
        >
          <Car className="h-3 w-3" />
          Con camino
        </button>
        <button
          onClick={() => update({ ...filter, legalStatus: filter.legalStatus === 'verified' ? null : 'verified' })}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border',
            filter.legalStatus === 'verified'
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'text-muted-foreground border-border/40 hover:bg-muted/50'
          )}
        >
          <ShieldCheck className="h-3 w-3" />
          Legal al día
        </button>
        {hasAny && (
          <button
            onClick={() => update({ aptitudes: [], hasWater: null, hasRoad: null, legalStatus: null })}
            className="px-2 py-1 rounded-lg text-[11px] text-destructive hover:bg-destructive/10 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
};

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
  selectedSlopes?: string[];
  onToggleSlope?: (slope: string) => void;
  selectedValuation?: string[];
  onToggleValuation?: (val: string) => void;
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
  selectedSlopes = [],
  onToggleSlope,
  selectedValuation = [],
  onToggleValuation,
}: ExploreListPanelProps) => {
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [viewLayout, setViewLayout] = useState<'compact' | 'grid'>('compact');
  const [territorialFilter, setTerritorialFilter] = useState<TerritorialFilterState>({
    aptitudes: [], hasWater: null, hasRoad: null, legalStatus: null,
  });
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

  // Apply territorial filters
  const territorialFilteredListings = useMemo(() => {
    let result = tabFilteredListings;
    const f = territorialFilter;
    if (f.aptitudes.length > 0) {
      result = result.filter(l => {
        const tags = (l.tags || []).map(t => t.toLowerCase());
        const type = (l.type || '').toLowerCase();
        return f.aptitudes.some(apt => tags.some(t => t.includes(apt)) || type.includes(apt));
      });
    }
    if (f.hasWater === true) {
      result = result.filter(l => {
        const u = l.utilities as Record<string, boolean> | null;
        return u?.water === true || (l.tags || []).some(t => t.toLowerCase().includes('agua'));
      });
    }
    if (f.hasRoad === true) {
      result = result.filter(l => {
        const u = l.utilities as Record<string, boolean> | null;
        return u?.road === true || (l.tags || []).some(t => t.toLowerCase().includes('camino') || t.toLowerCase().includes('acceso'));
      });
    }
    if (f.legalStatus === 'verified') {
      result = result.filter(l => l.legal_status === 'verified');
    }
    return result;
  }, [tabFilteredListings, territorialFilter]);

  const sortedListingsRaw = useMemo(() => sortListings(territorialFilteredListings, sortBy), [territorialFilteredListings, sortBy]);
  // Defer expensive re-render when filters change quickly (progressive rendering)
  const sortedListings = useDeferredValue(sortedListingsRaw);

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

        {/* Valuation & Topography Filters */}
        {onToggleSlope && onToggleValuation && (
          <ValuationFilters
            selectedSlopes={selectedSlopes}
            onToggleSlope={onToggleSlope}
            selectedValuation={selectedValuation}
            onToggleValuation={onToggleValuation}
          />
        )}

        {/* Territorial Aptitude Filters */}
        <TerritorialFilters listings={listings} onFilterChange={setTerritorialFilter} />
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
          <div className="flex items-center gap-2">
            <ToggleGroup type="single" value={viewLayout} onValueChange={(v) => v && setViewLayout(v as 'compact' | 'grid')} size="sm">
              <ToggleGroupItem value="compact" aria-label="Lista"><List className="h-3 w-3" /></ToggleGroupItem>
              <ToggleGroupItem value="grid" aria-label="Grid"><LayoutGrid className="h-3 w-3" /></ToggleGroupItem>
            </ToggleGroup>
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
              <p className="text-xs text-muted-foreground max-w-[220px] mb-4">
                Ajusta los filtros o mueve el mapa para encontrar propiedades en esta zona.
              </p>
              {activeFiltersCount > 0 && (
                <Button size="sm" variant="outline" onClick={onClearFilters} className="rounded-xl">
                  Limpiar filtros ({activeFiltersCount})
                </Button>
              )}
            </div>

          ) : (
            <VirtualizedListings
              listings={sortedListings}
              scrollParentRef={scrollContainerRef}
              viewLayout={viewLayout}
              hoveredListing={hoveredListing}
              selectedListing={selectedListing}
              onListingHover={onListingHover}
              onListingClick={onListingClick}
              onListingPreview={onListingPreview}
              sentinelRef={sentinelRef}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              displayCount={displayCount}
            />
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
