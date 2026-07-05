import { useState, useMemo, useCallback, useRef, useDeferredValue, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import StickyHeader from '@/components/navigation/StickyHeader';
import ExploreListPanel from '@/components/explore/ExploreListPanel';
import ExploreMapPanel, { MapBounds } from '@/components/explore/ExploreMapPanel';
import MobileExploreView from '@/components/explore/MobileExploreView';
import PropertyPreviewSheet from '@/components/explore/PropertyPreviewSheet';
import EnhancedAISearch from '@/components/ai/EnhancedAISearch';
import CompareFloatingBar from '@/components/compare/CompareFloatingBar';
import CompareSheet from '@/components/compare/CompareSheet';
import CinematicTransition from '@/components/map/CinematicTransition';
import SwipeExplorer from '@/components/explore/SwipeExplorer';
import { Button } from '@/components/ui/button';
import { Listing, getPricePerM2 } from '@/hooks/useListings';
import { useFlattenedListings } from '@/hooks/useInfiniteListings';
import { useIsMobile } from '@/hooks/use-mobile';
import { Layers, CreditCard } from 'lucide-react';
import RealListingsSection from '@/components/RealListingsSection';
import { useAddFavorite } from '@/hooks/useFavorites';
import { useTrackEvent } from '@/hooks/useTrackEvent';

const Explorar = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const addFavorite = useAddFavorite();
  const { track } = useTrackEvent();

  // View mode for mobile
  const [mobileViewMode, setMobileViewMode] = useState<'swipe' | 'list' | 'map'>('swipe');
  // Desktop: overlay swipe mode
  const [desktopSwipe, setDesktopSwipe] = useState(false);

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

  // Map bounds for spatial filtering
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);

  // Listing interaction
  const [hoveredListing, setHoveredListing] = useState<Listing | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [previewListing, setPreviewListing] = useState<Listing | null>(null);

  // Valuation & topography filters
  const [selectedSlopes, setSelectedSlopes] = useState<string[]>([]);
  const [selectedValuation, setSelectedValuation] = useState<string[]>([]);

  // Cinematic 3D transition
  const [cinematicLot, setCinematicLot] = useState<any>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);

  // Data — infinite pagination with cursor
  const {
    listings,
    totalCount,
    isLoading,
    hasMore,
    loadMore,
    isLoadingMore,
  } = useFlattenedListings({
    type: selectedTypes.length > 0 ? selectedTypes : undefined,
    region: selectedRegions.length > 0 ? selectedRegions : undefined,
    country: selectedCountries.length > 0 ? selectedCountries : undefined,
    priceMin: priceRange[0] > 0 ? priceRange[0] : undefined,
    priceMax: priceRange[1] < 5000000000 ? priceRange[1] : undefined,
    areaMin: areaRange[0] > 0 ? areaRange[0] : undefined,
    areaMax: areaRange[1] < 1000000 ? areaRange[1] : undefined,
    bounds: mapBounds ?? undefined,
  });

  // Client-side search + tag/slope/valuation filter
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
    // Slope filter — matches tag conventions (plano/suave/fuerte or topografia-*)
    if (selectedSlopes.length > 0) {
      const slopeSynonyms: Record<string, string[]> = {
        flat: ['plano', 'topografia-plana', 'pendiente-plana', 'slope-flat'],
        slight: ['suave', 'topografia-suave', 'pendiente-suave', 'slope-slight'],
        steep: ['fuerte', 'topografia-fuerte', 'pendiente-fuerte', 'slope-steep'],
      };
      result = result.filter(l =>
        selectedSlopes.some(s => (slopeSynonyms[s] || [s]).some(tag => l.tags.includes(tag)))
      );
    }
    // Valuation / plusvalía filter — matches plusvalia-* or valuation-* tags
    if (selectedValuation.length > 0) {
      const valSynonyms: Record<string, string[]> = {
        low: ['plusvalia-baja', 'valuation-low'],
        medium: ['plusvalia-media', 'valuation-medium'],
        high: ['plusvalia-alta', 'valuation-high'],
      };
      result = result.filter(l =>
        selectedValuation.some(v => (valSynonyms[v] || [v]).some(tag => l.tags.includes(tag)))
      );
    }
    return result;
  }, [listings, searchQuery, selectedTags, selectedSlopes, selectedValuation]);

  // Progressive rendering: defer the heavy map listings so filter updates stay responsive
  const deferredMapListings = useDeferredValue(filteredListings);

  const activeFiltersCount = selectedTypes.length + selectedRegions.length + selectedCountries.length + selectedTags.length +
    selectedSlopes.length + selectedValuation.length +
    (priceRange[0] > 0 || priceRange[1] < 5000000000 ? 1 : 0) +
    (areaRange[0] > 0 || areaRange[1] < 1000000 ? 1 : 0);

  // Handlers
  const clearFilters = useCallback(() => {
    setSelectedTypes([]); setSelectedRegions([]); setSelectedCountries([]);
    setSelectedTags([]); setPriceRange([0, 5000000000]); setAreaRange([0, 1000000]);
    setSearchQuery(''); setMapBounds(null);
    setSelectedSlopes([]); setSelectedValuation([]);
  }, []);

  const toggleSlope = useCallback((slope: string) => {
    setSelectedSlopes(prev => prev.includes(slope) ? prev.filter(s => s !== slope) : [...prev, slope]);
  }, []);
  const toggleValuation = useCallback((val: string) => {
    setSelectedValuation(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
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

  const handleBoundsSearch = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
  }, []);

  const similarListings = useMemo(() => {
    if (!previewListing) return [];
    return filteredListings.filter(l => l.id !== previewListing.id && l.type === previewListing.type).slice(0, 3);
  }, [previewListing, filteredListings]);

  // ── MOBILE VIEW ──
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-16">
        <StickyHeader />

        {/* Mobile view mode toggle */}
        <div className="flex items-center gap-2 px-4 py-2 border-b overflow-x-auto">
          <Button
            variant={mobileViewMode === 'swipe' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMobileViewMode('swipe')}
          >
            <CreditCard className="h-4 w-4 mr-1" />
            Swipe
          </Button>
          <Button
            variant={mobileViewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMobileViewMode('list')}
          >
            <Layers className="h-4 w-4 mr-1" />
            Lista
          </Button>
          <Button
            variant={mobileViewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMobileViewMode('map')}
          >
            <Layers className="h-4 w-4 mr-1" />
            Mapa
          </Button>
        </div>

        {mobileViewMode === 'swipe' ? (
          <div className="flex-1">
            <SwipeExplorer
              listings={filteredListings}
              onFavorite={(l) => { addFavorite.mutate(l.id); track('swipe_favorite', { listing_id: l.id }); }}
              onDismiss={(l) => { track('swipe_dismiss', { listing_id: l.id }); }}
              onContact={(l) => navigate(`/propiedad/${l.id}`)}
              onBack={() => setMobileViewMode('list')}
            />
          </div>
        ) : (
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
        )}

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

      {/* Split view: List (380px fixed) + Map (rest) */}
      <div className="flex-1 flex pt-16 min-h-0">
        {/* Left panel – scrollable list */}
        <div className="w-[420px] min-w-[380px] flex-shrink-0 border-r border-border/30">
          <ExploreListPanel
            listings={filteredListings}
            totalCount={totalCount}
            isLoading={isLoading}
            hasMore={!!hasMore}
            isLoadingMore={!!isLoadingMore}
            onLoadMore={() => loadMore()}
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
            selectedSlopes={selectedSlopes}
            onToggleSlope={toggleSlope}
            selectedValuation={selectedValuation}
            onToggleValuation={toggleValuation}
          />
        </div>

        {/* Right panel – map fills remaining space */}
        <div className="flex-1 min-w-0 relative">
          <ExploreMapPanel
            listings={deferredMapListings}
            hoveredListing={hoveredListing}
            selectedListing={selectedListing}
            onListingHover={setHoveredListing}
            onListingClick={handleListingClick}
            onBoundsSearch={handleBoundsSearch}
          />
        </div>
      </div>

      {/* ===== REAL LISTINGS — external LATAM portals ===== */}
      <RealListingsSection
        title="Terrenos de portales externos"
        subtitle="Agregamos avisos públicos de Portalinmobiliario, Mercado Libre y Yapo en tiempo real"
        limit={24}
      />

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

      {/* Desktop Swipe FAB */}
      <Button
        onClick={() => setDesktopSwipe(true)}
        className="fixed bottom-6 right-6 z-40 h-14 px-6 rounded-full shadow-2xl gap-2"
      >
        <CreditCard className="h-5 w-5" />
        Modo Swipe
      </Button>

      {/* Desktop Swipe Overlay */}
      {desktopSwipe && (
        <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl flex items-center justify-center">
          <div className="w-full max-w-md h-[90vh] max-h-[800px]">
            <SwipeExplorer
              listings={filteredListings}
              onFavorite={(l) => { addFavorite.mutate(l.id); track('swipe_favorite', { listing_id: l.id }); }}
              onDismiss={(l) => { track('swipe_dismiss', { listing_id: l.id }); }}
              onContact={(l) => { setDesktopSwipe(false); navigate(`/propiedad/${l.id}`); }}
              onBack={() => setDesktopSwipe(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Explorar;
