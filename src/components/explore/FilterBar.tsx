import { useMemo, useState } from 'react';
import {
  SlidersHorizontal,
  Sparkles,
  X,
  MapPin,
  Globe,
  Tag,
  Ruler,
  DollarSign,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { formatPrice } from '@/hooks/useListings';
import { cn } from '@/lib/utils';
import { LATAM_COUNTRIES } from '@/lib/latam';

interface FilterBarProps {
  selectedTypes: string[];
  onToggleType: (type: string) => void;
  selectedRegions: string[];
  onToggleRegion: (region: string) => void;
  selectedCountries: string[];
  onToggleCountry: (country: string) => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  areaRange: [number, number];
  onAreaRangeChange: (range: [number, number]) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
  resultsCount?: number;
  showAISearch?: boolean;
  onToggleAISearch?: () => void;
  className?: string;
}

const PROPERTY_TYPES = [
  { value: 'parcela_rural', label: 'Parcela Rural' },
  { value: 'sitio_industrial', label: 'Industrial' },
  { value: 'campo_agricola', label: 'Agrícola' },
  { value: 'terreno_urbano', label: 'Urbano' },
  { value: 'terreno_costero', label: 'Costero' },
  { value: 'terreno_montana', label: 'Montaña' },
  { value: 'inversion', label: 'Inversión' },
];

const TAGS = [
  { value: 'agua', label: 'Agua' },
  { value: 'luz', label: 'Luz' },
  { value: 'camino', label: 'Camino' },
  { value: 'riego', label: 'Riego' },
  { value: 'bosque', label: 'Bosque' },
];

const PRICE_PRESETS = [
  { label: '< $50M', range: [0, 50000000] as [number, number] },
  { label: '$50M–$200M', range: [50000000, 200000000] as [number, number] },
  { label: '$200M–$500M', range: [200000000, 500000000] as [number, number] },
  { label: '> $500M', range: [500000000, 5000000000] as [number, number] },
];

const PRICE_MAX = 5000000000;
const AREA_MAX = 1000000;

const getAvailableRegions = (selectedCountries: string[]): string[] => {
  if (selectedCountries.length === 0) {
    return LATAM_COUNTRIES.flatMap((c) => c.regions.slice(0, 3));
  }
  return LATAM_COUNTRIES
    .filter((c) => selectedCountries.includes(c.name))
    .flatMap((c) => c.regions);
};

const typeLabel = (v: string) =>
  PROPERTY_TYPES.find((t) => t.value === v)?.label ?? v;
const tagLabel = (v: string) => TAGS.find((t) => t.value === v)?.label ?? v;

// Reusable chip pill for the active-filters row
const Chip = ({
  children,
  onRemove,
  icon: Icon,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <button
    type="button"
    onClick={onRemove}
    className="group inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-medium hover:bg-primary/15 transition-colors"
  >
    {Icon && <Icon className="h-3 w-3 opacity-70" />}
    <span className="max-w-[140px] truncate">{children}</span>
    <span className="ml-0.5 grid place-items-center h-4 w-4 rounded-full bg-primary/20 group-hover:bg-primary/30">
      <X className="h-2.5 w-2.5" />
    </span>
  </button>
);

const SectionTitle = ({
  icon: Icon,
  children,
  count,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  count?: number;
}) => (
  <span className="flex items-center gap-2 text-sm">
    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
    <span className="font-medium">{children}</span>
    {!!count && (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
        {count}
      </span>
    )}
  </span>
);

const FilterBar = ({
  selectedTypes,
  onToggleType,
  selectedRegions,
  onToggleRegion,
  selectedCountries,
  onToggleCountry,
  selectedTags,
  onToggleTag,
  priceRange,
  onPriceRangeChange,
  areaRange,
  onAreaRangeChange,
  onClearFilters,
  activeFiltersCount,
  resultsCount,
  showAISearch = false,
  onToggleAISearch,
  className,
}: FilterBarProps) => {
  const [open, setOpen] = useState(false);
  const availableRegions = useMemo(
    () => getAvailableRegions(selectedCountries),
    [selectedCountries],
  );

  const hasPriceFilter = priceRange[0] > 0 || priceRange[1] < PRICE_MAX;
  const hasAreaFilter = areaRange[0] > 0 || areaRange[1] < AREA_MAX;

  const priceChipLabel = () => {
    if (!hasPriceFilter) return null;
    const min = priceRange[0] > 0 ? formatPrice(priceRange[0]) : '$0';
    const max = priceRange[1] < PRICE_MAX ? formatPrice(priceRange[1]) : '∞';
    return `${min} – ${max}`;
  };
  const areaChipLabel = () => {
    if (!hasAreaFilter) return null;
    const min = `${areaRange[0].toLocaleString()} m²`;
    const max =
      areaRange[1] < AREA_MAX
        ? `${areaRange[1].toLocaleString()} m²`
        : '∞';
    return `${min} – ${max}`;
  };

  return (
    <div className={cn('bg-background/80 backdrop-blur-xl border-b border-border/30', className)}>
      {/* Row 1 — primary controls */}
      <div className="px-4 py-2 flex items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-9 rounded-xl gap-2 border-border/60 font-medium',
                activeFiltersCount > 0 && 'border-primary/40 bg-primary/5 text-primary',
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge className="h-5 min-w-5 px-1.5 text-[10px] rounded-full">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
            <SheetHeader className="px-5 py-4 border-b border-border/40">
              <SheetTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    {activeFiltersCount} activos
                  </Badge>
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-5 py-2">
              <Accordion
                type="multiple"
                defaultValue={['tipo', 'ubicacion', 'precio']}
                className="w-full"
              >
                {/* Tipo */}
                <AccordionItem value="tipo">
                  <AccordionTrigger className="py-3">
                    <SectionTitle icon={Building2} count={selectedTypes.length}>
                      Tipo de terreno
                    </SectionTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-1.5 pt-1 pb-3">
                      {PROPERTY_TYPES.map((t) => {
                        const active = selectedTypes.includes(t.value);
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => onToggleType(t.value)}
                            className={cn(
                              'px-3 h-8 rounded-full text-xs font-medium border transition-colors',
                              active
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background border-border/60 hover:bg-muted',
                            )}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Ubicación (país + región) */}
                <AccordionItem value="ubicacion">
                  <AccordionTrigger className="py-3">
                    <SectionTitle
                      icon={MapPin}
                      count={selectedCountries.length + selectedRegions.length}
                    >
                      Ubicación
                    </SectionTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-1 pb-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground">
                          <Globe className="h-3 w-3" /> País
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {LATAM_COUNTRIES.map((c) => {
                            const active = selectedCountries.includes(c.name);
                            return (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => onToggleCountry(c.name)}
                                className={cn(
                                  'px-3 h-8 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1.5',
                                  active
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background border-border/60 hover:bg-muted',
                                )}
                              >
                                <span>{c.flag}</span> {c.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground">
                          <MapPin className="h-3 w-3" /> Región
                        </div>
                        {availableRegions.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Selecciona un país para ver sus regiones.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-1 max-h-56 overflow-y-auto pr-1">
                            {availableRegions.map((r) => (
                              <label
                                key={r}
                                className="flex items-center gap-2 p-1.5 rounded-lg cursor-pointer hover:bg-muted text-xs"
                              >
                                <Checkbox
                                  checked={selectedRegions.includes(r)}
                                  onCheckedChange={() => onToggleRegion(r)}
                                />
                                <span className="truncate">{r}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Precio */}
                <AccordionItem value="precio">
                  <AccordionTrigger className="py-3">
                    <SectionTitle icon={DollarSign} count={hasPriceFilter ? 1 : 0}>
                      Precio
                    </SectionTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-1 pb-3">
                      <div className="flex flex-wrap gap-1.5">
                        {PRICE_PRESETS.map((p) => {
                          const active =
                            priceRange[0] === p.range[0] && priceRange[1] === p.range[1];
                          return (
                            <button
                              key={p.label}
                              type="button"
                              onClick={() =>
                                onPriceRangeChange(active ? [0, PRICE_MAX] : p.range)
                              }
                              className={cn(
                                'px-3 h-7 rounded-full text-xs font-medium border transition-colors',
                                active
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background border-border/60 hover:bg-muted',
                              )}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                      <Slider
                        value={[Math.log10(priceRange[0] + 1), Math.log10(priceRange[1])]}
                        min={0}
                        max={10}
                        step={0.1}
                        onValueChange={([min, max]) =>
                          onPriceRangeChange([
                            Math.round(Math.pow(10, min) - 1),
                            Math.round(Math.pow(10, max)),
                          ])
                        }
                        className="py-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground font-medium">
                        <span>{formatPrice(priceRange[0])}</span>
                        <span>{formatPrice(priceRange[1])}</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Superficie */}
                <AccordionItem value="superficie">
                  <AccordionTrigger className="py-3">
                    <SectionTitle icon={Ruler} count={hasAreaFilter ? 1 : 0}>
                      Superficie
                    </SectionTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-1 pb-3">
                      <Slider
                        value={[Math.log10(areaRange[0] + 1), Math.log10(areaRange[1])]}
                        min={0}
                        max={6}
                        step={0.1}
                        onValueChange={([min, max]) =>
                          onAreaRangeChange([
                            Math.round(Math.pow(10, min) - 1),
                            Math.round(Math.pow(10, max)),
                          ])
                        }
                        className="py-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{areaRange[0].toLocaleString()} m²</span>
                        <span>{areaRange[1].toLocaleString()} m²</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Características */}
                <AccordionItem value="tags" className="border-b-0">
                  <AccordionTrigger className="py-3">
                    <SectionTitle icon={Tag} count={selectedTags.length}>
                      Características
                    </SectionTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-1.5 pt-1 pb-3">
                      {TAGS.map((t) => {
                        const active = selectedTags.includes(t.value);
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => onToggleTag(t.value)}
                            className={cn(
                              'px-3 h-8 rounded-full text-xs font-medium border transition-colors',
                              active
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background border-border/60 hover:bg-muted',
                            )}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <SheetFooter className="sticky bottom-0 z-10 mt-auto px-5 py-3 border-t border-border/40 bg-background/95 backdrop-blur-xl shadow-[0_-4px_16px_-8px_hsl(var(--background))] flex-col gap-2 sm:flex-col sm:space-x-0">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {activeFiltersCount > 0
                    ? `${activeFiltersCount} filtro${activeFiltersCount === 1 ? '' : 's'} activo${activeFiltersCount === 1 ? '' : 's'}`
                    : 'Sin filtros activos'}
                </span>
                {typeof resultsCount === 'number' && (
                  <span className="font-semibold text-foreground">
                    <span className="text-primary">{resultsCount.toLocaleString()}</span>{' '}
                    <span className="text-muted-foreground font-normal">
                      resultado{resultsCount === 1 ? '' : 's'}
                    </span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeFiltersCount === 0}
                  onClick={onClearFilters}
                  className="flex-1 h-10 rounded-xl border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" /> Limpiar
                </Button>
                <Button
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="flex-[2] h-10 rounded-xl font-medium"
                >
                  Aplicar
                  {typeof resultsCount === 'number' && (
                    <span className="ml-1.5 opacity-90">
                      · {resultsCount.toLocaleString()}
                    </span>
                  )}
                </Button>
              </div>
            </SheetFooter>

          </SheetContent>
        </Sheet>

        {onToggleAISearch && (
          <Button
            variant={showAISearch ? 'default' : 'outline'}
            size="sm"
            onClick={onToggleAISearch}
            className="h-9 rounded-xl gap-1.5 border-border/60"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">IA</span>
          </Button>
        )}

        <div className="flex-1" />

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 rounded-xl text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">Limpiar</span>
          </Button>
        )}
      </div>

      {/* Row 2 — active-filter chips */}
      {activeFiltersCount > 0 && (
        <div className="px-4 pb-2.5 flex flex-wrap gap-1.5">
          {selectedTypes.map((v) => (
            <Chip key={`t-${v}`} icon={Building2} onRemove={() => onToggleType(v)}>
              {typeLabel(v)}
            </Chip>
          ))}
          {selectedCountries.map((v) => (
            <Chip key={`c-${v}`} icon={Globe} onRemove={() => onToggleCountry(v)}>
              {v}
            </Chip>
          ))}
          {selectedRegions.map((v) => (
            <Chip key={`r-${v}`} icon={MapPin} onRemove={() => onToggleRegion(v)}>
              {v}
            </Chip>
          ))}
          {hasPriceFilter && (
            <Chip
              icon={DollarSign}
              onRemove={() => onPriceRangeChange([0, PRICE_MAX])}
            >
              {priceChipLabel()}
            </Chip>
          )}
          {hasAreaFilter && (
            <Chip icon={Ruler} onRemove={() => onAreaRangeChange([0, AREA_MAX])}>
              {areaChipLabel()}
            </Chip>
          )}
          {selectedTags.map((v) => (
            <Chip key={`g-${v}`} icon={Tag} onRemove={() => onToggleTag(v)}>
              {tagLabel(v)}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
