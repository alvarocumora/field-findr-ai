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
