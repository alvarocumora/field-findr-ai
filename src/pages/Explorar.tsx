import { useState, useMemo, useCallback, useRef, useDeferredValue, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StickyHeader from '@/components/navigation/StickyHeader';
import ExploreListPanel from '@/components/explore/ExploreListPanel';
import ExploreMapPanel, { MapBounds } from '@/components/explore/ExploreMapPanel';
import MobileExploreView from '@/components/explore/MobileExploreView';
import PropertyPreviewSheet from '@/components/explore/PropertyPreviewSheet';
import ProjectsRail from '@/components/explore/ProjectsRail';
import LifestyleChips from '@/components/explore/LifestyleChips';
import EnhancedAISearch from '@/components/ai/EnhancedAISearch';
import CompareFloatingBar from '@/components/compare/CompareFloatingBar';
import CompareSheet from '@/components/compare/CompareSheet';
import CinematicTransition from '@/components/map/CinematicTransition';
import SwipeExplorer from '@/components/explore/SwipeExplorer';
import { Button } from '@/components/ui/button';
import { Listing, getPricePerM2, useListing } from '@/hooks/useListings';
import { useFlattenedListings } from '@/hooks/useInfiniteListings';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsTabletOrBelow } from '@/hooks/use-tablet';
import { CreditCard } from 'lucide-react';
import { useAddFavorite, useRemoveFavorite } from '@/hooks/useFavorites';
import { useTrackEvent } from '@/hooks/useTrackEvent';
import { useCompare } from '@/hooks/useCompare';
import { whatsapp } from '@/lib/whatsappUtils';
import { useIncludeLoteoLots } from '@/hooks/useIncludeLoteoLots';
import { toast } from 'sonner';

