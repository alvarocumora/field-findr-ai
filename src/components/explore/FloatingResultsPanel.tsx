import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, List, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import QuickPropertyCard from './QuickPropertyCard';
import { Listing } from '@/hooks/useListings';
import { cn } from '@/lib/utils';

type PanelState = 'collapsed' | 'normal' | 'expanded';

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
  collapsed: 'w-12',
  normal: 'w-80',
  expanded: 'w-[420px]',
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

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
        'flex flex-col bg-background/95 backdrop-blur-xl',
        'rounded-2xl border border-border/40 shadow-2xl',
        'transition-all duration-300 ease-out',
        PANEL_WIDTHS[panelState],
        className
      )}
    >
      {/* Collapsed State */}
      {panelState === 'collapsed' ? (
        <div className="flex flex-col items-center py-4 gap-4 h-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={expand}
            className="h-10 w-10 rounded-xl hover:bg-primary/10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <List className="h-5 w-5 text-muted-foreground" />
            <div className="writing-mode-vertical text-xs font-medium text-muted-foreground rotate-180" style={{ writingMode: 'vertical-rl' }}>
              {displayCount} resultados
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground">
                  {displayCount}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  propiedades
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {panelState === 'normal' ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={expand}
                  className="h-8 w-8 rounded-lg"
                  title="Expandir panel"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPanelState('normal')}
                  className="h-8 w-8 rounded-lg"
                  title="Reducir panel"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={collapse}
                className="h-8 w-8 rounded-lg"
                title="Colapsar panel"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="p-2 space-y-1">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="w-20 h-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))
              ) : listings.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h4 className="text-sm font-medium text-foreground mb-1">
                    Sin resultados
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Ajusta los filtros para encontrar propiedades
                  </p>
                </div>
              ) : (
                <>
                  {listings.map((listing) => (
                    <QuickPropertyCard
                      key={listing.id}
                      listing={listing}
                      isHovered={hoveredListing?.id === listing.id}
                      isSelected={selectedListing?.id === listing.id}
                      onHover={onListingHover}
                      onClick={onListingClick}
                      onPreview={onListingPreview}
                    />
                  ))}

                  {/* Load more trigger */}
                  {hasMore && (
                    <div ref={loadMoreRef} className="py-4 flex justify-center">
                      {isLoadingMore ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-xs">Cargando más...</span>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onLoadMore}
                          className="text-xs h-8"
                        >
                          Cargar más
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>

          {/* Footer with expand/collapse handle */}
          <div className="px-4 py-2 border-t border-border/30 flex justify-center">
            <div
              className="w-12 h-1 rounded-full bg-border/50 cursor-pointer hover:bg-border transition-colors"
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
