import { useState, useCallback, useMemo, useEffect, useRef, type MutableRefObject } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Heart, X, MessageCircle, MapPin, Maximize2, ChevronLeft, Undo2, Sparkles, Scale,
  ArrowRight, SlidersHorizontal,
} from 'lucide-react';
import { Listing, getListingTypeLabel, getPricePerM2, formatPriceShort } from '@/hooks/useListings';
import { useNavigate } from 'react-router-dom';
import InvestmentScoreBadge from '@/components/explore/InvestmentScoreBadge';
import { cn } from '@/lib/utils';

interface SwipeExplorerProps {
  listings: Listing[];
  onFavorite?: (listing: Listing) => void;
  onDismiss?: (listing: Listing) => void;
  onContact?: (listing: Listing) => void;
  onAddToCompare?: (listing: Listing) => void;
  onOpenCompare?: () => void;
  compareCount?: number;
  isInCompare?: (id: string) => boolean;
  onBack?: () => void;
  /** Emits the filtered deck (category + advanced filters + dismissed) whenever it changes. */
  onDeckChange?: (deck: Listing[]) => void;
  /** Ref receives an `unDismiss(id)` function so parents can revert a dismiss (e.g. from an undo toast). */
  undoDismissRef?: MutableRefObject<((id: string) => void) | null>;
}

type CategoryKey = 'todos' | 'campos' | 'parcelas' | 'loteos';

const CATEGORY_FILTERS: Record<CategoryKey, (l: Listing) => boolean> = {
  todos: () => true,
  campos: (l) => l.type === 'campo_agricola' || l.tags?.includes('campo'),
  parcelas: (l) =>
    l.type === 'parcela_rural' ||
    l.type === 'terreno_costero' ||
    l.type === 'terreno_montana' ||
    l.tags?.includes('parcela'),
  loteos: (l) =>
    l.type === 'terreno_urbano' ||
    l.type === 'sitio_industrial' ||
    l.type === 'inversion' ||
    l.tags?.includes('loteo') ||
    l.tags?.includes('proyecto'),
};

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  todos: 'Todos',
  campos: 'Campos',
  parcelas: 'Parcelas',
  loteos: 'Loteos',
};

const SWIPE_THRESHOLD = 100;
const DISMISSED_KEY = 'swipe:dismissed-ids';

