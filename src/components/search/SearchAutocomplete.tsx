import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, Home, Clock, X, Loader2 } from 'lucide-react';
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
}

const RECENT_SEARCHES_KEY = 'terreno-recent-searches';
const MAX_RECENT = 5;

const getRecentSearches = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
  } catch { return []; }
};

const addRecentSearch = (query: string) => {
  const recent = getRecentSearches().filter(s => s !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
};

const SearchAutocomplete = ({ onSearchChange, placeholder = 'Buscar terrenos, ubicaciones...', className }: SearchAutocompleteProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<SearchResult[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [recentSearches] = useState(getRecentSearches);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setProperties([]);
      setLocations([]);
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await supabase.functions.invoke('search-autocomplete', {
        body: { query: q, limit: 8 },
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
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (propertyId: string) => {
    addRecentSearch(query);
    setIsOpen(false);
    navigate(`/propiedad/${propertyId}`);
  };

  const handleLocationSelect = (location: string) => {
    setQuery(location);
    onSearchChange?.(location);
    addRecentSearch(location);
    setIsOpen(false);
  };

  const handleRecentSelect = (recent: string) => {
    setQuery(recent);
    onSearchChange?.(recent);
    handleChange(recent);
  };

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

  const hasResults = properties.length > 0 || locations.length > 0;
  const showDropdown = isOpen && (hasResults || (query.length === 0 && recentSearches.length > 0) || isLoading);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-10 h-11 rounded-xl bg-muted/40 border-border/40 focus:bg-background"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); onSearchChange?.(''); setProperties([]); setLocations([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-9 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-[400px] overflow-y-auto">
          {/* Recent Searches */}
          {query.length === 0 && recentSearches.length > 0 && (
            <div className="p-2">
              <p className="text-[11px] font-medium text-muted-foreground px-2 py-1">Búsquedas recientes</p>
              {recentSearches.map((recent) => (
                <button
                  key={recent}
                  onClick={() => handleRecentSelect(recent)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {recent}
                </button>
              ))}
            </div>
          )}

          {/* Locations */}
          {locations.length > 0 && (
            <div className="p-2 border-b border-border/30">
              <p className="text-[11px] font-medium text-muted-foreground px-2 py-1">Ubicaciones</p>
              {locations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocationSelect(loc)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {loc}
                </button>
              ))}
            </div>
          )}

          {/* Properties */}
          {properties.length > 0 && (
            <div className="p-2">
              <p className="text-[11px] font-medium text-muted-foreground px-2 py-1">Propiedades</p>
              {properties.map((prop) => (
                <button
                  key={prop.id}
                  onClick={() => handleSelect(prop.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <div className="w-12 h-9 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={prop.images?.[0] || '/placeholder.svg'}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{prop.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {prop.location} · {formatPriceShort(prop.price, prop.currency)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {isLoading && !hasResults && (
            <div className="p-6 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
