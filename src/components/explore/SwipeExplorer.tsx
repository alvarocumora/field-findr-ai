import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
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
import { Listing, getListingTypeLabel } from '@/hooks/useListings';
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
  onBack,
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

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const current = filtered[currentIndex];
    if (!current) return;
    if (info.offset.x > SWIPE_THRESHOLD) advance(current, 'favorite');
    else if (info.offset.x < -SWIPE_THRESHOLD) advance(current, 'dismiss');
    else if (info.offset.y < -SWIPE_THRESHOLD) advance(current, 'contact');
  }, [filtered, currentIndex, advance]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setDismissedIds(prev => { const n = new Set(prev); n.delete(last.id); return n; });
    setCurrentIndex(i => Math.max(0, i - 1));
  }, [history]);

  const formatPrice = (price: number, currency = 'CLP') => {
    if (currency === 'UF') return `UF ${price.toLocaleString('es-CL')}`;
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
  };

  const CategoryTabs = (
    <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto no-scrollbar">
      {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map(key => {
        const count = listings.filter(CATEGORY_FILTERS[key]).filter(l => !dismissedIds.has(l.id)).length;
        return (
          <Button
            key={key}
            variant={category === key ? 'default' : 'outline'}
            size="sm"
            className="rounded-full flex-shrink-0"
            onClick={() => setCategory(key)}
          >
            {CATEGORY_LABELS[key]}
            <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 h-4 text-[10px]">{count}</Badge>
          </Button>
        );
      })}
    </div>
  );

  const Header = (
    <div className="flex items-center justify-between p-4 pb-2 gap-2">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-2 flex-1 justify-center">
        <span className="text-sm text-muted-foreground">
          {Math.min(currentIndex + 1, filtered.length)} / {filtered.length}
        </span>
        {compareCount >= 2 && onOpenCompare && (
          <Button
            size="sm"
            variant="default"
            className="rounded-full h-7 px-3 gap-1 animate-in fade-in slide-in-from-top-1"
            onClick={onOpenCompare}
          >
            <Scale className="h-3.5 w-3.5" />
            Comparar ({compareCount})
          </Button>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setFiltersOpen(true)}
        className="relative"
        aria-label="Filtros"
      >
        <SlidersHorizontal className="h-5 w-5" />
        {advancedFiltersCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {advancedFiltersCount}
          </span>
        )}
      </Button>
      <Button variant="ghost" size="icon" onClick={handleUndo} disabled={history.length === 0}>
        <Undo2 className="h-5 w-5" />
      </Button>
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
      </div>
    );
  }

  const current = filtered[currentIndex];
  const next = filtered[currentIndex + 1];
  const imageUrl = current.images?.[0] || '/placeholder.svg';

  return (
    <div className="relative flex flex-col h-full">
      {Header}
      {CategoryTabs}

      <div className="flex-1 relative px-4 pb-32">
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

                <motion.div
                  style={{ opacity: favoriteOpacity }}
                  className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"
                >
                  <div className="border-4 border-emerald-500 text-emerald-500 rounded-2xl px-6 py-2 rotate-[-15deg] font-black text-3xl">
                    ME GUSTA
                  </div>
                </motion.div>
                <motion.div
                  style={{ opacity: dismissOpacity }}
                  className="absolute inset-0 bg-red-500/20 flex items-center justify-center"
                >
                  <div className="border-4 border-red-500 text-red-500 rounded-2xl px-6 py-2 rotate-[15deg] font-black text-3xl">
                    NOPE
                  </div>
                </motion.div>
                <motion.div
                  style={{ opacity: contactOpacity }}
                  className="absolute inset-0 bg-blue-500/20 flex items-center justify-center"
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
                  {current.area_m2 && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Maximize2 className="h-4 w-4" />
                      {current.area_m2.toLocaleString()} m²
                    </span>
                  )}
                </div>
                {current.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{current.description}</p>
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

      <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-4 pb-4">
        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-2 border-red-500 text-red-500 bg-background shadow-lg"
          onClick={() => advance(current, 'dismiss')}
        >
          <X className="h-6 w-6" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-2 border-blue-500 text-blue-500 bg-background shadow-lg"
          onClick={() => advance(current, 'contact')}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
        {onAddToCompare && (
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full border-2 bg-background shadow-lg transition-colors",
              isInCompare?.(current.id)
                ? "border-primary text-primary bg-primary/10"
                : "border-amber-500 text-amber-500"
            )}
            onClick={(e) => { e.stopPropagation(); onAddToCompare(current); }}
            title={isInCompare?.(current.id) ? 'Ya en comparador' : 'Agregar al comparador'}
          >
            <Scale className="h-5 w-5" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full border-2 border-emerald-500 text-emerald-500 bg-background shadow-lg",
          )}
          onClick={() => advance(current, 'favorite')}
        >
          <Heart className="h-6 w-6" />
        </Button>
      </div>

      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
        <p className="text-[10px] text-muted-foreground">
          ← Descartar • ↑ Contactar • Favorito → • ⚖ Comparar
        </p>
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
    </div>
  );
};

export default SwipeExplorer;
