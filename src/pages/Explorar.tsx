import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import StickyHeader from '@/components/navigation/StickyHeader';
import FilterBar from '@/components/explore/FilterBar';
import ExploreToolbar, { SortOption, TabFilter } from '@/components/explore/ExploreToolbar';
import ExploreGrid from '@/components/explore/ExploreGrid';
import MapDialog from '@/components/explore/MapDialog';
import PropertyPreviewSheet from '@/components/explore/PropertyPreviewSheet';
import EnhancedAISearch from '@/components/ai/EnhancedAISearch';
import { Input } from '@/components/ui/input';
import { useListings, Listing, getPricePerM2 } from '@/hooks/useListings';

const Explorar = () => {
  const navigate = useNavigate();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showAISearch, setShowAISearch] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Filters
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000000]);
  const [areaRange, setAreaRange] = useState<[number, number]>([0, 1000000]);

  // Toolbar state
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

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

  // Filter, tab, and sort
  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        l => l.title.toLowerCase().includes(q) ||
             l.location.toLowerCase().includes(q) ||
             l.region?.toLowerCase().includes(q) ||
             l.city?.toLowerCase().includes(q)
      );
    }

    // Tags
    if (selectedTags.length > 0) {
      result = result.filter(l => selectedTags.some(tag => l.tags.includes(tag)));
    }

    // Tab filter
    if (activeTab === 'featured') {
      result = result.filter(l => l.featured);
    } else if (activeTab === 'best_price') {
      result = result.filter(l => l.area_m2 && l.area_m2 > 0);
    }

    // Sort
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'area_desc':
        result.sort((a, b) => (b.area_m2 || 0) - (a.area_m2 || 0));
        break;
      case 'price_m2':
        result.sort((a, b) => {
          const aP = getPricePerM2(a.price, a.area_m2) ?? Infinity;
          const bP = getPricePerM2(b.price, b.area_m2) ?? Infinity;
          return aP - bP;
        });
        break;
      default: // recent — already sorted by API
        break;
    }

    return result;
  }, [listings, searchQuery, selectedTags, activeTab, sortBy]);

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

  const similarListings = useMemo(() => {
    if (!previewListing) return [];
    return filteredListings.filter(l => l.id !== previewListing.id && l.type === previewListing.type).slice(0, 3);
  }, [previewListing, filteredListings]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StickyHeader />

      {/* AI Search overlay */}
      {showAISearch && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/30 p-4">
          <div className="max-w-2xl mx-auto">
            <EnhancedAISearch onApplyFilters={handleAIFilters} className="w-full" />
          </div>
        </div>
      )}

      <main className="flex-1 pt-16">
        {/* Search bar */}
        <div className="border-b border-border/30 bg-background/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por ubicación, nombre o región..."
                className="pl-10 h-10 rounded-xl bg-muted/30 border-border/50"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
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
          showAISearch={showAISearch}
          onToggleAISearch={() => setShowAISearch(!showAISearch)}
        />

        {/* Toolbar + Grid */}
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <ExploreToolbar
            listings={filteredListings}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onOpenMap={() => setShowMap(true)}
          />

          <ExploreGrid
            listings={filteredListings}
            isLoading={isLoading}
            hoveredListing={hoveredListing}
            selectedListing={selectedListing}
            onHover={setHoveredListing}
            onPreview={setPreviewListing}
          />
        </div>
      </main>

      {/* Map Dialog */}
      <MapDialog
        open={showMap}
        onOpenChange={setShowMap}
        listings={filteredListings}
        onListingClick={setPreviewListing}
      />

      {/* Property Preview Sheet */}
      <PropertyPreviewSheet
        listing={previewListing}
        open={!!previewListing}
        onOpenChange={(open) => !open && setPreviewListing(null)}
        onViewDetails={handleViewDetails}
        similarListings={similarListings}
      />
    </div>
  );
};

export default Explorar;
