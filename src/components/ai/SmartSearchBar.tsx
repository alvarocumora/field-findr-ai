import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, Loader2, MapPin, DollarSign, Maximize2 } from 'lucide-react';
import { useSmartSearch } from '@/hooks/useAI';

interface SmartSearchBarProps {
  onSearchComplete?: (result: NonNullable<ReturnType<typeof useSmartSearch>['result']>) => void;
  className?: string;
}

export const SmartSearchBar = ({ onSearchComplete, className = '' }: SmartSearchBarProps) => {
  const { result, isLoading, search } = useSmartSearch();
  const [query, setQuery] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const searchResult = await search(query);
    if (searchResult && onSearchComplete) {
      onSearchComplete(searchResult);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return `$${price.toLocaleString('es-CL')}`;
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca con IA: 'Parcela con agua cerca de Santiago por menos de 100 millones'"
            className="pl-12 pr-24 h-14 text-lg rounded-xl border-2 focus:border-primary"
          />
          <Button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2"
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
      </form>

      {result && (
        <Card className="mt-4">
          <CardContent className="pt-4">
            <div className="space-y-4">
              <p className="text-sm">{result.suggestion}</p>
              
              <div className="flex flex-wrap gap-2">
                {result.intent && (
                  <Badge variant="secondary">
                    Intención: {result.intent}
                  </Badge>
                )}
                {result.propertyType?.map((type: string) => (
                  <Badge key={type} variant="outline">
                    {type}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {result.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{result.location}</span>
                  </div>
                )}
                {(result.priceRange.min || result.priceRange.max) && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {formatPrice(result.priceRange.min)} - {formatPrice(result.priceRange.max)}
                    </span>
                  </div>
                )}
                {(result.areaRange.min || result.areaRange.max) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Maximize2 className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {result.areaRange.min?.toLocaleString()} - {result.areaRange.max?.toLocaleString()} m²
                    </span>
                  </div>
                )}
              </div>

              {result.features.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {result.features.map((feature: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
