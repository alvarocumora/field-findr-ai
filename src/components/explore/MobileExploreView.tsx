import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Layers, Map as MapIcon, List, ArrowUp } from 'lucide-react';
import EnhancedMap from '@/components/map/EnhancedMap';
import MapErrorBoundary from '@/components/map/MapErrorBoundary';
import SwipeExplorer from './SwipeExplorer';
import ExploreListPanel from './ExploreListPanel';
import ProjectsRail from './ProjectsRail';
import FloatingSearchBar from './FloatingSearchBar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Listing } from '@/hooks/useListings';

export type MobileExploreMode = 'swipe' | 'list' | 'map';

interface MobileExploreViewProps {
  mode: MobileExploreMode;
  onModeChange: (mode: MobileExploreMode) => void;

  // Data
  listings: Listing[];
  totalCount?: number;
  isLoading: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;

  // Search & filters (shared)
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTypes: string[];
  selectedRegions: string[];
  selectedCountries: string[];
  selectedTags: string[];
  priceRange: [number, number];
  priceCurrency?: 'CLP' | 'UF';
  priceRangeMax?: number;
  areaRange: [number, number];
  onToggleType: (t: string) => void;
  onToggleRegion: (r: string) => void;
  onToggleCountry: (c: string) => void;
  onToggleTag: (t: string) => void;
  onPriceRangeChange: (r: [number, number]) => void;
  onAreaRangeChange: (r: [number, number]) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;

  // Valuation & topography
  selectedSlopes?: string[];
  onToggleSlope?: (s: string) => void;
  selectedValuation?: string[];
  onToggleValuation?: (v: string) => void;

  // Interaction
  hoveredListing?: Listing | null;
  selectedListing?: Listing | null;
  onListingHover?: (l: Listing | null) => void;
  onListingClick?: (l: Listing) => void;
  onListingPreview?: (l: Listing) => void;

  // Swipe callbacks
  onSwipeFavorite?: (l: Listing) => void;
  onSwipeDismiss?: (l: Listing) => void;
  onSwipeContact?: (l: Listing) => void;
  onSwipeAddToCompare?: (l: Listing) => void;
  onSwipeOpenCompare?: () => void;
  compareCount?: number;
  isInCompare?: (id: string) => boolean;
  onSwipeDeckChange?: (deck: Listing[] | null) => void;
  undoDismissRef?: React.MutableRefObject<((id: string) => void) | null>;
}

const MODES: { key: MobileExploreMode; label: string; icon: typeof CreditCard }[] = [
  { key: 'swipe', label: 'Swipe', icon: CreditCard },
  { key: 'list', label: 'Lista', icon: List },
  { key: 'map', label: 'Mapa', icon: MapIcon },
];

/**
 * Unified responsive Explorer container for mobile + tablet.
 * Alternates between Swipe / Lista / Mapa via a segmented control
 * so panels never overlap and no bottom-sheet overlay stays persistent.
 */
