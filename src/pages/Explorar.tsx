import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StickyHeader from '@/components/navigation/StickyHeader';
import ExploreListPanel from '@/components/explore/ExploreListPanel';
import ExploreMapPanel from '@/components/explore/ExploreMapPanel';
import MobileExploreView from '@/components/explore/MobileExploreView';
import PropertyPreviewSheet from '@/components/explore/PropertyPreviewSheet';
import EnhancedAISearch from '@/components/ai/EnhancedAISearch';
import CompareFloatingBar from '@/components/compare/CompareFloatingBar';
import CompareSheet from '@/components/compare/CompareSheet';
import { useListings, Listing, getPricePerM2 } from '@/hooks/useListings';
import { useIsMobile } from '@/hooks/use-mobile';

const Explorar = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showAISearch, setShowAISearch] = useState(false);

  // Filters
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000000]);
  const [areaRange, setAreaRange] = useState<[number, number]>([0, 1000000]);

  // Listing interaction
  const [hoveredListing, setHoveredListing] = useState<Listing | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [previewListing, setPreviewListing] = useState<Listing | null>(null);

  // Data
  const { data: listings = [], isLoading } = useListings({
    type: selectedTypes.length > 0 ? selectedTypes : undefined,
    region: selectedRegions.length > 0 ? selectedRegions : undefined,
    country: selectedCountries.length > 0 ? selectedCountries : undefined,
    priceMin: priceRange[0] > 0 ? priceRange[0] : undefined,
    priceMax: priceRange[1] < 5000000000 ? priceRange[1] : undefined,
    areaMin: areaRange[0] > 0 ? areaRange[0] : undefined,
    areaMax: areaRange[1] < 1000000 ? areaRange[1] : undefined,
  });

  // Client-side search + tag filter
  const filteredListings = useMemo(() => {
    let result = [...listings];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        l => l.title.toLowerCase().includes(q) ||
             l.location.toLowerCase().includes(q) ||
             l.region?.toLowerCase().includes(q) ||
             l.city?.toLowerCase().includes(q)
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

  // Handlers
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

  const handleViewDetails = useCallback((listing: Listing) => {
    navigate(`/propiedad/${listing.id}`);
  }, [navigate]);

  const handleListingClick = useCallback((listing: Listing) => {
    setSelectedListing(listing);
    setPreviewListing(listing);
  }, []);

  const similarListings = useMemo(() => {
    if (!previewListing) return [];
    return filteredListings.filter(l => l.id !== previewListing.id && l.type === previewListing.type).slice(0, 3);
  }, [previewListing, filteredListings]);

  // ── MOBILE VIEW ──
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <StickyHeader />
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
        <PropertyPreviewSheet
          listing={previewListing}
          open={!!previewListing}
          onOpenChange={(open) => !open && setPreviewListing(null)}
          onViewDetails={handleViewDetails}
          similarListings={similarListings}
        />
        <CompareFloatingBar />
        <CompareSheet />
      </div>
    );
  }

  // ── DESKTOP SPLIT-VIEW ──
  return (
    <div className="h-screen flex flex-col bg-background">
      <StickyHeader />

      {/* AI Search overlay */}
      {showAISearch && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/30 p-4">
          <div className="max-w-2xl mx-auto">
            <EnhancedAISearch onApplyFilters={handleAIFilters} className="w-full" />
          </div>
        </div>
      )}

      {/* Split view: List (40%) + Map (60%) */}
      <div className="flex-1 flex pt-16 min-h-0">
        {/* Left panel – scrollable list with built-in search/filters */}
        <div className="w-[40%] min-w-[360px] max-w-[540px] border-r border-border/30">
          <ExploreListPanel
            listings={filteredListings}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            hoveredListing={hoveredListing}
            selectedListing={selectedListing}
            onListingHover={setHoveredListing}
            onListingClick={handleListingClick}
            onListingPreview={setPreviewListing}
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
        </div>

        {/* Right panel – map */}
        <div className="flex-1">
          <ExploreMapPanel
            listings={filteredListings}
            hoveredListing={hoveredListing}
            selectedListing={selectedListing}
            onListingHover={setHoveredListing}
            onListingClick={handleListingClick}
          />
        </div>
      </div>

      {/* Property Preview Sheet */}
      <PropertyPreviewSheet
        listing={previewListing}
        open={!!previewListing}
        onOpenChange={(open) => !open && setPreviewListing(null)}
        onViewDetails={handleViewDetails}
        similarListings={similarListings}
      />

      {/* Compare */}
      <CompareFloatingBar />
      <CompareSheet />
    </div>
  );
};

export default Explorar;
