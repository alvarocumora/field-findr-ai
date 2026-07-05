import { Link } from 'react-router-dom';
import { MapPin, Sparkles, Compass, X, Search, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LATAM_COUNTRIES } from '@/lib/latam';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Curated popular regions for the "navegar" CTA
const POPULAR_REGIONS: { label: string; country: string }[] = [
  { label: 'Región Metropolitana', country: 'Chile' },
  { label: 'Valparaíso', country: 'Chile' },
  { label: 'Los Lagos', country: 'Chile' },
  { label: 'La Araucanía', country: 'Chile' },
  { label: 'O’Higgins', country: 'Chile' },
  { label: 'Maule', country: 'Chile' },
].filter((r) =>
  LATAM_COUNTRIES.some(
    (c) => c.name === r.country && c.regions.some((rg) => rg.toLowerCase().includes(r.label.split(' ')[0].toLowerCase())),
  ),
);

interface EmptyResultsStateProps {
  activeFiltersCount: number;
  onClearFilters: () => void;
  onSelectRegion?: (region: string) => void;
}

/**
 * Empty state for the Explore panel when the current filter combination
 * yields zero results. Provides three CTAs:
 *  - Limpiar filtros (only if any active)
 *  - Ver recomendados (routes to /oportunidades)
 *  - Navegar por regiones (in-page region chips + fallback link)
 */
export const EmptyResultsState = ({
  activeFiltersCount,
  onClearFilters,
  onSelectRegion,
}: EmptyResultsStateProps) => {
  return (
    <div className="flex flex-col items-center text-center px-6 py-10">
      <div className="relative mb-5">
        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/20 flex items-center justify-center shadow-sm">
          <Search className="h-9 w-9 text-primary/70" />
        </div>
        <span className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-background border border-border/60 flex items-center justify-center">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
      </div>

      <h4 className="text-base font-semibold text-foreground mb-1.5">
        No encontramos terrenos con estos filtros
      </h4>
      <p className="text-xs text-muted-foreground max-w-[260px] mb-5 leading-relaxed">
        Prueba ampliando la zona o explora nuestras recomendaciones curadas por
        el equipo.
      </p>

      {/* Primary CTAs */}
      <div className="flex flex-col w-full max-w-[260px] gap-2 mb-5">
        {activeFiltersCount > 0 && (
          <Button
            onClick={onClearFilters}
            className="w-full rounded-xl h-10 font-medium"
          >
            <X className="h-4 w-4 mr-1.5" />
            Limpiar filtros ({activeFiltersCount})
          </Button>
        )}
        <Button
          asChild
          variant={activeFiltersCount > 0 ? 'outline' : 'default'}
          className="w-full rounded-xl h-10 font-medium"
        >
          <Link to="/oportunidades">
            <Sparkles className="h-4 w-4 mr-1.5" />
            Ver recomendados
          </Link>
        </Button>
      </div>

      {/* Region navigation */}
      <div className="w-full max-w-[300px]">
        <div className="flex items-center gap-2 justify-center mb-2.5">
          <Compass className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Navega por regiones
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {POPULAR_REGIONS.map((r) => {
            const fullRegion =
              LATAM_COUNTRIES.find((c) => c.name === r.country)?.regions.find(
                (rg) =>
                  rg.toLowerCase().includes(r.label.split(' ')[0].toLowerCase()),
              ) ?? r.label;
            const inPageAction = onSelectRegion
              ? () => onSelectRegion(fullRegion)
              : undefined;
            const className =
              'px-3 h-7 rounded-full text-xs font-medium border border-border/60 bg-background hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-colors';
            return inPageAction ? (
              <button
                key={r.label}
                type="button"
                onClick={inPageAction}
                className={className}
              >
                {r.label}
              </button>
            ) : (
              <Link
                key={r.label}
                to={`/region/${slugify(fullRegion)}`}
                className={className}
              >
                {r.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface FewResultsHintProps {
  count: number;
  activeFiltersCount: number;
  onClearFilters: () => void;
}

/**
 * Slim banner shown above the list when 1–3 results are returned with filters
 * active — invites the user to broaden the search.
 */
export const FewResultsHint = ({
  count,
  activeFiltersCount,
  onClearFilters,
}: FewResultsHintProps) => {
  if (count === 0 || count > 3 || activeFiltersCount === 0) return null;

  return (
    <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5">
      <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-tight">
          Solo {count} {count === 1 ? 'terreno coincide' : 'terrenos coinciden'} con tus filtros
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
          Amplía los filtros o revisa terrenos recomendados.
        </p>
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onClearFilters}
            className="h-7 px-2.5 text-xs rounded-lg"
          >
            Limpiar filtros
          </Button>
          <Button
            size="sm"
            variant="ghost"
            asChild
            className="h-7 px-2.5 text-xs rounded-lg text-primary hover:text-primary hover:bg-primary/10"
          >
            <Link to="/oportunidades">
              <Sparkles className="h-3 w-3 mr-1" /> Recomendados
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
