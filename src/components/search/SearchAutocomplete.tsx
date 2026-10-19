import { useState, useCallback, useRef, useEffect, useMemo, KeyboardEvent } from 'react';
import { Search, MapPin, Clock, X, Loader2, Command, Sparkles, TrendingUp, ArrowRight, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { formatPriceShort } from '@/hooks/useListings';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  location: string;
  region: string | null;
  city: string | null;
  price: number;
  currency: string;
  type: string;
  area_m2: number | null;
  images: string[] | null;
}

interface SearchAutocompleteProps {
  onSearchChange?: (query: string) => void;
  placeholder?: string;
  className?: string;
  /** Prefill (e.g. from `/explorar?q=`). */
  initialQuery?: string;
}

const RECENT_SEARCHES_KEY = 'terreno-recent-searches';
const MAX_RECENT = 5;

const POPULAR_SUGGESTIONS: { label: string; hint: string }[] = [
  { label: 'Parcelas en Colina', hint: 'Región Metropolitana' },
  { label: 'Terrenos en Pucón', hint: 'Araucanía' },
  { label: 'Sitios en Algarrobo', hint: 'Valparaíso' },
  { label: 'Campos en Los Ángeles', hint: 'Biobío' },
  { label: 'Loteos en Chicureo', hint: 'RM Norte' },
];

const getRecentSearches = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch { return []; }
};

const saveRecentSearch = (query: string): string[] => {
  const q = query.trim();
  if (!q) return getRecentSearches();
  const recent = getRecentSearches().filter(s => s.toLowerCase() !== q.toLowerCase());
  recent.unshift(q);
  const next = recent.slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  return next;
};

const clearRecentSearches = () => {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
};

/** Highlights the first case-insensitive occurrence of `q` inside `text`. */
const Highlight = ({ text, q }: { text: string; q: string }) => {
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-foreground rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
};

