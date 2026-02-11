import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2, MapPin, Layers, ArrowUpDown, Star, Clock, Bell, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import QuickPropertyCard from './QuickPropertyCard';
import { Listing, formatPrice, formatPriceShort, getPricePerM2 } from '@/hooks/useListings';
import { cn } from '@/lib/utils';

type PanelState = 'collapsed' | 'normal' | 'expanded';
type SortOption = 'featured' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc' | 'recent';
type TabFilter = 'all' | 'featured' | 'recent';

interface FloatingResultsPanelProps {
  listings: Listing[];
  isLoading?: boolean;
  totalCount?: number;
  hoveredListing?: Listing | null;
  selectedListing?: Listing | null;
  onListingHover?: (listing: Listing | null) => void;
  onListingClick?: (listing: Listing) => void;
  onListingPreview?: (listing: Listing) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  className?: string;
}

const PANEL_WIDTHS: Record<PanelState, string> = {
  collapsed: 'w-14',
  normal: 'w-[380px]',
  expanded: 'w-[460px]',
};

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
    case 'price_asc':
      return sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    case 'price_desc':
      return sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    case 'area_asc':
      return sorted.sort((a, b) => (a.area_m2 ?? 0) - (b.area_m2 ?? 0));
    case 'area_desc':
      return sorted.sort((a, b) => (b.area_m2 ?? 0) - (a.area_m2 ?? 0));
    case 'recent':
      return sorted.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    case 'featured':
    default:
      return sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }
};

