import { useState, useCallback } from 'react';
import EnhancedMap, { MapBoundsData } from '@/components/map/EnhancedMap';
import MapErrorBoundary from '@/components/map/MapErrorBoundary';
import SearchAreaButton from './SearchAreaButton';
import { Listing } from '@/hooks/useListings';
import { cn } from '@/lib/utils';

export type { MapBoundsData as MapBounds };

interface ExploreMapPanelProps {
  listings: Listing[];
  hoveredListing: Listing | null;
  selectedListing: Listing | null;
  onListingHover: (listing: Listing | null) => void;
  onListingClick: (listing: Listing) => void;
  onBoundsSearch?: (bounds: MapBoundsData) => void;
  className?: string;
}

const ExploreMapPanel = ({
  listings,
  hoveredListing,
  selectedListing,
  onListingHover,
  onListingClick,
  onBoundsSearch,
  className,
}: ExploreMapPanelProps) => {
  const [currentBounds, setCurrentBounds] = useState<MapBoundsData | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleBoundsChange = useCallback((bounds: MapBoundsData) => {
    setCurrentBounds(bounds);
  }, []);

  const handleSearchArea = useCallback((bounds: MapBoundsData) => {
    setIsSearching(true);
    onBoundsSearch?.(bounds);
    setTimeout(() => setIsSearching(false), 500);
  }, [onBoundsSearch]);

  return (
    <div className={cn('relative h-full w-full', className)}>
      <MapErrorBoundary>
        <EnhancedMap
          listings={listings}
          hoveredListing={hoveredListing}
          selectedListing={selectedListing}
          onListingHover={onListingHover}
          onListingClick={onListingClick}
          onBoundsChange={handleBoundsChange}
          className="h-full w-full"
          showDrawTools={false}
        />
      </MapErrorBoundary>

      {/* Search in this area button */}
      {onBoundsSearch && (
        <SearchAreaButton
          bounds={currentBounds}
          onSearchArea={handleSearchArea}
          isSearching={isSearching}
        />
      )}
    </div>
  );
};

export default ExploreMapPanel;
