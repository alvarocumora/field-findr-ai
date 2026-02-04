import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Sparkles, 
  Loader2, 
  MapPin, 
  DollarSign, 
  Maximize2,
  ArrowRight,
  X,
  Lightbulb,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SearchResult {
  intent: 'comprar' | 'arrendar' | 'invertir' | 'información';
  propertyType: string[] | null;
  location: string | null;
  priceRange: { min: number | null; max: number | null };
  areaRange: { min: number | null; max: number | null };
  features: string[];
  keywords: string[];
  suggestion: string;
}

interface EnhancedAISearchProps {
  onSearchComplete?: (result: SearchResult) => void;
  onApplyFilters?: (filters: {
    types?: string[];
    regions?: string[];
    priceRange?: [number, number];
    areaRange?: [number, number];
    tags?: string[];
  }) => void;
  className?: string;
  variant?: 'full' | 'compact';
}

const EXAMPLE_QUERIES = [
  'Parcela con agua cerca de Santiago por menos de 100 millones',
  'Terreno costero en la V región para inversión',
  'Campo agrícola con derechos de agua en el sur',
  'Sitio industrial cerca de autopista en Maipú',
];

export default function EnhancedAISearch({
  onSearchComplete,
  onApplyFilters,
  className,
  variant = 'full',
}: EnhancedAISearchProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [showExamples, setShowExamples] = useState(false);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { type: 'search', searchQuery },
      });

      if (error) throw error;

      setResult(data);
      onSearchComplete?.(data);
    } catch (error) {
      console.error('AI search error:', error);
      toast.error('Error en la búsqueda IA');
    } finally {
      setIsLoading(false);
    }
  }, [onSearchComplete]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleApplyFilters = () => {
    if (!result || !onApplyFilters) return;

    const filters: Parameters<typeof onApplyFilters>[0] = {};

    if (result.propertyType?.length) {
      // Map AI property types to app types
      const typeMapping: Record<string, string> = {
        'parcela': 'parcela_rural',
        'agrícola': 'campo_agricola',
        'industrial': 'sitio_industrial',
        'residencial': 'terreno_urbano',
        'comercial': 'terreno_urbano',
        'costero': 'terreno_costero',
      };

      filters.types = result.propertyType
        .map(t => typeMapping[t.toLowerCase()] || t)
        .filter(Boolean);
    }

    if (result.location) {
      filters.regions = [result.location];
    }

    if (result.priceRange.min || result.priceRange.max) {
      filters.priceRange = [
        result.priceRange.min || 0,
        result.priceRange.max || 5000000000,
      ];
    }

    if (result.areaRange.min || result.areaRange.max) {
      filters.areaRange = [
        result.areaRange.min || 0,
        result.areaRange.max || 1000000,
      ];
    }

    if (result.features?.length) {
      filters.tags = result.features;
    }

    onApplyFilters(filters);
    toast.success('Filtros aplicados desde búsqueda IA');
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    if (price >= 1000000000) return `$${(price / 1000000000).toFixed(1)}B`;
    if (price >= 1000000) return `$${(price / 1000000).toFixed(0)}M`;
    return `$${price.toLocaleString('es-CL')}`;
  };

  if (variant === 'compact') {
    return (
      <div className={cn('relative', className)}>
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca con IA..."
              className="pl-12 pr-12 h-12 rounded-xl border-2 focus:border-primary"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit}>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 group-focus-within:from-primary/30 group-focus-within:to-primary/10 transition-all">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowExamples(true)}
            onBlur={() => setTimeout(() => setShowExamples(false), 200)}
            placeholder='Busca con IA: "Parcela con agua cerca de Santiago por menos de 100 millones"'
            className="pl-16 pr-28 h-14 text-base rounded-2xl border-2 border-border/50 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setQuery('');
                  setResult(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Example Queries */}
        {showExamples && !query && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Lightbulb className="h-3 w-3" /> Ejemplos:
            </span>
            {EXAMPLE_QUERIES.map((example, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(example);
                  handleSearch(example);
                }}
                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Loading State */}
      {isLoading && (
        <Card className="mt-4">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !isLoading && (
        <Card className="mt-4 border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardContent className="pt-4">
            <div className="space-y-4">
              {/* AI Suggestion */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm flex-1">{result.suggestion}</p>
              </div>

              {/* Intent and Types */}
              <div className="flex flex-wrap gap-2">
                {result.intent && (
                  <Badge className="bg-primary/20 text-primary border-0">
                    {result.intent === 'comprar' && '🏠 Comprar'}
                    {result.intent === 'invertir' && '📈 Invertir'}
                    {result.intent === 'arrendar' && '🔑 Arrendar'}
                    {result.intent === 'información' && '📋 Información'}
                  </Badge>
                )}
                {result.propertyType?.map((type: string) => (
                  <Badge key={type} variant="outline">
                    {type}
                  </Badge>
                ))}
              </div>

              {/* Extracted Criteria */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {result.location && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{result.location}</span>
                  </div>
                )}
                {(result.priceRange.min || result.priceRange.max) && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatPrice(result.priceRange.min)} - {formatPrice(result.priceRange.max)}
                    </span>
                  </div>
                )}
                {(result.areaRange.min || result.areaRange.max) && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Maximize2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {result.areaRange.min?.toLocaleString()} - {result.areaRange.max?.toLocaleString()} m²
                    </span>
                  </div>
                )}
              </div>

              {/* Features */}
              {result.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.features.map((feature: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Apply Filters Button */}
              {onApplyFilters && (
                <Button
                  onClick={handleApplyFilters}
                  className="w-full h-11 rounded-xl"
                >
                  Aplicar filtros de búsqueda
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
