import { useRef, useEffect, useCallback } from 'react';
import { Drawer } from 'vaul';
import { MapPin, ChevronUp, List, Sparkles } from 'lucide-react';
import { Listing } from '@/hooks/useListings';
import CompactListingCard from './CompactListingCard';
import ListingCard from '@/components/listings/ListingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ExploreBottomSheetProps {
  listings: Listing[];
  isLoading: boolean;
  selectedListing: Listing | null;
  onSelectListing: (listing: Listing | null) => void;
  onNavigateToDetail: (listing: Listing) => void;
  snapPoint: number;
  onSnapPointChange: (snap: number) => void;
}

const SNAP_POINTS = [0.12, 0.5, 0.92];

const ExploreBottomSheet = ({
  listings,
  isLoading,
  selectedListing,
  onSelectListing,
  onNavigateToDetail,
  snapPoint,
  onSnapPointChange,
}: ExploreBottomSheetProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const expandedListRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const isExpanded = snapPoint >= 0.9;
  const isCollapsed = snapPoint <= 0.12;

  // Register card ref
  const registerCardRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(id, el);
    } else {
      cardRefs.current.delete(id);
    }
  }, []);

  // Scroll to selected listing in carousel (horizontal)
  useEffect(() => {
    if (!selectedListing || isLoading) return;

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (!isExpanded && carouselRef.current) {
        // Horizontal scroll in carousel
        const index = listings.findIndex(l => l.id === selectedListing.id);
        if (index >= 0) {
          const cardWidth = 172; // 160px card + 12px gap
          const containerWidth = carouselRef.current.clientWidth;
          const scrollPosition = index * cardWidth - (containerWidth / 2) + (cardWidth / 2);
          
          carouselRef.current.scrollTo({
            left: Math.max(0, scrollPosition),
            behavior: 'smooth'
          });
        }
      } else if (isExpanded && expandedListRef.current) {
        // Vertical scroll in expanded list
        const cardEl = cardRefs.current.get(selectedListing.id);
        if (cardEl) {
          const containerRect = expandedListRef.current.getBoundingClientRect();
          const cardRect = cardEl.getBoundingClientRect();
          const scrollOffset = cardRect.top - containerRect.top - 20;
          
          expandedListRef.current.scrollTo({
            top: expandedListRef.current.scrollTop + scrollOffset,
            behavior: 'smooth'
          });
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [selectedListing, listings, isExpanded, isLoading]);

  // Auto-expand sheet when a listing is selected from map
  useEffect(() => {
    if (selectedListing && isCollapsed) {
      onSnapPointChange(0.5);
    }
  }, [selectedListing, isCollapsed, onSnapPointChange]);

  return (
    <Drawer.Root
      open={true}
      modal={false}
      snapPoints={SNAP_POINTS}
      activeSnapPoint={snapPoint}
      setActiveSnapPoint={(snap) => snap && onSnapPointChange(snap as number)}
      fadeFromIndex={0}
    >
      <Drawer.Portal>
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-30 flex flex-col",
            "bg-background/95 backdrop-blur-xl",
            "rounded-t-[20px] border-t border-border/40",
            "shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.15)]",
            "focus:outline-none"
          )}
          style={{
            height: `${snapPoint * 100}%`,
            maxHeight: '92%',
          }}
        >
          {/* Drag handle */}
          <div className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-1.5 rounded-lg transition-colors duration-300",
                selectedListing ? "bg-primary/20" : "bg-primary/10"
              )}>
                {selectedListing ? (
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                ) : (
                  <MapPin className="h-4 w-4 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isLoading ? 'Buscando...' : selectedListing 
                    ? 'Terreno seleccionado' 
                    : `${listings.length} terrenos`}
                </p>
                {!isCollapsed && (
                  <p className="text-xs text-muted-foreground">
                    {selectedListing 
                      ? 'Toca otra tarjeta o marcador'
                      : isExpanded ? 'Vista completa' : 'Desliza para ver más'}
                  </p>
                )}
              </div>
            </div>

            {!isCollapsed && (
              <button
                onClick={() => onSnapPointChange(isExpanded ? 0.5 : 0.92)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label={isExpanded ? 'Contraer' : 'Expandir'}
              >
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground rotate-180" />
                ) : (
                  <List className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="px-4 flex gap-3 overflow-hidden">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="w-[160px] h-[200px] shrink-0 rounded-xl" />
                ))}
              </div>
            ) : isExpanded ? (
              /* Expanded: Vertical list */
              <div 
                ref={expandedListRef}
                className="h-full overflow-y-auto px-4 pb-8 space-y-3 scroll-smooth"
              >
                {listings.map(listing => (
                  <div
                    key={listing.id}
                    ref={(el) => registerCardRef(listing.id, el)}
                    onClick={() => onSelectListing(listing)}
                    className={cn(
                      "transition-all duration-300 rounded-xl",
                      selectedListing?.id === listing.id 
                        ? "ring-2 ring-primary shadow-lg shadow-primary/10 scale-[1.01]" 
                        : "hover:shadow-md"
                    )}
                  >
                    <ListingCard
                      listing={listing}
                      onHover={() => {}}
                    />
                  </div>
                ))}
                {listings.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">
                      No se encontraron terrenos
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Intenta ajustar los filtros
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Collapsed/Partial: Horizontal carousel */
              <div
                ref={carouselRef}
                className="flex gap-3 overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-hide scroll-smooth"
              >
                {listings.map(listing => (
                  <CompactListingCard
                    key={listing.id}
                    listing={listing}
                    isSelected={selectedListing?.id === listing.id}
                    onSelect={onSelectListing}
                    onNavigate={onNavigateToDetail}
                  />
                ))}
                {listings.length === 0 && (
                  <div className="flex items-center justify-center w-full py-4">
                    <p className="text-sm text-muted-foreground">
                      No se encontraron terrenos
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default ExploreBottomSheet;
