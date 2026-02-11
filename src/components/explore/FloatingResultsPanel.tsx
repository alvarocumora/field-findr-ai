import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, MapPin, Layers, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import QuickPropertyCard from './QuickPropertyCard';
import { Listing } from '@/hooks/useListings';
import { cn } from '@/lib/utils';

type PanelState = 'collapsed' | 'normal' | 'expanded';
type SortOption = 'featured' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc' | 'recent';

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
  normal: 'w-[360px]',
  expanded: 'w-[440px]',
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const sortedListings = sortListings(listings, sortBy);

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

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, onLoadMore, isLoadingMore]);

  // Auto-expand when a listing is selected from map
  useEffect(() => {
    if (selectedListing && panelState === 'collapsed') {
      setPanelState('normal');
    }
  }, [selectedListing, panelState]);

  const displayCount = totalCount ?? listings.length;

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
          {/* Header */}
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
                    propiedades
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/70">
                  en el área visible
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {panelState === 'normal' ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={expand}
                  className="h-9 w-9 rounded-xl hover:bg-accent/10"
                  title="Expandir panel"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPanelState('normal')}
                  className="h-9 w-9 rounded-xl hover:bg-accent/10"
                  title="Reducir panel"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={collapse}
                className="h-9 w-9 rounded-xl hover:bg-accent/10"
                title="Colapsar panel"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
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
                    <Skeleton className="w-24 h-20 rounded-xl" />
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

          {/* Footer with resize handle */}
          <div className="px-5 py-3 border-t border-border/20 flex justify-center">
            <div
              className={cn(
                'w-16 h-1.5 rounded-full cursor-pointer transition-all duration-200',
                'bg-border/40 hover:bg-primary/40 hover:scale-x-110'
              )}
              onClick={toggleState}
              title="Redimensionar panel"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default FloatingResultsPanel;
