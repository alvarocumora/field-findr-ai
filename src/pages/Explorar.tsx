import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StickyHeader from '@/components/navigation/StickyHeader';
import PublicLayout from '@/components/layouts/PublicLayout';
import EnhancedMap from '@/components/map/EnhancedMap';
import MapErrorBoundary from '@/components/map/MapErrorBoundary';
import MobileExploreView from '@/components/explore/MobileExploreView';
import ExploreListPanel from '@/components/explore/ExploreListPanel';
import PropertyPreviewSheet from '@/components/explore/PropertyPreviewSheet';
import EnhancedAISearch from '@/components/ai/EnhancedAISearch';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useListings, Listing } from '@/hooks/useListings';
import { useIsMobile } from '@/hooks/use-mobile';

const Explorar = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showAISearch, setShowAISearch] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  // Filters state
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000000]);
  const [areaRange, setAreaRange] = useState<[number, number]>([0, 1000000]);

  // Listing interaction state
  const [hoveredListing, setHoveredListing] = useState<Listing | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [previewListing, setPreviewListing] = useState<Listing | null>(null);

  // Data fetching
  const { data: listings = [], isLoading } = useListings({
    type: selectedTypes.length > 0 ? selectedTypes : undefined,
    region: selectedRegions.length > 0 ? selectedRegions : undefined,
    country: selectedCountries.length > 0 ? selectedCountries : undefined,
    priceMin: priceRange[0] > 0 ? priceRange[0] : undefined,
    priceMax: priceRange[1] < 5000000000 ? priceRange[1] : undefined,
    areaMin: areaRange[0] > 0 ? areaRange[0] : undefined,
    areaMax: areaRange[1] < 1000000 ? areaRange[1] : undefined,
  });

  // Filter by search query and tags locally
  const filteredListings = useMemo(() => {
    let result = [...listings];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        l => l.title.toLowerCase().includes(query) ||
             l.location.toLowerCase().includes(query) ||
             l.region?.toLowerCase().includes(query) ||
             l.city?.toLowerCase().includes(query)
      );
    }
    if (selectedTags.length > 0) {
      result = result.filter(l => selectedTags.some(tag => l.tags.includes(tag)));
    }
    return result;
  }, [listings, searchQuery, selectedTags]);

  const activeFiltersCount = selectedTypes.length + selectedRegions.length + selectedCountries.length + selectedTags.length +
    (priceRange[0] > 0 || priceRange[1] < 5000000000 ? 1 : 0) +
    (areaRange[0] > 0 || areaRange[1] < 1000000 ? 1 : 0);

  // Filter handlers
  const clearFilters = useCallback(() => {
    setSelectedTypes([]); setSelectedRegions([]); setSelectedCountries([]);
    setSelectedTags([]); setPriceRange([0, 5000000000]); setAreaRange([0, 1000000]);
    setSearchQuery('');
  }, []);

  const toggleType = useCallback((type: string) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  }, []);
  const toggleRegion = useCallback((region: string) => {
    setSelectedRegions(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]);
  }, []);
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }, []);
  const toggleCountry = useCallback((country: string) => {
    setSelectedCountries(prev => prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]);
  }, []);

  // AI search
  const handleAIFilters = useCallback((filters: {
    types?: string[]; regions?: string[]; priceRange?: [number, number]; areaRange?: [number, number]; tags?: string[];
  }) => {
    if (filters.types?.length) setSelectedTypes(filters.types);
    if (filters.regions?.length) setSelectedRegions(filters.regions);
    if (filters.priceRange) setPriceRange(filters.priceRange);
    if (filters.areaRange) setAreaRange(filters.areaRange);
    if (filters.tags?.length) setSelectedTags(filters.tags);
    setShowAISearch(false);
  }, []);

  // Listing interaction handlers
  const handleListingClick = useCallback((listing: Listing) => {
    setSelectedListing(listing);
    // Map will easeTo this listing via selectedListing prop
  }, []);

  const handleListingPreview = useCallback((listing: Listing) => {
    setPreviewListing(listing);
  }, []);

  const handleViewDetails = useCallback((listing: Listing) => {
    navigate(`/propiedad/${listing.id}`);
  }, [navigate]);

  const similarListings = useMemo(() => {
    if (!previewListing) return [];
    return filteredListings.filter(l => l.id !== previewListing.id && l.type === previewListing.type).slice(0, 3);
  }, [previewListing, filteredListings]);

  // Mobile view
  if (isMobile) {
    return (
      <PublicLayout showFooter={false}>
        <MobileExploreView
          listings={filteredListings}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTypes={selectedTypes}
          selectedRegions={selectedRegions}
          selectedTags={selectedTags}
          priceRange={priceRange}
          areaRange={areaRange}
          onToggleType={toggleType}
          onToggleRegion={toggleRegion}
          onToggleTag={toggleTag}
          onPriceRangeChange={setPriceRange}
          onAreaRangeChange={setAreaRange}
          onClearFilters={clearFilters}
          activeFiltersCount={activeFiltersCount}
        />
      </PublicLayout>
    );
  }

  // Desktop: Split-View Layout
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="noise-overlay" />
      <StickyHeader />

      {/* AI Search overlay */}
      {showAISearch && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/30 p-4">
          <div className="max-w-2xl mx-auto">
            <EnhancedAISearch onApplyFilters={handleAIFilters} className="w-full" />
          </div>
        </div>
      )}

      {/* Split-View: Map + List */}
      <main className="flex-1 pt-16 h-[calc(100vh)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Map Panel */}
          <ResizablePanel defaultSize={62} minSize={45} maxSize={80}>
            <div className="h-full relative">
              <MapErrorBoundary>
                <EnhancedMap
                  listings={filteredListings}
                  hoveredListing={hoveredListing}
                  selectedListing={selectedListing}
                  onListingHover={setHoveredListing}
                  onListingClick={handleListingPreview}
                  className="w-full h-full"
                  key="enhanced-map"
                />
              </MapErrorBoundary>
            </div>
          </ResizablePanel>

          {/* Resize Handle */}
          <ResizableHandle withHandle />

          {/* List Panel */}
          <ResizablePanel defaultSize={38} minSize={20} maxSize={55}>
            <ExploreListPanel
              listings={filteredListings}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              hoveredListing={hoveredListing}
              selectedListing={selectedListing}
              onListingHover={setHoveredListing}
              onListingClick={handleListingClick}
              onListingPreview={handleListingPreview}
              selectedTypes={selectedTypes}
              onToggleType={toggleType}
              selectedRegions={selectedRegions}
              onToggleRegion={toggleRegion}
              selectedCountries={selectedCountries}
              onToggleCountry={toggleCountry}
              selectedTags={selectedTags}
              onToggleTag={toggleTag}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              areaRange={areaRange}
              onAreaRangeChange={setAreaRange}
              onClearFilters={clearFilters}
              activeFiltersCount={activeFiltersCount}
              showAISearch={showAISearch}
              onToggleAISearch={() => setShowAISearch(!showAISearch)}
            />
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Property Preview Sheet */}
        <PropertyPreviewSheet
          listing={previewListing}
          open={!!previewListing}
          onOpenChange={(open) => !open && setPreviewListing(null)}
          onViewDetails={handleViewDetails}
          similarListings={similarListings}
        />
      </main>
    </div>
  );
};

export default Explorar;
