import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EnhancedMap from '@/components/map/EnhancedMap';
import MapErrorBoundary from '@/components/map/MapErrorBoundary';
import FloatingSearchBar from './FloatingSearchBar';
import ExploreBottomSheet from './ExploreBottomSheet';
import MobileFilterSheet from './MobileFilterSheet';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { Listing } from '@/hooks/useListings';


interface MobileExploreViewProps {
  listings: Listing[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTypes: string[];
  selectedRegions: string[];
  selectedTags: string[];
  priceRange: [number, number];
  areaRange: [number, number];
  onToggleType: (type: string) => void;
  onToggleRegion: (region: string) => void;
  onToggleTag: (tag: string) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onAreaRangeChange: (range: [number, number]) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const MobileExploreView = ({
  listings,
  isLoading,
  searchQuery,
  onSearchChange,
  selectedTypes,
  selectedRegions,
  selectedTags,
  priceRange,
  areaRange,
  onToggleType,
  onToggleRegion,
  onToggleTag,
  onPriceRangeChange,
  onAreaRangeChange,
  onClearFilters,
  activeFiltersCount,
}: MobileExploreViewProps) => {
  const navigate = useNavigate();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [bottomSheetSnap, setBottomSheetSnap] = useState(0.12);
  const [hoveredListing, setHoveredListing] = useState<Listing | null>(null);

  // Handle listing selection from bottom sheet
  const handleSelectListing = useCallback((listing: Listing | null) => {
    setSelectedListing(listing);
    setHoveredListing(listing);
  }, []);

  // Handle listing click from map
  const handleMapListingClick = useCallback((listing: Listing) => {
    setSelectedListing(listing);
    // Expand bottom sheet to show the selected item
    if (bottomSheetSnap < 0.5) {
      setBottomSheetSnap(0.5);
    }
  }, [bottomSheetSnap]);

  // Navigate to property detail
  const handleNavigateToDetail = useCallback((listing: Listing) => {
    navigate(`/propiedad/${listing.id}`);
  }, [navigate]);

  // Remove type filter
  const handleRemoveType = useCallback((type: string) => {
    onToggleType(type);
  }, [onToggleType]);

  // Remove region filter
  const handleRemoveRegion = useCallback((region: string) => {
    onToggleRegion(region);
  }, [onToggleRegion]);

  return (
    <div className="fixed inset-0 top-16 bg-background">
      {/* Fullscreen Map */}
      <div className="absolute inset-0">
        <MapErrorBoundary>
          <EnhancedMap
            listings={listings}
            hoveredListing={hoveredListing}
            selectedListing={selectedListing}
            onListingHover={setHoveredListing}
            onListingClick={handleMapListingClick}
            className="h-full w-full"
            showDrawTools={false}
          />
        </MapErrorBoundary>
      </div>

      {/* Floating Search Bar */}
      <FloatingSearchBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onOpenFilters={() => setIsFiltersOpen(true)}
        activeFiltersCount={activeFiltersCount}
        selectedTypes={selectedTypes}
        selectedRegions={selectedRegions}
        onRemoveType={handleRemoveType}
        onRemoveRegion={handleRemoveRegion}
      />

      {/* Bottom Sheet with Results */}
      <ExploreBottomSheet
        listings={listings}
        isLoading={isLoading}
        selectedListing={selectedListing}
        onSelectListing={handleSelectListing}
        onNavigateToDetail={handleNavigateToDetail}
        snapPoint={bottomSheetSnap}
        onSnapPointChange={setBottomSheetSnap}
      />

      {/* Empty state overlay when no results and not loading */}
      {!isLoading && listings.length === 0 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 max-w-[92%] w-[340px] bg-background/95 backdrop-blur-xl border border-border/40 rounded-2xl p-4 shadow-lg text-center animate-fade-in">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-2">
            <MapPin className="h-6 w-6 text-muted-foreground/60" />
          </div>
          <h4 className="text-sm font-semibold mb-1">Sin resultados en esta zona</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Ajusta filtros o mueve el mapa para encontrar terrenos.
          </p>
          <div className="flex gap-2 justify-center">
            {activeFiltersCount > 0 && (
              <Button size="sm" variant="outline" onClick={onClearFilters} className="rounded-xl">
                Limpiar filtros
              </Button>
            )}
            <Button size="sm" onClick={() => navigate('/explorar')} className="rounded-xl">
              Ver todas
            </Button>
          </div>
        </div>
      )}


      {/* Filters Sheet */}
      <MobileFilterSheet
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        selectedTypes={selectedTypes}
        selectedRegions={selectedRegions}
        selectedTags={selectedTags}
        priceRange={priceRange}
        areaRange={areaRange}
        onToggleType={onToggleType}
        onToggleRegion={onToggleRegion}
        onToggleTag={onToggleTag}
        onPriceRangeChange={onPriceRangeChange}
        onAreaRangeChange={onAreaRangeChange}
        onClearFilters={onClearFilters}
        activeFiltersCount={activeFiltersCount}
        resultsCount={listings.length}
      />
    </div>
  );
};

export default MobileExploreView;