const FloatingResultsPanel = ({
  listings,
  isLoading = false,
  totalCount,
  hoveredListing,
  selectedListing,
  onListingHover,
  onListingClick,
  onListingPreview,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  className,
}: FloatingResultsPanelProps) => {
  const [panelState, setPanelState] = useState<PanelState>('normal');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

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
  const summary = useMemo(() => {
    if (listings.length === 0) return null;
    const prices = listings.map(l => l.price).sort((a, b) => a - b);
    const minPrice = prices[0];
    const regions = new Set(listings.map(l => l.region).filter(Boolean));
    return {
      minPrice,
      regionCount: regions.size,
    };
  }, [listings]);

  // Best opportunity (lowest price/m2)
  const bestOpportunity = useMemo(() => {
    let best: Listing | null = null;
    let bestRatio = Infinity;
    for (const l of listings) {
      const ppm2 = getPricePerM2(l.price, l.area_m2);
      if (ppm2 && ppm2 < bestRatio) {
        bestRatio = ppm2;
        best = l;
      }
    }
    return best;
  }, [listings]);

  // Cycle through states
  const toggleState = useCallback(() => {
    setPanelState((prev) => {
      if (prev === 'collapsed') return 'normal';
      if (prev === 'normal') return 'expanded';
      return 'collapsed';
    });
  }, []);

  const collapse = useCallback(() => setPanelState('collapsed'), []);
  const expand = useCallback(() => setPanelState(prev => prev === 'collapsed' ? 'normal' : 'expanded'), []);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    return () => { observerRef.current?.disconnect(); };
  }, [hasMore, onLoadMore, isLoadingMore]);

  // Auto-expand when a listing is selected from map
  useEffect(() => {
    if (selectedListing && panelState === 'collapsed') {
      setPanelState('normal');
    }
  }, [selectedListing, panelState]);

  const displayCount = totalCount ?? listings.length;
  const featuredCount = listings.filter(l => l.featured).length;
  const recentCount = listings.filter(l => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(l.created_at) > oneWeekAgo;
  }).length;

  return (
    <div
      className={cn(
        'absolute left-4 top-4 bottom-4 z-20',
        'flex flex-col',
        'bg-background/90 backdrop-blur-2xl',
        'rounded-3xl border border-border/30',
        'shadow-2xl shadow-black/10',
        'transition-all duration-400 ease-out',
        PANEL_WIDTHS[panelState],
        className
      )}
    >
      {/* Collapsed State */}
      {panelState === 'collapsed' ? (
        <div className="flex flex-col items-center py-5 gap-4 h-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={expand}
            className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div 
              className="text-xs font-semibold text-muted-foreground rotate-180" 
              style={{ writingMode: 'vertical-rl' }}
            >
              {displayCount} propiedades
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header with smart summary */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center shadow-inner">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-foreground">
                    {displayCount}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    terrenos
                  </span>
                </div>
                {summary && (
                  <p className="text-[11px] text-muted-foreground/70">
                    desde {formatPriceShort(summary.minPrice)}
                    {summary.regionCount > 1 && ` en ${summary.regionCount} regiones`}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {panelState === 'normal' ? (
                <Button variant="ghost" size="icon" onClick={expand} className="h-9 w-9 rounded-xl hover:bg-accent/10" title="Expandir panel">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => setPanelState('normal')} className="h-9 w-9 rounded-xl hover:bg-accent/10" title="Reducir panel">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={collapse} className="h-9 w-9 rounded-xl hover:bg-accent/10" title="Colapsar panel">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Inline Tabs */}
          <div className="px-4 py-2 border-b border-border/10 flex items-center gap-1">
            {[
              { key: 'all' as TabFilter, label: 'Todos', count: listings.length, icon: Layers },
              { key: 'featured' as TabFilter, label: 'Destacados', count: featuredCount, icon: Star },
              { key: 'recent' as TabFilter, label: 'Nuevos', count: recentCount, icon: Clock },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50'
                )}
              >
                <tab.icon className="h-3 w-3" />
                {tab.label}
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full',
                  activeTab === tab.key ? 'bg-primary/20' : 'bg-muted'
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <div className="px-4 py-2 border-b border-border/10">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="h-8 text-xs rounded-lg border-border/40">
                <ArrowUpDown className="h-3 w-3 mr-1.5 text-muted-foreground" />
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

          {/* Best Opportunity sticky banner */}
          {bestOpportunity && activeTab === 'all' && !isLoading && (
            <div 
              className="mx-3 mt-2 p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 cursor-pointer hover:border-emerald-500/40 transition-colors"
              onClick={() => onListingPreview?.(bestOpportunity)}
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Mejor oportunidad</span>
              </div>
              <p className="text-xs text-foreground font-medium truncate">{bestOpportunity.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatPriceShort(getPricePerM2(bestOpportunity.price, bestOpportunity.area_m2) || 0)}/m² · {formatPriceShort(bestOpportunity.price)}
              </p>
            </div>
          )}

          {/* Content */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="p-3 space-y-2">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-3 p-3 animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <Skeleton className="w-[120px] h-[88px] rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
              ) : sortedListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mb-5 shadow-inner">
                    <MapPin className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <h4 className="text-base font-semibold text-foreground mb-2">
                    Sin resultados
                  </h4>
                  <p className="text-sm text-muted-foreground max-w-[200px]">
                    Ajusta los filtros o mueve el mapa para encontrar propiedades
                  </p>
                </div>
              ) : (
                <>
                  {sortedListings.map((listing, index) => (
                    <div
                      key={listing.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                    >
                      <QuickPropertyCard
                        listing={listing}
                        isHovered={hoveredListing?.id === listing.id}
                        isSelected={selectedListing?.id === listing.id}
                        onHover={onListingHover}
                        onClick={onListingClick}
                        onPreview={onListingPreview}
                      />
                    </div>
                  ))}

                  {/* Load more trigger */}
                  {hasMore && (
                    <div ref={loadMoreRef} className="py-6 flex justify-center">
                      {isLoadingMore ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Cargando más...</span>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onLoadMore}
                          className="text-sm h-9 rounded-xl hover:bg-primary/5 hover:border-primary/30"
                        >
                          Cargar más propiedades
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>

          {/* Footer with CTA */}
          <div className="px-4 py-3 border-t border-border/20">
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              <Bell className="h-3.5 w-3.5" />
              ¿No encuentras lo que buscas? Activar alertas
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FloatingResultsPanel;
