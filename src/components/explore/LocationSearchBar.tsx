import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  MapPin, 
  Navigation, 
  X, 
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMapboxToken } from '@/hooks/useMapboxToken';

interface LocationSearchResult {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
  text: string;
  context?: { id: string; text: string }[];
}

interface LocationSearchBarProps {
  onLocationSelect: (location: { 
    name: string; 
    center: [number, number];
    bbox?: [number, number, number, number];
  }) => void;
  onAISearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  showAISearch?: boolean;
}

const REGIONS_CHILE = [
  { name: 'Región Metropolitana', center: [-70.6693, -33.4489] as [number, number] },
  { name: 'Valparaíso', center: [-71.6127, -33.0472] as [number, number] },
  { name: 'Biobío', center: [-73.0498, -36.8270] as [number, number] },
  { name: "O'Higgins", center: [-70.7320, -34.1708] as [number, number] },
  { name: 'Araucanía', center: [-72.5984, -38.7359] as [number, number] },
  { name: 'Los Lagos', center: [-72.9395, -41.4693] as [number, number] },
  { name: 'Coquimbo', center: [-71.2422, -30.5867] as [number, number] },
  { name: 'Maule', center: [-71.2141, -35.4265] as [number, number] },
];

export default function LocationSearchBar({
  onLocationSelect,
  onAISearch,
  placeholder = 'Buscar por ubicación, comuna o región...',
  className,
  showAISearch = true,
}: LocationSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [isAIMode, setIsAIMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { token } = useMapboxToken();
  const debounceRef = useRef<NodeJS.Timeout>();

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Geocoding search
  const searchLocation = useCallback(async (searchQuery: string) => {
    if (!token || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
        `access_token=${token}&country=cl&language=es&limit=5&types=place,locality,neighborhood,address,region`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      setResults(data.features || []);
    } catch (error) {
      console.error('Geocoding error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (!isAIMode && value.length >= 2) {
        searchLocation(value);
      }
    }, 300);
  };

  const handleSelectResult = (result: LocationSearchResult) => {
    onLocationSelect({
      name: result.place_name,
      center: result.center,
    });
    setQuery(result.text);
    setIsOpen(false);
  };

  const handleSelectRegion = (region: typeof REGIONS_CHILE[0]) => {
    onLocationSelect({
      name: region.name,
      center: region.center,
    });
    setQuery(region.name);
    setIsOpen(false);
  };

  const handleAISearch = () => {
    if (query.trim() && onAISearch) {
      onAISearch(query);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isAIMode && onAISearch) {
        handleAISearch();
      } else if (results.length > 0) {
        handleSelectResult(results[0]);
      }
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationSelect({
            name: 'Mi ubicación',
            center: [position.coords.longitude, position.coords.latitude],
          });
          setQuery('Mi ubicación');
          setIsOpen(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <div className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors',
          isAIMode ? 'bg-primary/20' : 'bg-muted'
        )}>
          {isAIMode ? (
            <Sparkles className="h-4 w-4 text-primary" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={isAIMode ? 'Busca con IA: "Parcela cerca del mar en Valparaíso"' : placeholder}
          className={cn(
            'pl-12 pr-24 h-12 text-base rounded-xl transition-all',
            isAIMode && 'border-primary/50 ring-2 ring-primary/20'
          )}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          {showAISearch && (
            <Button
              variant={isAIMode ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-8 text-xs rounded-lg transition-all',
                isAIMode && 'bg-primary text-primary-foreground'
              )}
              onClick={() => setIsAIMode(!isAIMode)}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              IA
            </Button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <ScrollArea className="max-h-[400px]">
            {/* AI Search Button */}
            {isAIMode && query.trim() && (
              <div className="p-3 border-b border-border">
                <Button
                  onClick={handleAISearch}
                  className="w-full h-12 rounded-xl"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Buscar con IA: "{query}"
                </Button>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Search Results */}
            {!isAIMode && results.length > 0 && (
              <div className="p-2">
                <p className="text-xs text-muted-foreground px-2 py-1">Resultados</p>
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectResult(result)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{result.text}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {result.place_name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Regions + Location when empty */}
            {!query && (
              <>
                {/* User Location */}
                <div className="p-2 border-b border-border">
                  <button
                    onClick={getUserLocation}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Navigation className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Usar mi ubicación</span>
                  </button>
                </div>

                {/* Popular Regions as chips */}
                <div className="p-3">
                  <p className="text-xs text-muted-foreground mb-2">Regiones populares</p>
                  <div className="flex flex-wrap gap-1.5">
                    {REGIONS_CHILE.map((region) => (
                      <Badge
                        key={region.name}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors py-1.5 px-3"
                        onClick={() => handleSelectRegion(region)}
                      >
                        <MapPin className="h-3 w-3 mr-1 text-primary" />
                        {region.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
