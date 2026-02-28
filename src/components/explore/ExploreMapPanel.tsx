import { useState, useCallback, useRef, useEffect } from 'react';
import EnhancedMap from '@/components/map/EnhancedMap';
import MapErrorBoundary from '@/components/map/MapErrorBoundary';
import SearchAreaButton from './SearchAreaButton';
import { Listing } from '@/hooks/useListings';
import { cn } from '@/lib/utils';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface ExploreMapPanelProps {
  listings: Listing[];
  hoveredListing: Listing | null;
  selectedListing: Listing | null;
  onListingHover: (listing: Listing | null) => void;
  onListingClick: (listing: Listing) => void;
  onBoundsSearch?: (bounds: MapBounds) => void;
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
  const [currentBounds, setCurrentBounds] = useState<MapBounds | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const boundsTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Listen for map move events to update bounds
  // We'll detect bounds changes via a MutationObserver on the map container
  // For now, use a polling approach on the map instance
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const handleSearchArea = useCallback((bounds: MapBounds) => {
    setIsSearching(true);
    onBoundsSearch?.(bounds);
    // Reset searching state after a brief delay
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
