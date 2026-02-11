import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import EnhancedMap from '@/components/map/EnhancedMap';
import MobileExploreView from '@/components/explore/MobileExploreView';
import FloatingResultsPanel from '@/components/explore/FloatingResultsPanel';
import PropertyPreviewSheet from '@/components/explore/PropertyPreviewSheet';
import FilterBar from '@/components/explore/FilterBar';
import EnhancedAISearch from '@/components/ai/EnhancedAISearch';
import LocationSearchBar from '@/components/explore/LocationSearchBar';
import { useListings, Listing, getListingTypeLabel } from '@/hooks/useListings';
import { useMatchScore } from '@/hooks/useMatchScore';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

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

  // Match scoring
  const { getMatchForListing } = useMatchScore(listings);

  // Filter by search query and tags locally
  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        l => l.title.toLowerCase().includes(query) ||
             l.location.toLowerCase().includes(query) ||
             l.region?.toLowerCase().includes(query) ||
             l.city?.toLowerCase().includes(query)
      );
    }

    // Tags filter
    if (selectedTags.length > 0) {
      result = result.filter(l => 
        selectedTags.some(tag => l.tags.includes(tag))
      );
    }

    return result;
  }, [listings, searchQuery, selectedTags]);

  // Calculate active filters count
  const activeFiltersCount = selectedTypes.length + selectedRegions.length + selectedCountries.length + selectedTags.length +
    (priceRange[0] > 0 || priceRange[1] < 5000000000 ? 1 : 0) +
    (areaRange[0] > 0 || areaRange[1] < 1000000 ? 1 : 0);
    (areaRange[0] > 0 || areaRange[1] < 1000000 ? 1 : 0);

  // Filter handlers
  const clearFilters = useCallback(() => {
    setSelectedTypes([]);
    setSelectedRegions([]);
    setSelectedCountries([]);
    setSelectedTags([]);
    setPriceRange([0, 5000000000]);
    setAreaRange([0, 1000000]);
    setSearchQuery('');
  }, []);

  const toggleType = useCallback((type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }, []);

  const toggleRegion = useCallback((region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  const toggleCountry = useCallback((country: string) => {
    setSelectedCountries(prev => 
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    );
  }, []);

  // Location search handler
  const handleLocationSelect = useCallback((location: { 
    name: string; 
    center: [number, number]; 
  }) => {
    setMapCenter(location.center);
    setSearchQuery(location.name);
  }, []);

  // AI search filter application
  const handleAIFilters = useCallback((filters: {
    types?: string[];
    regions?: string[];
    priceRange?: [number, number];
    areaRange?: [number, number];
    tags?: string[];
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
    // Fly to listing on map will be handled by EnhancedMap
  }, []);

  const handleListingPreview = useCallback((listing: Listing) => {
    setPreviewListing(listing);
  }, []);

  const handleViewDetails = useCallback((listing: Listing) => {
    navigate(`/propiedad/${listing.id}`);
  }, [navigate]);

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

  // Desktop: Map-centric unified view
  return (
    <PublicLayout showFooter={false}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Search Header */}
        <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30">
          <div className="container px-4 py-3">
            {/* AI Search Panel */}
            {showAISearch && (
              <div className="mb-3">
                <EnhancedAISearch
                  onApplyFilters={handleAIFilters}
                  className="w-full"
                />
              </div>
            )}
            
            <div className="flex items-center gap-3">
              {/* Location Search */}
              <div className="flex-1 max-w-md">
                <LocationSearchBar
                  onLocationSelect={handleLocationSelect}
                  onAISearch={(query) => {
                    setSearchQuery(query);
                    setShowAISearch(true);
                  }}
                  className="w-full"
                />
              </div>

              {/* AI Toggle */}
              <Button
                variant={showAISearch ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowAISearch(!showAISearch)}
                className="h-10 px-4 rounded-xl gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Búsqueda IA</span>
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <FilterBar
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
          />
        </div>

        {/* Main Content: Full-width Map with Floating Panel */}
        <div className="flex-1 relative">
          {/* Full-width Map */}
          <div className="absolute inset-0">
            <EnhancedMap 
              listings={filteredListings}
              hoveredListing={hoveredListing}
              onListingHover={setHoveredListing}
              onListingClick={handleListingPreview}
              className="w-full h-full"
              key="enhanced-map"
            />
          </div>

          {/* Floating Results Panel */}
          <FloatingResultsPanel
            listings={filteredListings}
            isLoading={isLoading}
            totalCount={filteredListings.length}
            hoveredListing={hoveredListing}
            selectedListing={selectedListing}
            onListingHover={setHoveredListing}
            onListingClick={handleListingClick}
            onListingPreview={handleListingPreview}
          />

          {/* Property Preview Sheet */}
          <PropertyPreviewSheet
            listing={previewListing}
            open={!!previewListing}
            onOpenChange={(open) => !open && setPreviewListing(null)}
            onViewDetails={handleViewDetails}
          />
        </div>
      </div>
    </PublicLayout>
  );
};

export default Explorar;
