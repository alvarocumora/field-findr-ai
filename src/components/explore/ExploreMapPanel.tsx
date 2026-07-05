import { useState, useCallback } from 'react';
import EnhancedMap, { MapBoundsData } from '@/components/map/EnhancedMap';
import MapErrorBoundary from '@/components/map/MapErrorBoundary';
import SearchAreaButton from './SearchAreaButton';
import MapLegend from '@/components/map/MapLegend';
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
  /** Draw-to-search: emits the drawn polygon ([lng,lat][]) or null when cleared. */
  onPolygonSearch?: (polygon: number[][] | null) => void;
  className?: string;
}

const ExploreMapPanel = ({
  listings,
  hoveredListing,
  selectedListing,
  onListingHover,
  onListingClick,
  onBoundsSearch,
  onPolygonSearch,
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
          onPolygonDrawn={onPolygonSearch ? (polygon) => onPolygonSearch(polygon) : undefined}
          onPolygonCleared={onPolygonSearch ? () => onPolygonSearch(null) : undefined}
          className="h-full w-full"
          showDrawTools={!!onPolygonSearch}
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

      {/* Legend — marker colors match useMapMarkers typeColors */}
      <MapLegend
        className="absolute bottom-24 left-3 z-10 hidden md:flex"
        listingsCount={listings.length}
        statusConfig={{
          parcela_rural: { color: '#22c55e', label: 'Parcela' },
          campo_agricola: { color: '#84cc16', label: 'Agrícola' },
          terreno_urbano: { color: '#3b82f6', label: 'Urbano' },
          sitio_industrial: { color: '#f59e0b', label: 'Industrial' },
          terreno_costero: { color: '#06b6d4', label: 'Costero' },
        }}
        compact
      />
    </div>
  );
};

export default ExploreMapPanel;
