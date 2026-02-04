import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  TrendingUp, 
  MapPin, 
  Star,
  ArrowRight,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Zap
} from 'lucide-react';
import { Listing, formatPrice, formatArea } from '@/hooks/useListings';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AIRecommendationsPanelProps {
  listings: Listing[];
  userPreferences?: {
    budget_min?: number;
    budget_max?: number;
    preferred_regions?: string[];
    preferred_types?: string[];
    investment_goal?: string;
  };
  onListingClick?: (listing: Listing) => void;
  className?: string;
}

interface Recommendation {
  listing: Listing;
  score: number;
  reasons: string[];
  matchType: 'investment' | 'lifestyle' | 'value' | 'trending';
}

export default function AIRecommendationsPanel({
  listings,
  userPreferences,
  onListingClick,
  className,
}: AIRecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});

  const generateRecommendations = useCallback(async () => {
    if (listings.length === 0) return;

    setIsLoading(true);

    try {
      // Score and rank listings based on various factors
      const scored = listings.map(listing => {
        let score = 0;
        const reasons: string[] = [];
        let matchType: Recommendation['matchType'] = 'value';

        // Price analysis
        const avgPrice = listings.reduce((acc, l) => acc + l.price, 0) / listings.length;
        if (listing.price < avgPrice * 0.8) {
          score += 25;
          reasons.push('Precio por debajo del promedio');
          matchType = 'value';
        }

        // Featured bonus
        if (listing.featured) {
          score += 15;
          reasons.push('Propiedad destacada');
        }

        // Recent listing
        const daysSinceCreation = (Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation < 7) {
          score += 20;
          reasons.push('Publicación reciente');
          matchType = 'trending';
        }

        // Has water rights (valuable in Chile)
        if (listing.tags?.includes('agua')) {
          score += 20;
          reasons.push('Incluye derechos de agua');
          matchType = 'investment';
        }

        // Subdivision eligible
        if (listing.subdivision_eligible) {
          score += 15;
          reasons.push('Apto para subdivisión');
          matchType = 'investment';
        }

        // Match user preferences
        if (userPreferences) {
          if (userPreferences.preferred_regions?.includes(listing.region || '')) {
            score += 25;
            reasons.push('En tu región preferida');
          }
          if (userPreferences.preferred_types?.includes(listing.type)) {
            score += 20;
            reasons.push('Tipo de terreno favorito');
          }
          if (userPreferences.budget_min && userPreferences.budget_max) {
            if (listing.price >= userPreferences.budget_min && listing.price <= userPreferences.budget_max) {
              score += 30;
              reasons.push('Dentro de tu presupuesto');
            }
          }
        }

        // High views (popular)
        if (listing.views_count > 50) {
          score += 10;
          reasons.push('Alta demanda');
          matchType = 'trending';
        }

        // Good area/price ratio
        const pricePerM2 = listing.price / (listing.area_m2 || 1);
        const avgPricePerM2 = listings.reduce((acc, l) => acc + l.price / (l.area_m2 || 1), 0) / listings.length;
        if (pricePerM2 < avgPricePerM2 * 0.7) {
          score += 20;
          reasons.push('Excelente relación precio/superficie');
          matchType = 'value';
        }

        // Lifestyle features
        if (listing.tags?.some(t => ['bosque', 'lago', 'playa', 'montaña'].includes(t))) {
          score += 10;
          matchType = 'lifestyle';
          reasons.push('Ubicación privilegiada');
        }

        return {
          listing,
          score,
          reasons: reasons.slice(0, 3), // Max 3 reasons
          matchType,
        };
      });

      // Sort by score and take top recommendations
      const topRecommendations = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

      setRecommendations(topRecommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [listings, userPreferences]);

  useEffect(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  const handleFeedback = (listingId: string, type: 'up' | 'down') => {
    setFeedback(prev => ({ ...prev, [listingId]: type }));
    // In a real implementation, this would send feedback to improve recommendations
  };

  const matchTypeConfig = {
    investment: { 
      icon: TrendingUp, 
      label: 'Inversión', 
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
    },
    lifestyle: { 
      icon: Star, 
      label: 'Estilo de vida', 
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' 
    },
    value: { 
      icon: Zap, 
      label: 'Valor', 
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
    },
    trending: { 
      icon: TrendingUp, 
      label: 'Tendencia', 
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' 
    },
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recomendaciones IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-20 w-28 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            Recomendaciones IA
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={generateRecommendations}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-3">
            {recommendations.map(({ listing, score, reasons, matchType }) => {
              const TypeIcon = matchTypeConfig[matchType].icon;
              const userFeedback = feedback[listing.id];

              return (
                <div
                  key={listing.id}
                  className={cn(
                    'group relative flex gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                    'hover:border-primary/30 hover:bg-muted/30',
                    userFeedback === 'down' && 'opacity-50'
                  )}
                  onClick={() => onListingClick?.(listing)}
                >
                  {/* Image */}
                  <div className="relative h-20 w-28 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={listing.images[0] || '/placeholder.svg'}
                      alt={listing.title}
                      className="h-full w-full object-cover"
                    />
                    <Badge
                      className={cn(
                        'absolute top-1 left-1 text-[10px] px-1.5 py-0.5',
                        matchTypeConfig[matchType].color
                      )}
                    >
                      <TypeIcon className="h-3 w-3 mr-0.5" />
                      {matchTypeConfig[matchType].label}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {listing.title}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{listing.location}</span>
                    </div>
                    
                    {/* Reasons */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {reasons.slice(0, 2).map((reason, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                        >
                          ✨ {reason}
                        </span>
                      ))}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-primary text-sm">
                        {formatPrice(listing.price)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatArea(listing.area_m2, listing.area_ha)}
                      </span>
                    </div>
                  </div>

                  {/* Feedback buttons */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className={cn(
                        'p-1 rounded hover:bg-muted',
                        userFeedback === 'up' && 'text-green-500'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeedback(listing.id, 'up');
                      }}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </button>
                    <button
                      className={cn(
                        'p-1 rounded hover:bg-muted',
                        userFeedback === 'down' && 'text-red-500'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeedback(listing.id, 'down');
                      }}
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