const MobileExploreView = (props: MobileExploreViewProps) => {
  const {
    mode,
    onModeChange,
    listings,
    isLoading,
    activeFiltersCount,
    onClearFilters,
    onListingClick,
    onListingPreview,
    hoveredListing,
    selectedListing,
    onListingHover,
    onSwipeFavorite,
    onSwipeDismiss,
    onSwipeContact,
    onSwipeAddToCompare,
    onSwipeOpenCompare,
    compareCount,
    isInCompare,
    onSwipeDeckChange,
    undoDismissRef,
  } = props;

  const navigate = useNavigate();
  const [showSearchOnMap, setShowSearchOnMap] = useState(false);

  const handleMapListingClick = useCallback(
    (listing: Listing) => {
      onListingClick?.(listing);
      onListingPreview?.(listing);
    },
    [onListingClick, onListingPreview],
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Segmented control — sticky under global header */}
      <div className="sticky top-header z-sticky bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="px-3 py-2 flex items-center gap-2">
          <div
            role="tablist"
            aria-label="Modo de exploración"
            className="flex-1 grid grid-cols-3 gap-1 p-1 rounded-xl bg-muted/60 border border-border/40"
          >
            {MODES.map((m) => {
              const active = mode === m.key;
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => onModeChange(m.key)}
                  className={cn(
                    'inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-medium transition-all',
                    active
                      ? 'bg-background text-foreground shadow-sm border border-border/50'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>
          {activeFiltersCount > 0 && (
            <span className="inline-flex h-9 items-center px-2.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold border border-primary/25">
              {activeFiltersCount}
            </span>
          )}
        </div>
      </div>

      {/* Panels — one at a time, no overlays */}
      <div className="flex-1 min-h-0 relative">
        {mode === 'swipe' && (
          <div className="absolute inset-0 flex flex-col">
            <SwipeExplorer
              listings={listings}
              onFavorite={onSwipeFavorite ?? (() => {})}
              onDismiss={onSwipeDismiss ?? (() => {})}
              onContact={onSwipeContact ?? ((l) => navigate(`/propiedad/${l.id}`))}
              onAddToCompare={onSwipeAddToCompare ?? (() => {})}
              onOpenCompare={onSwipeOpenCompare ?? (() => {})}
              compareCount={compareCount ?? 0}
              isInCompare={isInCompare ?? (() => false)}
              onBack={() => onModeChange('list')}
              onDeckChange={onSwipeDeckChange}
              undoDismissRef={undoDismissRef}
            />
          </div>
        )}

        {mode === 'list' && (
          <div className="absolute inset-0 flex flex-col min-h-0">
            <div className="flex-shrink-0">
              <ProjectsRail />
            </div>
            <div className="flex-1 min-h-0">
            <ExploreListPanel
              listings={props.listings}
              totalCount={props.totalCount}
              isLoading={props.isLoading}
              hasMore={props.hasMore}
              isLoadingMore={props.isLoadingMore}
              onLoadMore={props.onLoadMore}
              searchQuery={props.searchQuery}
              onSearchChange={props.onSearchChange}
              hoveredListing={hoveredListing}
              selectedListing={selectedListing}
              onListingHover={onListingHover}
              onListingClick={onListingClick}
              onListingPreview={onListingPreview}
              selectedTypes={props.selectedTypes}
              onToggleType={props.onToggleType}
              selectedRegions={props.selectedRegions}
              onToggleRegion={props.onToggleRegion}
              selectedCountries={props.selectedCountries}
              onToggleCountry={props.onToggleCountry}
              selectedTags={props.selectedTags}
              onToggleTag={props.onToggleTag}
              priceRange={props.priceRange}
              priceCurrency={props.priceCurrency}
              priceRangeMax={props.priceRangeMax}
              onPriceRangeChange={props.onPriceRangeChange}
              areaRange={props.areaRange}
              onAreaRangeChange={props.onAreaRangeChange}
              onClearFilters={onClearFilters}
              activeFiltersCount={activeFiltersCount}
              selectedSlopes={props.selectedSlopes}
              onToggleSlope={props.onToggleSlope}
              selectedValuation={props.selectedValuation}
              onToggleValuation={props.onToggleValuation}
            />
            </div>
          </div>
        )}

        {mode === 'map' && (
          <div className="absolute inset-0">
            <MapErrorBoundary>
              <EnhancedMap
                listings={listings}
                hoveredListing={hoveredListing}
                selectedListing={selectedListing}
                onListingHover={onListingHover}
                onListingClick={handleMapListingClick}
                className="h-full w-full"
                showDrawTools={false}
              />
            </MapErrorBoundary>

            {/* Compact search toggle */}
            {showSearchOnMap ? (
              <div className="absolute top-3 left-3 right-3 z-map-overlay animate-in fade-in slide-in-from-top-2">
                <FloatingSearchBar
                  searchQuery={props.searchQuery}
                  onSearchChange={props.onSearchChange}
                  onOpenFilters={() => onModeChange('list')}
                  activeFiltersCount={activeFiltersCount}
                  selectedTypes={props.selectedTypes}
                  selectedRegions={props.selectedRegions}
                  onRemoveType={props.onToggleType}
                  onRemoveRegion={props.onToggleRegion}
                />
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowSearchOnMap(true)}
                className="absolute top-3 left-3 z-map-overlay h-9 rounded-full shadow-md bg-background/95 backdrop-blur-xl border border-border/60"
              >
                Buscar aquí
              </Button>
            )}

            {/* "Ver lista" pill — single, non-persistent CTA to switch modes */}
            <div className="absolute inset-x-0 bottom-4 flex justify-center z-map-overlay pointer-events-none">
              <Button
                onClick={() => onModeChange('list')}
                className="pointer-events-auto h-11 px-5 rounded-full shadow-xl gap-2 animate-in fade-in slide-in-from-bottom-2"
              >
                <ArrowUp className="h-4 w-4" />
                Ver {isLoading ? '…' : listings.length} terreno{listings.length === 1 ? '' : 's'}
              </Button>
            </div>

            {/* Empty state chip */}
            {!isLoading && listings.length === 0 && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-map-overlay w-[92%] max-w-[340px] rounded-2xl border border-border/40 bg-background/95 backdrop-blur-xl p-4 shadow-lg text-center">
                <Layers className="h-6 w-6 mx-auto mb-2 text-muted-foreground/60" />
                <h4 className="text-sm font-semibold mb-1">Sin resultados en esta zona</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Ajusta los filtros o mueve el mapa para encontrar terrenos.
                </p>
                <div className="flex gap-2 justify-center">
                  {activeFiltersCount > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onClearFilters}
                      className="rounded-xl"
                    >
                      Limpiar filtros
                    </Button>
                  )}
                  <Button size="sm" onClick={() => onModeChange('list')} className="rounded-xl">
                    Ver lista
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileExploreView;