const SwipeExplorer = ({
  listings, onFavorite, onDismiss, onContact,
  onAddToCompare, onOpenCompare, compareCount = 0, isInCompare,
  onBack, onDeckChange, undoDismissRef,
}: SwipeExplorerProps) => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<CategoryKey>('todos');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const raw = sessionStorage.getItem(DISMISSED_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  const [history, setHistory] = useState<Listing[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmed, setConfirmed] = useState<{ listing: Listing; action: 'favorite' | 'dismiss' } | null>(null);
  // Photo index inside the current card (tap left/right zones to navigate).
  const [imgIndex, setImgIndex] = useState(0);

  // Advanced filters (region + price + price/m²)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [pricePerM2Range, setPricePerM2Range] = useState<[number, number] | null>(null);

  useEffect(() => {
    try { sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissedIds])); } catch {}
  }, [dismissedIds]);

  // Data-driven bounds from incoming listings
  const { regionOptions, priceBounds, pricePerM2Bounds } = useMemo(() => {
    const regions = new Set<string>();
    let pMin = Infinity, pMax = -Infinity;
    let ppmMin = Infinity, ppmMax = -Infinity;
    for (const l of listings) {
      if (l.region) regions.add(l.region);
      if (typeof l.price === 'number') {
        pMin = Math.min(pMin, l.price);
        pMax = Math.max(pMax, l.price);
      }
      if (l.area_m2 && l.price && l.area_m2 > 0) {
        const ppm = l.price / l.area_m2;
        ppmMin = Math.min(ppmMin, ppm);
        ppmMax = Math.max(ppmMax, ppm);
      }
    }
    return {
      regionOptions: [...regions].sort(),
      priceBounds: [Number.isFinite(pMin) ? Math.floor(pMin) : 0, Number.isFinite(pMax) ? Math.ceil(pMax) : 1_000_000_000] as [number, number],
      pricePerM2Bounds: [Number.isFinite(ppmMin) ? Math.floor(ppmMin) : 0, Number.isFinite(ppmMax) ? Math.ceil(ppmMax) : 1_000_000] as [number, number],
    };
  }, [listings]);

  const effectivePriceRange = priceRange ?? priceBounds;
  const effectivePpmRange = pricePerM2Range ?? pricePerM2Bounds;

  const filtered = useMemo(
    () =>
      listings
        .filter(CATEGORY_FILTERS[category])
        .filter(l => !dismissedIds.has(l.id))
        .filter(l => selectedRegions.size === 0 || (l.region && selectedRegions.has(l.region)))
        .filter(l => l.price >= effectivePriceRange[0] && l.price <= effectivePriceRange[1])
        .filter(l => {
          if (!l.area_m2 || l.area_m2 <= 0) return true;
          const ppm = l.price / l.area_m2;
          return ppm >= effectivePpmRange[0] && ppm <= effectivePpmRange[1];
        }),
    [listings, category, dismissedIds, selectedRegions, effectivePriceRange, effectivePpmRange]
  );

  const advancedFiltersCount =
    selectedRegions.size +
    (priceRange && (priceRange[0] > priceBounds[0] || priceRange[1] < priceBounds[1]) ? 1 : 0) +
    (pricePerM2Range && (pricePerM2Range[0] > pricePerM2Bounds[0] || pricePerM2Range[1] < pricePerM2Bounds[1]) ? 1 : 0);

  const clearAdvancedFilters = () => {
    setSelectedRegions(new Set());
    setPriceRange(null);
    setPricePerM2Range(null);
  };

  const toggleRegion = (r: string) => {
    setSelectedRegions(prev => {
      const n = new Set(prev);
      n.has(r) ? n.delete(r) : n.add(r);
      return n;
    });
  };

  // Reset index when category or advanced filters change
  useEffect(() => { setCurrentIndex(0); }, [category, selectedRegions, priceRange, pricePerM2Range]);

  // Reset photo index whenever the top card changes
  const currentId = filtered[currentIndex]?.id;
  useEffect(() => { setImgIndex(0); }, [currentId]);

  // Emit filtered deck upward so the parent (map, badges, etc.) can sync.
  useEffect(() => { onDeckChange?.(filtered); }, [filtered, onDeckChange]);

  // Preload the next few card images so swiping doesn't flash a blank card.
  useEffect(() => {
    for (let i = currentIndex + 1; i <= currentIndex + 3; i++) {
      const url = filtered[i]?.images?.[0];
      if (url) { const img = new Image(); img.src = url; }
    }
  }, [filtered, currentIndex]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const favoriteOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const dismissOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const contactOpacity = useTransform(y, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const advance = useCallback((listing: Listing, action: 'favorite' | 'dismiss' | 'contact') => {
    setHistory(h => [...h.slice(-19), listing]);
    if (action === 'favorite') onFavorite?.(listing);
    if (action === 'dismiss') { onDismiss?.(listing); setDismissedIds(prev => new Set(prev).add(listing.id)); }
    if (action === 'contact') onContact?.(listing);
    if ('vibrate' in navigator) navigator.vibrate(action === 'favorite' ? 20 : 10);
    if (action === 'favorite' || action === 'dismiss') setConfirmed({ listing, action });
    setCurrentIndex(i => i + 1);
    x.set(0); y.set(0);
  }, [onFavorite, onDismiss, onContact, x, y]);

  // Fly the card off-screen in the action's direction before advancing —
  // button taps and threshold releases used to snap-swap with no motion.
  const animatingRef = useRef(false);
  const flyOut = useCallback((listing: Listing, action: 'favorite' | 'dismiss' | 'contact') => {
    if (animatingRef.current) return;
    animatingRef.current = true;
    const target = action === 'favorite'
      ? { x: 640, y: 40 }
      : action === 'dismiss'
        ? { x: -640, y: 40 }
        : { x: 0, y: -760 };
    Promise.all([
      animate(x, target.x, { duration: 0.28, ease: [0.32, 0.72, 0, 1] }),
      animate(y, target.y, { duration: 0.28, ease: [0.32, 0.72, 0, 1] }),
    ]).then(() => {
      advance(listing, action);
      animatingRef.current = false;
    });
  }, [x, y, advance]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const current = filtered[currentIndex];
    if (!current) return;
    if (info.offset.x > SWIPE_THRESHOLD) flyOut(current, 'favorite');
    else if (info.offset.x < -SWIPE_THRESHOLD) flyOut(current, 'dismiss');
    else if (info.offset.y < -SWIPE_THRESHOLD) flyOut(current, 'contact');
  }, [filtered, currentIndex, flyOut]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setDismissedIds(prev => { const n = new Set(prev); n.delete(last.id); return n; });
    setCurrentIndex(i => Math.max(0, i - 1));
  }, [history]);

  // Keyboard controls (desktop): ←/→/↑ act like swipes, Z/Backspace undoes.
  // Ignored while a dialog/sheet is open or focus is in a form field.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (confirmed || filtersOpen) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const current = filtered[currentIndex];
      if (!current) return;
      switch (e.key) {
        case 'ArrowRight': e.preventDefault(); flyOut(current, 'favorite'); break;
        case 'ArrowLeft': e.preventDefault(); flyOut(current, 'dismiss'); break;
        case 'ArrowUp': e.preventDefault(); flyOut(current, 'contact'); break;
        case 'z': case 'Z': case 'Backspace': e.preventDefault(); handleUndo(); break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filtered, currentIndex, flyOut, handleUndo, confirmed, filtersOpen]);

  // Expose an imperative "unDismiss(id)" to parents so they can revert a dismiss
  // from an undo snackbar without needing to know internal state.
  const unDismiss = useCallback((id: string) => {
    setDismissedIds(prev => {
      if (!prev.has(id)) return prev;
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
    setHistory(h => {
      const idx = [...h].reverse().findIndex(l => l.id === id);
      if (idx === -1) return h;
      const realIdx = h.length - 1 - idx;
      return [...h.slice(0, realIdx), ...h.slice(realIdx + 1)];
    });
    setCurrentIndex(i => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    if (!undoDismissRef) return;
    undoDismissRef.current = unDismiss;
    return () => { if (undoDismissRef) undoDismissRef.current = null; };
  }, [undoDismissRef, unDismiss]);

  const formatPrice = (price: number, currency = 'CLP') => {
    if (currency === 'UF') return `UF ${price.toLocaleString('es-CL')}`;
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
  };

  const totalInCategory = useMemo(
    () => listings.filter(CATEGORY_FILTERS[category]).length,
    [listings, category],
  );
  const progress =
    filtered.length === 0
      ? 0
      : Math.min(100, Math.round(((currentIndex + 1) / filtered.length) * 100));

  const CategoryTabs = (
    <div className="relative">
      <div className="flex items-center gap-1.5 px-4 pb-3 overflow-x-auto no-scrollbar snap-x">
        {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((key) => {
          const count = listings
            .filter(CATEGORY_FILTERS[key])
            .filter((l) => !dismissedIds.has(l.id)).length;
          const active = category === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={cn(
                'snap-start inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-medium border transition-colors flex-shrink-0',
                active
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-foreground border-border/60 hover:bg-muted',
              )}
            >
              {CATEGORY_LABELS[key]}
              <span
                className={cn(
                  'h-4 min-w-4 px-1 rounded-full text-[10px] font-semibold inline-flex items-center justify-center',
                  active
                    ? 'bg-primary-foreground/25 text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
      {/* Right fade for scroll affordance */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent" />
    </div>
  );

  const Header = (
    <div className="px-4 pt-3 pb-1">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-9 w-9 rounded-full"
          aria-label="Volver"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="flex items-baseline gap-1 tabular-nums">
            <span className="text-sm font-semibold text-foreground">
              {Math.min(currentIndex + 1, filtered.length || 1)}
            </span>
            <span className="text-xs text-muted-foreground">
              / {filtered.length || totalInCategory}
            </span>
          </div>
          {compareCount >= 2 && onOpenCompare && (
            <Button
              size="sm"
              variant="default"
              className="rounded-full h-7 px-2.5 gap-1 text-xs animate-in fade-in slide-in-from-top-1"
              onClick={onOpenCompare}
            >
              <Scale className="h-3.5 w-3.5" />
              {compareCount}
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleUndo}
          disabled={history.length === 0}
          className="h-9 w-9 rounded-full"
          aria-label="Deshacer"
        >
          <Undo2 className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setFiltersOpen(true)}
          className="relative h-9 w-9 rounded-full"
          aria-label="Filtros"
        >
          <SlidersHorizontal className="h-5 w-5" />
          {advancedFiltersCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {advancedFiltersCount}
            </span>
          )}
        </Button>
      </div>

      {/* Slim progress bar */}
      <div className="mt-2.5 h-1 w-full rounded-full bg-muted/60 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );


  const formatCLP = (n: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

  const FiltersSheet = (
    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Filtros avanzados</SheetTitle>
          <SheetDescription>
            Refina el deck por región, precio total y precio por m².
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Región</Label>
            {regionOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin regiones en los resultados actuales.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {regionOptions.map(r => {
                  const active = selectedRegions.has(r);
                  return (
                    <Button
                      key={r}
                      type="button"
                      variant={active ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-full h-8"
                      onClick={() => toggleRegion(r)}
                    >
                      {r}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Precio total</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatCLP(effectivePriceRange[0])} – {formatCLP(effectivePriceRange[1])}
              </span>
            </div>
            <Slider
              min={priceBounds[0]}
              max={priceBounds[1]}
              step={Math.max(1, Math.round((priceBounds[1] - priceBounds[0]) / 100))}
              value={[effectivePriceRange[0], effectivePriceRange[1]]}
              onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Precio por m²</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatCLP(effectivePpmRange[0])} – {formatCLP(effectivePpmRange[1])} /m²
              </span>
            </div>
            <Slider
              min={pricePerM2Bounds[0]}
              max={pricePerM2Bounds[1]}
              step={Math.max(1, Math.round((pricePerM2Bounds[1] - pricePerM2Bounds[0]) / 100))}
              value={[effectivePpmRange[0], effectivePpmRange[1]]}
              onValueChange={(v) => setPricePerM2Range([v[0], v[1]] as [number, number])}
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs">
            <span className="font-semibold">{filtered.length}</span> propiedades coinciden con estos filtros.
          </div>
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={clearAdvancedFilters}>
            Limpiar
          </Button>
          <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
            Aplicar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  if (filtered.length === 0) {
    return (
      <div className="relative flex flex-col h-full">
        {Header}
        {CategoryTabs}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-lg font-semibold">Sin {CATEGORY_LABELS[category].toLowerCase()} disponibles</p>
          <p className="text-sm text-muted-foreground">Prueba con otra categoría o limpia los descartados.</p>
          {dismissedIds.size > 0 && (
            <Button variant="outline" onClick={() => setDismissedIds(new Set())}>
              Restaurar descartados ({dismissedIds.size})
            </Button>
          )}
          {advancedFiltersCount > 0 && (
            <Button variant="ghost" onClick={clearAdvancedFilters}>
              Limpiar filtros avanzados ({advancedFiltersCount})
            </Button>
          )}
        </div>
        {FiltersSheet}
      </div>
    );
  }

  if (currentIndex >= filtered.length) {
    return (
      <div className="relative flex flex-col h-full">
        {Header}
        {CategoryTabs}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <Heart className="h-12 w-12 text-primary" />
          <p className="text-lg font-semibold">¡Viste todos los {CATEGORY_LABELS[category].toLowerCase()}!</p>
          <p className="text-sm text-muted-foreground">Cambia de categoría o restaura tus descartes.</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentIndex(0)}>Volver a empezar</Button>
            {dismissedIds.size > 0 && (
              <Button onClick={() => { setDismissedIds(new Set()); setCurrentIndex(0); }}>
                Restaurar {dismissedIds.size}
              </Button>
            )}
          </div>
        </div>
        {FiltersSheet}
      </div>
    );
  }

  const current = filtered[currentIndex];
  const next = filtered[currentIndex + 1];
  const images = (current.images ?? []).filter(Boolean);
  const imageUrl = images[Math.min(imgIndex, Math.max(images.length - 1, 0))] || '/placeholder.svg';
  const pricePerM2 = getPricePerM2(current.price, current.area_m2);

  return (
    <div className="relative flex flex-col h-full">
      {Header}
      {CategoryTabs}

      <div className="flex-1 relative px-4 pb-36 sm:pb-40 min-h-0">
        {next && (
          <div className="absolute inset-x-4 top-0 bottom-4 pointer-events-none">
            <Card className="h-full opacity-60 scale-[0.96] overflow-hidden">
              <div className="relative h-3/5">
                <img
                  src={next.images?.[0] || '/placeholder.svg'}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            </Card>
          </div>
        )}

        <AnimatePresence>
          <motion.div
            key={current.id}
            className="absolute inset-x-4 top-0 bottom-4"
            style={{ x, y, rotate }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card
              className="h-full overflow-hidden cursor-grab active:cursor-grabbing shadow-2xl"
              onClick={() => navigate(`/propiedad/${current.id}`)}
            >
              <div className="relative h-3/5">
                <img
                  src={imageUrl}
                  alt={current.title}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Photo navigation — Tinder-style tap zones + dots */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Foto anterior"
                      className="absolute inset-y-0 left-0 w-1/3"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImgIndex(i => (i - 1 + images.length) % images.length);
                      }}
                    />
                    <button
                      type="button"
                      aria-label="Foto siguiente"
                      className="absolute inset-y-0 right-0 w-1/3"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImgIndex(i => (i + 1) % images.length);
                      }}
                    />
                    <div className="absolute top-2 inset-x-4 flex gap-1">
                      {images.map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            'h-[3px] flex-1 rounded-full transition-colors',
                            i === imgIndex ? 'bg-white/95' : 'bg-white/35',
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}

                <motion.div
                  style={{ opacity: favoriteOpacity }}
                  className="pointer-events-none absolute inset-0 bg-emerald-500/20 flex items-center justify-center"
                >
                  <div className="border-4 border-emerald-500 text-emerald-500 rounded-2xl px-6 py-2 rotate-[-15deg] font-black text-3xl">
                    ME GUSTA
                  </div>
                </motion.div>
                <motion.div
                  style={{ opacity: dismissOpacity }}
                  className="pointer-events-none absolute inset-0 bg-red-500/20 flex items-center justify-center"
                >
                  <div className="border-4 border-red-500 text-red-500 rounded-2xl px-6 py-2 rotate-[15deg] font-black text-3xl">
                    NOPE
                  </div>
                </motion.div>
                <motion.div
                  style={{ opacity: contactOpacity }}
                  className="pointer-events-none absolute inset-0 bg-blue-500/20 flex items-center justify-center"
                >
                  <MessageCircle className="h-20 w-20 text-blue-500" />
                </motion.div>

                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className="bg-background/80 text-foreground backdrop-blur-sm">
                    {getListingTypeLabel(current.type)}
                  </Badge>
                  <InvestmentScoreBadge listing={current} />
                </div>

                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h3 className="font-bold text-xl line-clamp-1 drop-shadow-lg">{current.title}</h3>
                  <div className="flex items-center gap-1 text-sm opacity-90">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{current.location}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(current.price, (current as any).currency ?? 'CLP')}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    {pricePerM2 !== null && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">
                        {formatPriceShort(pricePerM2)}/m²
                      </span>
                    )}
                    {current.area_m2 && (
                      <span className="flex items-center gap-1">
                        <Maximize2 className="h-4 w-4" />
                        {current.area_m2.toLocaleString()} m²
                      </span>
                    )}
                  </span>
                </div>
                {current.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{current.description.replace(/[*_#>`]+/g, '').replace(/[^\p{L}\p{N}\p{P}\p{Zs}$²]/gu, '').replace(/\s+/g, ' ').trim()}</p>
                )}
                {current.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {current.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky action bar — labeled circles, non-overlapping, safe-area aware */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pt-3 pb-4 bg-gradient-to-t from-background via-background/95 to-background/0 pointer-events-none">
        <div className="mx-auto max-w-md flex items-end justify-around gap-2 pointer-events-auto">
          {/* Nope */}
          <button
            type="button"
            onClick={() => flyOut(current, 'dismiss')}
            className="group flex flex-col items-center gap-1"
            aria-label="Descartar"
          >
            <span className="h-14 w-14 rounded-full bg-background border-2 border-red-500/70 text-red-500 shadow-lg flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95">
              <X className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nope
            </span>
          </button>

          {/* Contactar */}
          <button
            type="button"
            onClick={() => flyOut(current, 'contact')}
            className="group flex flex-col items-center gap-1"
            aria-label="Contactar"
          >
            <span className="h-12 w-12 rounded-full bg-background border-2 border-sky-500/70 text-sky-500 shadow-lg flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95">
              <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Contactar
            </span>
          </button>

          {/* Comparar */}
          {onAddToCompare && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCompare(current);
              }}
              className="group flex flex-col items-center gap-1"
              aria-label={isInCompare?.(current.id) ? 'Ya en comparador' : 'Comparar'}
            >
              <span
                className={cn(
                  'h-12 w-12 rounded-full bg-background border-2 shadow-lg flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95',
                  isInCompare?.(current.id)
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-amber-500/70 text-amber-500',
                )}
              >
                <Scale className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {isInCompare?.(current.id) ? 'Añadido' : 'Comparar'}
              </span>
            </button>
          )}

          {/* Me gusta */}
          <button
            type="button"
            onClick={() => flyOut(current, 'favorite')}
            className="group flex flex-col items-center gap-1"
            aria-label="Me gusta"
          >
            <span className="h-14 w-14 rounded-full bg-background border-2 border-emerald-500/70 text-emerald-500 shadow-lg flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95">
              <Heart className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Me gusta
            </span>
          </button>
        </div>
      </div>



      <Dialog open={!!confirmed} onOpenChange={(o) => !o && setConfirmed(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {confirmed && (
            <>
              <div className="relative h-48">
                <img
                  src={confirmed.listing.images?.[0] || '/placeholder.svg'}
                  alt={confirmed.listing.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge
                    className={cn(
                      "backdrop-blur-sm font-bold",
                      confirmed.action === 'favorite'
                        ? "bg-emerald-500/90 text-white"
                        : "bg-red-500/90 text-white"
                    )}
                  >
                    {confirmed.action === 'favorite' ? '❤ ME GUSTA' : '✕ DESCARTADO'}
                  </Badge>
                  <InvestmentScoreBadge listing={confirmed.listing} />
                </div>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h3 className="font-bold text-lg line-clamp-1 drop-shadow-lg">
                    {confirmed.listing.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs opacity-90">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{confirmed.listing.location}</span>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <DialogHeader className="space-y-1 text-left">
                  <DialogTitle className="text-base">
                    {confirmed.action === 'favorite'
                      ? '¡Guardado en tus favoritos!'
                      : 'Descartado de tu feed'}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Revisa el detalle completo del terreno y su Investment Score.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-primary text-lg">
                    {formatPrice(confirmed.listing.price, (confirmed.listing as any).currency ?? 'CLP')}
                  </span>
                  {confirmed.listing.area_m2 && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Maximize2 className="h-4 w-4" />
                      {confirmed.listing.area_m2.toLocaleString()} m²
                    </span>
                  )}
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => setConfirmed(null)}
                  >
                    Seguir explorando
                  </Button>
                  <Button
                    className="w-full sm:w-auto gap-1"
                    onClick={() => {
                      const id = confirmed.listing.id;
                      setConfirmed(null);
                      navigate(`/propiedad/${id}`);
                    }}
                  >
                    Ver ficha completa
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {FiltersSheet}
    </div>
  );
};

export default SwipeExplorer;