const SearchAutocomplete = ({
  onSearchChange,
  placeholder = 'Buscar terrenos, ubicaciones…',
  className,
  initialQuery = '',
}: SearchAutocompleteProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<SearchResult[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setProperties([]);
      setLocations([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await supabase.functions.invoke('search-autocomplete', {
        body: { query: q, limit: 6 },
      });
      setProperties(data?.properties || []);
      setLocations(data?.locations || []);
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    onSearchChange?.(value);
    setIsOpen(true);
    setActiveIndex(-1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 250);
  };

  const commitQuery = (q: string) => {
    setQuery(q);
    onSearchChange?.(q);
    setRecentSearches(saveRecentSearch(q));
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleSelectProperty = (propertyId: string) => {
    setRecentSearches(saveRecentSearch(query));
    setIsOpen(false);
    navigate(`/propiedad/${propertyId}`);
  };

  const handleLocationSelect = (location: string) => {
    commitQuery(location);
  };

  const handleRecentSelect = (recent: string) => {
    setQuery(recent);
    onSearchChange?.(recent);
    setIsOpen(true);
    setActiveIndex(-1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(recent), 0);
  };

  // Flat list of navigable items for keyboard control
  type Item =
    | { kind: 'submit' }
    | { kind: 'recent'; value: string }
    | { kind: 'suggestion'; value: string; hint?: string }
    | { kind: 'location'; value: string }
    | { kind: 'property'; value: SearchResult };

  const items: Item[] = useMemo(() => {
    const list: Item[] = [];
    const hasQ = query.trim().length >= 2;
    if (hasQ) list.push({ kind: 'submit' });
    if (!hasQ) {
      recentSearches.forEach(r => list.push({ kind: 'recent', value: r }));
      POPULAR_SUGGESTIONS.forEach(s => list.push({ kind: 'suggestion', value: s.label, hint: s.hint }));
    }
    locations.forEach(l => list.push({ kind: 'location', value: l }));
    properties.forEach(p => list.push({ kind: 'property', value: p }));
    return list;
  }, [query, recentSearches, locations, properties]);

  const activateItem = (item: Item) => {
    switch (item.kind) {
      case 'submit': commitQuery(query); break;
      case 'recent': handleRecentSelect(item.value); break;
      case 'suggestion': commitQuery(item.value); break;
      case 'location': handleLocationSelect(item.value); break;
      case 'property': handleSelectProperty(item.value.id); break;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex(i => Math.min((i < 0 ? -1 : i) + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) activateItem(items[activeIndex]);
      else if (query.trim()) commitQuery(query);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (!listboxRef.current || activeIndex < 0) return;
    const el = listboxRef.current.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Global ⌘K / Ctrl+K to focus
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const hasResults = properties.length > 0 || locations.length > 0;
  const hasQ = query.trim().length >= 2;
  const showEmptyState = hasQ && !isLoading && !hasResults;
  const showDropdown = isOpen && (hasQ || recentSearches.length > 0 || isLoading);

  // Compute item index offsets for aria/highlight lookup
  const submitIdx = hasQ ? 0 : -1;
  const recentsStart = !hasQ ? 0 : -1;
  const suggestionsStart = !hasQ ? recentSearches.length : -1;
  const locationsStart = (hasQ ? 1 : recentSearches.length + POPULAR_SUGGESTIONS.length);
  const propertiesStart = locationsStart + locations.length;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input */}
      <div
        className={cn(
          'relative flex items-center rounded-2xl border transition-all',
          'bg-muted/40 border-border/40',
          isOpen && 'bg-background border-primary/50 shadow-lg shadow-primary/5',
        )}
      >
        <Search className={cn(
          'absolute left-3.5 h-4 w-4 transition-colors',
          isOpen ? 'text-primary' : 'text-muted-foreground'
        )} />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-listbox"
          aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
          className="pl-10 pr-24 h-11 rounded-2xl bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {isLoading && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
          {query && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onSearchChange?.('');
                setProperties([]);
                setLocations([]);
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {!query && (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-background/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          id="search-listbox"
          ref={listboxRef}
          role="listbox"
          className={cn(
            'absolute top-full left-0 right-0 mt-2 bg-popover border border-border/60 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[440px] overflow-y-auto',
            'animate-in fade-in-0 zoom-in-95 slide-in-from-top-1'
          )}
        >
          {/* Submit current query */}
          {hasQ && (
            <button
              type="button"
              data-idx={submitIdx}
              id={`search-item-${submitIdx}`}
              onMouseEnter={() => setActiveIndex(submitIdx)}
              onClick={() => commitQuery(query)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-b border-border/30',
                activeIndex === submitIdx ? 'bg-primary/10' : 'hover:bg-muted/50'
              )}
            >
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Search className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="flex-1 min-w-0 truncate">
                Buscar <span className="font-semibold text-foreground">“{query}”</span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          {/* Recents & suggestions (empty state) */}
          {!hasQ && (
            <>
              {recentSearches.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Recientes</p>
                    <button
                      type="button"
                      onClick={() => { clearRecentSearches(); setRecentSearches([]); }}
                      className="text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Limpiar
                    </button>
                  </div>
                  {recentSearches.map((recent, i) => {
                    const idx = recentsStart + i;
                    return (
                      <button
                        key={recent}
                        type="button"
                        data-idx={idx}
                        id={`search-item-${idx}`}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => handleRecentSelect(recent)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground rounded-lg transition-colors',
                          activeIndex === idx ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                        )}
                      >
                        <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="truncate flex-1 text-left">{recent}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="p-2 border-t border-border/30">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-2 py-1 flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3" /> Populares
                </p>
                {POPULAR_SUGGESTIONS.map((s, i) => {
                  const idx = suggestionsStart + i;
                  return (
                    <button
                      key={s.label}
                      type="button"
                      data-idx={idx}
                      id={`search-item-${idx}`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => commitQuery(s.label)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left',
                        activeIndex === idx ? 'bg-primary/10' : 'hover:bg-muted/50'
                      )}
                    >
                      <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-3 w-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{s.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{s.hint}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Locations */}
          {locations.length > 0 && (
            <div className="p-2 border-t border-border/30">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-2 py-1">
                Ubicaciones
              </p>
              {locations.map((loc, i) => {
                const idx = locationsStart + i;
                return (
                  <button
                    key={loc}
                    type="button"
                    data-idx={idx}
                    id={`search-item-${idx}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleLocationSelect(loc)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-left',
                      activeIndex === idx ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-foreground'
                    )}
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="truncate flex-1">
                      <Highlight text={loc} q={query} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Properties */}
          {properties.length > 0 && (
            <div className="p-2 border-t border-border/30">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-2 py-1">
                Propiedades
              </p>
              {properties.map((prop, i) => {
                const idx = propertiesStart + i;
                return (
                  <button
                    key={prop.id}
                    type="button"
                    data-idx={idx}
                    id={`search-item-${idx}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleSelectProperty(prop.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                      activeIndex === idx ? 'bg-primary/10' : 'hover:bg-muted/50'
                    )}
                  >
                    <div className="w-12 h-9 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={prop.images?.[0] || '/placeholder.svg'}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        <Highlight text={prop.title} q={query} />
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        <Highlight text={prop.location} q={query} /> · {formatPriceShort(prop.price, prop.currency)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Loading (initial) */}
          {isLoading && !hasResults && (
            <div className="p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-xs">Buscando…</p>
            </div>
          )}

          {/* Empty state */}
          {showEmptyState && (
            <div className="p-6 flex flex-col items-center justify-center gap-2 text-center">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Sin coincidencias directas</p>
              <p className="text-xs text-muted-foreground max-w-[280px]">
                Puedes buscar igualmente en el marketplace y filtrar los resultados con los chips de abajo.
              </p>
              <button
                type="button"
                onClick={() => commitQuery(query)}
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Buscar “{query}” de todos modos <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Footer hint */}
          <div className="hidden md:flex items-center justify-between gap-2 px-4 py-2 text-[10px] text-muted-foreground bg-muted/30 border-t border-border/30">
            <span className="flex items-center gap-2">
              <kbd className="rounded border border-border/60 bg-background px-1">↑↓</kbd> navegar
              <kbd className="rounded border border-border/60 bg-background px-1">↵</kbd> abrir
              <kbd className="rounded border border-border/60 bg-background px-1">Esc</kbd> cerrar
            </span>
            <span>Ideas para hoy · Ver más filtros abajo</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