const Explorar = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isTabletOrBelow = useIsTabletOrBelow();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const { track } = useTrackEvent();
  const { addToCompare, compareList, isInCompare, setCompareOpen } = useCompare();
  // Imperative handle exposed by SwipeExplorer so we can revert a dismiss from an undo toast.
  const undoDismissRef = useRef<((id: string) => void) | null>(null);
  // Shared with ProjectsRail's toggle (desktop + mobile).
  const { include: includeLoteoLots } = useIncludeLoteoLots();


  // Initial state from URL (?q=... & ?view=map|list|swipe)
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const initialView = searchParams.get('view');
  const requestedListingId = searchParams.get('listing') ?? '';
  const { data: linkedListing } = useListing(requestedListingId);
  const openedLinkRef = useRef<string | null>(null);

  // View mode for mobile. Lista+mapa por defecto: quien busca comparar
  // ubicaciones rápido no quiere partir en modo tarjeta-por-tarjeta; swipe
  // sigue disponible explícitamente vía ?view=swipe o el toggle.
  const [mobileViewMode, setMobileViewMode] = useState<'swipe' | 'list' | 'map'>(
    initialView === 'map' || initialView === 'swipe' ? initialView : 'list',
  );
  // Desktop: overlay swipe mode
  const [desktopSwipe, setDesktopSwipe] = useState(false);
  // Deck emitted by SwipeExplorer (category + advanced filters). Null = no swipe sync.
  const [swipeDeck, setSwipeDeck] = useState<Listing[] | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [showAISearch, setShowAISearch] = useState(false);

  // Filters
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
    const t = searchParams.get('type');
    return t ? t.split(',').filter(Boolean) : [];
  });
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // Keep independent bounds by currency. Switching currencies never carries a CLP
  // number into a UF query or silently discards the previous selection.
  const [clpPriceRange, setClpPriceRange] = useState<[number, number]>([0, 5000000000]);
  const [ufPriceRange, setUfPriceRange] = useState<[number, number]>([0, 500000]);
  const [areaRange, setAreaRange] = useState<[number, number]>([0, 1000000]);

  // Map bounds for spatial filtering
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  // Draw-to-search: [lng,lat][] ring drawn on the map, or null.
  const [drawnPolygon, setDrawnPolygon] = useState<number[][] | null>(null);

  // Listing interaction
  const [hoveredListing, setHoveredListing] = useState<Listing | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [previewListing, setPreviewListing] = useState<Listing | null>(null);

  // Read the requested card directly: pagination and filters must not hide it.
  useEffect(() => {
    if (!requestedListingId) {
      openedLinkRef.current = null;
      return;
    }
    if (!linkedListing || openedLinkRef.current === requestedListingId) return;
    openedLinkRef.current = requestedListingId;
    setSelectedListing(linkedListing);
    setPreviewListing(linkedListing);
  }, [requestedListingId, linkedListing]);

  // Valuation & topography filters
  const [selectedSlopes, setSelectedSlopes] = useState<string[]>([]);
  const [selectedValuation, setSelectedValuation] = useState<string[]>([]);

  // Cinematic 3D transition
  const [cinematicLot, setCinematicLot] = useState<Parameters<typeof CinematicTransition>[0]['targetLot'] | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);

  // Data — infinite pagination with cursor. Text search runs server-side so
  // it covers the whole inventory, not only the pages already loaded.
  const deferredSearch = useDeferredValue(searchQuery);
  // Currency scope: CLP and UF are never mixed in a price range.
  const [currency, setCurrency] = useState<'all' | 'CLP' | 'UF'>(() => {
    const c = searchParams.get('currency');
    return c === 'CLP' || c === 'UF' ? c : 'all';
  });
  const priceRangeMax = currency === 'UF' ? 500000 : 5000000000;
  const priceRange = currency === 'UF' ? ufPriceRange : clpPriceRange;
  const setPriceRange = (next: [number, number]) => {
    if (currency === 'UF') setUfPriceRange(next);
    else setClpPriceRange(next);
  };
  const priceRangeActive = priceRange[0] > 0 || priceRange[1] < priceRangeMax;
  const effectiveCurrency = currency !== 'all' ? currency : priceRangeActive ? 'CLP' : undefined;

  // Keep q/type/currency in the URL without dropping ?listing or other params.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const set = (k: string, v?: string) => (v ? next.set(k, v) : next.delete(k));
    set('q', deferredSearch.trim() || undefined);
    set('type', selectedTypes.join(',') || undefined);
    set('currency', currency !== 'all' ? currency : undefined);
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch, selectedTypes, currency]);

  const currencySwitch = (
    <div className="flex items-center gap-2 px-3 pt-2 text-xs" role="group" aria-label="Moneda del precio">
      <span className="text-muted-foreground">Moneda:</span>
      {(['all', 'CLP', 'UF'] as const).map((c) => (
        <button key={c} type="button" aria-pressed={currency === c} onClick={() => setCurrency(c)}
          className={`rounded-full border px-2.5 py-1 font-medium focus-ring ${currency === c ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary'}`}>
          {c === 'all' ? 'Todas' : c}
        </button>
      ))}
      {currency === 'UF' && <span className="text-muted-foreground">Rango de precio en UF.</span>}
      {currency === 'all' && priceRangeActive && <span className="text-muted-foreground">Rango en CLP: solo publicaciones en CLP.</span>}
    </div>
  );
  const {
    listings,
    totalCount,
    isLoading,
    isFetching,
    isError,
    refetch,
    hasMore,
    loadMore,
    isLoadingMore,
  } = useFlattenedListings({
    type: selectedTypes.length > 0 ? selectedTypes : undefined,
    region: selectedRegions.length > 0 ? selectedRegions : undefined,
    country: selectedCountries.length > 0 ? selectedCountries : undefined,
    priceMin: priceRange[0] > 0 ? priceRange[0] : undefined,
    priceMax: priceRange[1] < priceRangeMax ? priceRange[1] : undefined,
    areaMin: areaRange[0] > 0 ? areaRange[0] : undefined,
    areaMax: areaRange[1] < 1000000 ? areaRange[1] : undefined,
    bounds: mapBounds ?? undefined,
    includeLoteoLots,
    currency: effectiveCurrency,
    search: deferredSearch || undefined,
  });

  const errorBanner = isError ? (
    <div role="alert" className="m-3 flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
      <span>No pudimos cargar el inventario. Esto es un error de conexión, no falta de terrenos.</span>
      <Button size="sm" variant="outline" onClick={() => refetch()}>Reintentar</Button>
    </div>
  ) : null;

  // Client-side tag/slope/valuation/polygon filter (text search is server-side)
  const filteredListings = useMemo(() => {
    let result = [...listings];
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
    // Draw-to-search: keep only listings inside the drawn polygon (ray casting)
    if (drawnPolygon && drawnPolygon.length >= 3) {
      const inside = (lng: number, lat: number) => {
        let ok = false;
        for (let i = 0, j = drawnPolygon.length - 1; i < drawnPolygon.length; j = i++) {
          const [xi, yi] = drawnPolygon[i];
          const [xj, yj] = drawnPolygon[j];
          if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) ok = !ok;
        }
        return ok;
      };
      result = result.filter(l => l.lat != null && l.lng != null && inside(Number(l.lng), Number(l.lat)));
    }
    // Orden por completitud: primero destacados, luego las publicaciones con
    // material completo (fotos, ubicación, precio, descripción) — no por antigüedad.
    const completeness = (l: Listing) =>
      (l.featured ? 100 : 0) +
      Math.min(((l.images?.length ?? 0) as number), 4) * 6 +
      (l.lat != null && l.lng != null ? 8 : 0) +
      (l.price ? 6 : 0) +
      (l.area_m2 ? 4 : 0) +
      ((l.description?.length ?? 0) > 120 ? 5 : 0) +
      Math.min((l.tags?.length ?? 0), 4) * 2;
    result.sort((a, b) => completeness(b) - completeness(a));
    return result;
  }, [listings, selectedTags, selectedSlopes, selectedValuation, drawnPolygon]);

  // Reset swipe-derived deck whenever upstream filters or listings change,
  // so it doesn't shadow the map with a stale subset.
  useEffect(() => { setSwipeDeck(null); }, [filteredListings]);

  // Close the desktop swipe overlay with the Escape key.
  useEffect(() => {
    if (!desktopSwipe) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDesktopSwipe(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [desktopSwipe]);

  // The map should reflect the same deck that SwipeExplorer is showing.
  // When a swipe deck is emitted, use it; otherwise fall back to full filtered.
  const mapSourceListings = swipeDeck ?? filteredListings;
  const swipeDeckIds = useMemo(
    () => (swipeDeck ? new Set(swipeDeck.map(l => l.id)) : null),
    [swipeDeck]
  );

  // Progressive rendering: defer the heavy map listings so filter updates stay responsive
  const deferredMapListings = useDeferredValue(mapSourceListings);

  const activeFiltersCount = selectedTypes.length + selectedRegions.length + selectedCountries.length + selectedTags.length +
    selectedSlopes.length + selectedValuation.length +
    (priceRangeActive ? 1 : 0) +
    (areaRange[0] > 0 || areaRange[1] < 1000000 ? 1 : 0);

  // Handlers
  const clearFilters = useCallback(() => {
    setSelectedTypes([]); setSelectedRegions([]); setSelectedCountries([]);
    setSelectedTags([]); setClpPriceRange([0, 5000000000]); setUfPriceRange([0, 500000]); setAreaRange([0, 1000000]);
    setSearchQuery(''); setMapBounds(null); setDrawnPolygon(null);
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

  // ── MOBILE + TABLET UNIFIED VIEW ──
  if (isTabletOrBelow) {
    return (
      <div className="theme-rural min-h-screen bg-background flex flex-col pb-16">
        <StickyHeader />
        <div id="contenido-principal" className="pt-header">{errorBanner}{currencySwitch}</div>

        <MobileExploreView
          mode={mobileViewMode}
          onModeChange={setMobileViewMode}
          listings={filteredListings}
          totalCount={totalCount}
          isLoading={isLoading}
          hasMore={!!hasMore}
          isLoadingMore={!!isLoadingMore}
          onLoadMore={() => loadMore()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTypes={selectedTypes}
          selectedRegions={selectedRegions}
          selectedCountries={selectedCountries}
          selectedTags={selectedTags}
          priceRange={priceRange}
          priceCurrency={currency === 'UF' ? 'UF' : 'CLP'}
          priceRangeMax={priceRangeMax}
          areaRange={areaRange}
          onToggleType={toggleType}
          onToggleRegion={toggleRegion}
          onToggleCountry={toggleCountry}
          onToggleTag={toggleTag}
          onPriceRangeChange={setPriceRange}
          onAreaRangeChange={setAreaRange}
          onClearFilters={clearFilters}
          activeFiltersCount={activeFiltersCount}
          selectedSlopes={selectedSlopes}
          onToggleSlope={toggleSlope}
          selectedValuation={selectedValuation}
          onToggleValuation={toggleValuation}
          hoveredListing={hoveredListing}
          selectedListing={selectedListing}
          onListingHover={setHoveredListing}
          onListingClick={handleListingClick}
          onListingPreview={setPreviewListing}
          onSwipeFavorite={(l) => {
            addFavorite.mutate(l.id, {
              onSuccess: () =>
                toast.success('Guardado en favoritos', {
                  description: l.title,
                  duration: 5000,
                  action: {
                    label: 'Deshacer',
                    onClick: () => {
                      removeFavorite.mutate(l.id, {
                        onSuccess: () => toast('Se quitó de favoritos', { duration: 2000 }),
                      });
                      track('swipe_favorite_undo', { listing_id: l.id });
                    },
                  },
                }),
            });
            track('swipe_favorite', { listing_id: l.id });
          }}
          onSwipeDismiss={(l) => {
            // The card is auto-hidden by SwipeExplorer's dismissedIds set
            track('swipe_dismiss', { listing_id: l.id });
            toast('Descartado', {
              description: l.title,
              duration: 5000,
              action: {
                label: 'Deshacer',
                onClick: () => {
                  undoDismissRef.current?.(l.id);
                  track('swipe_dismiss_undo', { listing_id: l.id });
                  toast('Descarte revertido', { duration: 2000 });
                },
              },
            });
          }}
          onSwipeContact={(l) => {
            // Open WhatsApp with a contextual inquiry for this listing
            const url = whatsapp.listingInquiry({
              title: l.title,
              price: l.price,
              currency: (l).currency ?? 'CLP',
              area: l.area_m2 ?? null,
              location: l.location,
              phone: (l).contact_phone ?? (l).owner_phone ?? undefined,
            });
            window.open(url, '_blank', 'noopener,noreferrer');
            track('swipe_contact', { listing_id: l.id, channel: 'whatsapp' });
          }}
          onSwipeAddToCompare={(l) => {
            addToCompare(l);
            track('swipe_compare', { listing_id: l.id });
            toast.success('Añadido al comparador', {
              description: `${compareList.length + 1} propiedades en comparación`,
              action:
                compareList.length + 1 >= 2
                  ? { label: 'Comparar', onClick: () => setCompareOpen(true) }
                  : undefined,
            });
          }}
          onSwipeOpenCompare={() => setCompareOpen(true)}
          compareCount={compareList.length}
          isInCompare={isInCompare}
          onSwipeDeckChange={setSwipeDeck}
          undoDismissRef={undoDismissRef}
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

  // isMobile-only variable kept for future breakpoint tweaks; suppress unused warning
  void isMobile;

  // ── DESKTOP SPLIT-VIEW ──
  return (
    <div className="theme-rural h-screen flex flex-col bg-background">
      <StickyHeader />

      {/* AI Search — floating card, not a full-width bar */}
      {showAISearch && (
        <div
          className="fixed inset-0 z-overlay flex items-start justify-center pt-[calc(var(--header-h,64px)+16px)] px-4"
          onClick={() => setShowAISearch(false)}
        >
          <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" aria-hidden="true" />
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-border/40 bg-background/95 shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <EnhancedAISearch onApplyFilters={handleAIFilters} className="w-full" />
          </div>
        </div>
      )}


      {/* Split view: List (380px fixed) + Map (rest) */}
      <div id="contenido-principal" className="flex-1 flex pt-header min-h-0">
        {/* Left panel – scrollable list */}
        <div className="w-[420px] min-w-[380px] flex-shrink-0 border-r border-border/30 flex flex-col min-h-0">
          {errorBanner}
          {currencySwitch}
          <ProjectsRail />
          <LifestyleChips
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            className="border-b border-border/30"
          />
          <div className="flex-1 min-h-0">
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
            priceCurrency={currency === 'UF' ? 'UF' : 'CLP'}
            priceRangeMax={priceRangeMax}
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
        </div>

        {/* Inline preview panel — docks between list and map (no map overlay) */}
        <PropertyPreviewSheet
          inline
          listing={previewListing}
          open={!!previewListing}
          onOpenChange={(open) => !open && setPreviewListing(null)}
          onViewDetails={handleViewDetails}
          similarListings={similarListings}
        />


        {/* Right panel – map fills remaining space */}
        <div className="flex-1 min-w-0 relative">
          <ExploreMapPanel
            listings={deferredMapListings}
            hoveredListing={hoveredListing}
            selectedListing={selectedListing}
            onListingHover={setHoveredListing}
            onListingClick={handleListingClick}
            onBoundsSearch={handleBoundsSearch}
            isSearching={isFetching}
            onPolygonSearch={setDrawnPolygon}
          />
          {drawnPolygon && !swipeDeckIds && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-map-overlay flex items-center gap-2 rounded-full bg-primary/95 text-primary-foreground shadow-lg backdrop-blur px-3 py-1.5 text-xs font-medium animate-in fade-in slide-in-from-top-2">
              <span>Área dibujada · {filteredListings.length} terreno{filteredListings.length === 1 ? '' : 's'} dentro</span>
              <button
                type="button"
                onClick={() => setDrawnPolygon(null)}
                className="ml-1 rounded-full hover:bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wide"
              >
                Quitar filtro
              </button>
            </div>
          )}
          {swipeDeckIds && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-map-overlay flex items-center gap-2 rounded-full bg-primary/95 text-primary-foreground shadow-lg backdrop-blur px-3 py-1.5 text-xs font-medium animate-in fade-in slide-in-from-top-2">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Sincronizado con Swipe · {swipeDeckIds.size} coinciden</span>
              <button
                type="button"
                onClick={() => setSwipeDeck(null)}
                className="ml-1 rounded-full hover:bg-primary-foreground/20 px-2 py-0.5 text-[10px] uppercase tracking-wide"
              >
                Ver todo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Property Preview (inline column above already handles desktop) */}



      {/* Compare */}
      <CompareFloatingBar />
      <CompareSheet />

      {/* Desktop Swipe FAB — sits above CompareFloatingBar via safe stack */}
      <Button
        onClick={() => setDesktopSwipe(true)}
        className="fixed right-6 z-fab bottom-safe-compare h-14 px-6 rounded-full shadow-2xl gap-2"
      >
        <CreditCard className="h-5 w-5" />
        Modo Swipe
      </Button>

      {/* Desktop Swipe Overlay */}
      {desktopSwipe && (
        <div
          className="fixed inset-0 z-modal bg-background/95 backdrop-blur-xl flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Modo Swipe"
          onClick={() => setDesktopSwipe(false)}
        >
          <div
            className="w-full max-w-md h-[90vh] max-h-[800px]"
            onClick={(e) => e.stopPropagation()}
          >
            <SwipeExplorer
              listings={filteredListings}
              onFavorite={(l) => {
                addFavorite.mutate(l.id, {
                  onSuccess: () =>
                    toast.success('Guardado en favoritos', {
                      description: l.title,
                      duration: 5000,
                      action: {
                        label: 'Deshacer',
                        onClick: () => {
                          removeFavorite.mutate(l.id, {
                            onSuccess: () => toast('Se quitó de favoritos', { duration: 2000 }),
                          });
                          track('swipe_favorite_undo', { listing_id: l.id });
                        },
                      },
                    }),
                });
                track('swipe_favorite', { listing_id: l.id });
              }}
              onDismiss={(l) => {
                track('swipe_dismiss', { listing_id: l.id });
                toast('Descartado', {
                  description: l.title,
                  duration: 5000,
                  action: {
                    label: 'Deshacer',
                    onClick: () => {
                      undoDismissRef.current?.(l.id);
                      track('swipe_dismiss_undo', { listing_id: l.id });
                      toast('Descarte revertido', { duration: 2000 });
                    },
                  },
                });
              }}
              onContact={(l) => {
                const url = whatsapp.listingInquiry({
                  title: l.title,
                  price: l.price,
                  currency: (l).currency ?? 'CLP',
                  area: l.area_m2 ?? null,
                  location: l.location,
                  phone: (l).contact_phone ?? (l).owner_phone ?? undefined,
                });
                window.open(url, '_blank', 'noopener,noreferrer');
                track('swipe_contact', { listing_id: l.id, channel: 'whatsapp' });
              }}
              onAddToCompare={(l) => {
                addToCompare(l);
                track('swipe_compare', { listing_id: l.id });
                toast.success('Añadido al comparador', {
                  description: `${compareList.length + 1} propiedades en comparación`,
                });
              }}
              onOpenCompare={() => { setDesktopSwipe(false); setCompareOpen(true); }}
              compareCount={compareList.length}
              isInCompare={isInCompare}
              onBack={() => setDesktopSwipe(false)}
              onDeckChange={setSwipeDeck}
              undoDismissRef={undoDismissRef}
            />
          </div>
          <div
            className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-3 text-[11px] text-muted-foreground"
            aria-hidden="true"
          >
            <span>← Descartar</span>
            <span>→ Me gusta</span>
            <span>↑ Contactar</span>
            <span>Z Deshacer</span>
            <span>Esc Cerrar</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explorar;
