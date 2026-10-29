import { useState, useRef, useCallback, useEffect, useMemo, useDeferredValue } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2, MapPin, ArrowUpDown, Star, Clock, Bell, TrendingDown, LayoutGrid, List, Wheat, Factory, Truck, Zap, Home, Droplets, Car, ShieldCheck, X, Mountain, TrendingUp, Compass, ChevronDown } from 'lucide-react';
import SearchAutocomplete from '@/components/search/SearchAutocomplete';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { EmptyResultsState, FewResultsHint } from './EmptyResultsState';
import { Listing, formatPriceShort, getPricePerM2 } from '@/hooks/useListings';
import { bestPricePerM2, formatPricePerM2, formatPriceWithCurrency, minPriceByCurrency } from '@/lib/priceCurrency';
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

/**
 * Micro-caps section label + hair line separator.
 * Used inside the search command panel to group filters cleanly.
 */
const SectionLabel = ({ icon: Icon, children }: { icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) => (
  <div className="flex items-center gap-2">
    {Icon && <Icon className="h-3 w-3 text-muted-foreground/70" />}
    <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground/80">
      {children}
    </span>
    <div className="h-px flex-1 bg-border/40" />
  </div>
);

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

const currencyRank = (l: Listing) => ((l.currency || 'CLP').toUpperCase() === 'CLP' ? 0 : 1);

const sortListings = (listings: Listing[], sort: SortOption): Listing[] => {
  const sorted = [...listings];
  switch (sort) {
    // Same-currency comparison only: CLP block first, then UF; never interleave raw numbers.
    case 'price_asc': return sorted.sort((a, b) => currencyRank(a) - currencyRank(b) || (a.price ?? 0) - (b.price ?? 0));
    case 'price_desc': return sorted.sort((a, b) => currencyRank(a) - currencyRank(b) || (b.price ?? 0) - (a.price ?? 0));
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

/* ── Virtualized listing renderer ── */
interface VirtualizedListingsProps {
  listings: Listing[];
  scrollParentRef: React.RefObject<HTMLDivElement>;
  viewLayout: 'compact' | 'grid';
  hoveredListing?: Listing | null;
  selectedListing?: Listing | null;
  onListingHover?: (l: Listing | null) => void;
  onListingClick?: (l: Listing) => void;
  onListingPreview?: (l: Listing) => void;
  sentinelRef: React.RefObject<HTMLDivElement>;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  displayCount: number;
}

const VirtualizedListings = ({
  listings,
  scrollParentRef,
  viewLayout,
  hoveredListing,
  selectedListing,
  onListingHover,
  onListingClick,
  onListingPreview,
  sentinelRef,
  isLoadingMore,
  hasMore,
  displayCount,
}: VirtualizedListingsProps) => {
  const isGrid = viewLayout === 'grid';
  const columns = isGrid ? 2 : 1;
  const rowCount = Math.ceil(listings.length / columns);
  const estimatedRowSize = isGrid ? 210 : 108;

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => estimatedRowSize,
    overscan: 6,
    measureElement:
      typeof window !== 'undefined' && typeof ResizeObserver !== 'undefined'
        ? (el) => el?.getBoundingClientRect().height ?? estimatedRowSize
        : undefined,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <>
      <div
        style={{ height: totalSize, width: '100%', position: 'relative' }}
      >
        {virtualRows.map((virtualRow) => {
          const startIdx = virtualRow.index * columns;
          const rowItems = listings.slice(startIdx, startIdx + columns);
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className={cn(
                'absolute top-0 left-0 w-full',
                isGrid ? 'grid grid-cols-2 gap-2 pb-2' : 'pb-1'
              )}
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              {rowItems.map((listing) => (
                <QuickPropertyCard
                  key={listing.id}
                  listing={listing}
                  isHovered={hoveredListing?.id === listing.id}
                  isSelected={selectedListing?.id === listing.id}
                  onHover={onListingHover}
                  onClick={onListingClick}
                  onPreview={onListingPreview}
                  layout={isGrid ? 'vertical' : 'horizontal'}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-1" />

      {isLoadingMore && (
        <div className="space-y-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListingSkeleton key={`more-${i}`} />
          ))}
        </div>
      )}

      {!hasMore && listings.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">
          Mostrando {listings.length} de {displayCount} resultados
        </p>
      )}
    </>
  );
};

interface ExploreListPanelProps {
  listings: Listing[];
  totalCount?: number;
  partialResults?: boolean;
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
  priceCurrency?: 'CLP' | 'UF';
  priceRangeMax?: number;
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
  partialResults = false,
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
  priceCurrency = 'CLP',
  priceRangeMax,
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
  // Territorial/topography filters are collapsed by default so results stay
  // above the fold (they previously pushed every listing off-screen on mobile).
  const [territorialOpen, setTerritorialOpen] = useState(false);
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
  const partial = partialResults || territorialFilter.aptitudes.length > 0 || territorialFilter.hasWater === true || territorialFilter.hasRoad === true || Boolean(territorialFilter.legalStatus) || activeTab !== 'all';
  const displayCount = partial ? territorialFilteredListings.length : totalCount ?? listings.length;
  // Never convert UF↔CLP without a trusted rate: one minimum per currency,
  // best price/m² only within the dominant currency.
  const summary = useMemo(() => {
    if (listings.length === 0) return null;
    const regions = new Set(listings.map(l => l.region).filter(Boolean));
    return { byCurrency: minPriceByCurrency(listings), regionCount: regions.size };
  }, [listings]);
  const bestOpportunity = useMemo(() => bestPricePerM2(listings), [listings]);

  const territorialActiveCount =
    territorialFilter.aptitudes.length +
    (territorialFilter.hasWater === true ? 1 : 0) +
    (territorialFilter.hasRoad === true ? 1 : 0) +
    (territorialFilter.legalStatus ? 1 : 0) +
    selectedSlopes.length +
    selectedValuation.length;

  const featuredCount = listings.filter(l => l.featured).length;
  const recentCount = listings.filter(l => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(l.created_at) > oneWeekAgo;
  }).length;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* ═══════════════════════════════════════════════════════════════
          Search Command Panel — "command center" direction
          One outer glass card that stacks: search+actions row,
          labeled filter sections separated by hair-lines,
          and a compact stats/clear footer.
          ═══════════════════════════════════════════════════════════════ */}
      <div className="p-3 pb-2 border-b border-border/20">
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-lg shadow-background/40 overflow-hidden">
          {/* Row 1 — Search input + Filtros + IA (rendered by FilterBar) */}
          <div className="p-2.5 flex flex-col gap-2 border-b border-border/40">
            <SearchAutocomplete
              initialQuery={searchQuery}
              onSearchChange={onSearchChange}
              placeholder="Buscar por ciudad, comuna o coordenadas..."
            />
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
              priceCurrency={priceCurrency}
              priceRangeMax={priceRangeMax}
              onPriceRangeChange={onPriceRangeChange}
              areaRange={areaRange}
              onAreaRangeChange={onAreaRangeChange}
              onClearFilters={onClearFilters}
              activeFiltersCount={activeFiltersCount}
              resultsCount={displayCount}
              showAISearch={showAISearch}
              onToggleAISearch={onToggleAISearch}
              className="!bg-transparent !border-0 !backdrop-blur-0 [&>div:first-child]:!px-0 [&>div:first-child]:!py-0 [&>div:nth-child(2)]:!px-0"
            />
          </div>

          {/* Body — territorial filters, collapsed by default to keep results
              above the fold. The trigger shows a badge with active count. */}
          <Collapsible open={territorialOpen} onOpenChange={setTerritorialOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full px-3.5 py-2.5 flex items-center gap-2 text-left hover:bg-muted/30 transition-colors"
              >
                <Compass className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">
                  Aptitud, topografía y plusvalía
                </span>
                {territorialActiveCount > 0 && (
                  <span className="h-4 min-w-4 px-1 rounded-full bg-primary/15 text-primary text-[10px] font-semibold inline-flex items-center justify-center">
                    {territorialActiveCount}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    'ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform',
                    territorialOpen && 'rotate-180',
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3.5 pb-3.5 pt-1 space-y-4">
                <section className="flex flex-col gap-2.5">
                  <SectionLabel icon={Compass}>Aptitud territorial</SectionLabel>
                  <TerritorialFilters listings={listings} onFilterChange={setTerritorialFilter} />
                </section>

                {onToggleSlope && onToggleValuation && (
                  <section className="flex flex-col gap-2.5">
                    <SectionLabel icon={Mountain}>Topografía & plusvalía</SectionLabel>
                    <ValuationFilters
                      selectedSlopes={selectedSlopes}
                      onToggleSlope={onToggleSlope}
                      selectedValuation={selectedValuation}
                      onToggleValuation={onToggleValuation}
                    />
                  </section>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Summary + Tabs + Sort */}
      <div className="px-4 py-2 space-y-2 border-b border-border/10">
        {/* Summary */}
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-sm text-muted-foreground">
            <span className="text-base font-bold text-foreground tabular-nums">{displayCount}</span>{' '}
            terreno{displayCount === 1 ? '' : 's'}{partial ? ' en la selección cargada' : ''}
            {summary?.byCurrency.length ? ` desde ${summary.byCurrency.map(c => formatPriceWithCurrency(c.min, c.currency)).join(' · ')}` : ''}
            {summary && summary.regionCount > 1 ? ` en ${summary.regionCount} regiones` : ''}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
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
            <span className="text-[11px] font-semibold text-primary">Menor precio/m² cargado</span>
          </div>
          <p className="text-xs text-foreground font-medium truncate">{bestOpportunity.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {formatPricePerM2(bestOpportunity.price, bestOpportunity.area_m2, bestOpportunity.currency)} · {formatPriceWithCurrency(bestOpportunity.price, bestOpportunity.currency)}
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
            <EmptyResultsState
              activeFiltersCount={activeFiltersCount}
              onClearFilters={onClearFilters}
              onSelectRegion={(region) => {
                if (!selectedRegions.includes(region)) {
                  onClearFilters();
                  onToggleRegion(region);
                }
              }}
            />
          ) : (
            <>
              <FewResultsHint
                count={sortedListings.length}
                activeFiltersCount={activeFiltersCount}
                onClearFilters={onClearFilters}
              />
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
            </>
          )}
        </div>
      </div>

      {partial && <p role="status" className="px-4 py-2 text-xs text-muted-foreground">Resultados de las publicaciones cargadas. Carga más para ampliar esta selección.</p>}
      {hasMore && <Button type="button" variant="outline" className="mx-4 my-2" disabled={isLoadingMore} onClick={onLoadMore}>{isLoadingMore ? 'Cargando…' : 'Cargar más publicaciones'}</Button>}
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
