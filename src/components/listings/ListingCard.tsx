import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  MapPin, 
  Ruler, 
  CheckCircle,
  Sparkles,
  Share2,
  TrendingDown
} from 'lucide-react';
import { usePriceReduced } from '@/components/property/PriceHistoryChart';
import { 
  Listing, 
  formatPrice, 
  formatArea, 
  getListingTypeLabel,
  getLegalStatusLabel 
} from '@/hooks/useListings';
import { useToggleFavorite, useFavoriteIds } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import MatchScoreBadge from '@/components/matching/MatchScoreBadge';
import { MatchResult } from '@/hooks/useMatchScore';
import { cn } from '@/lib/utils';
import { listingCoverUrl } from '@/lib/staticMapImage';
import { useStaticMapToken } from '@/hooks/useStaticMapToken';

interface ListingCardProps {
  listing: Listing;
  onHover?: (listing: Listing | null) => void;
  matchResult?: MatchResult | null;
  className?: string;
}

const ListingCard = ({ listing, onHover, matchResult, className }: ListingCardProps) => {
  const { user } = useAuth();
  const { toggle, isLoading } = useToggleFavorite();
  const { data: favoriteIds = [] } = useFavoriteIds();
  const isFavorite = favoriteIds.includes(listing.id);
  const legalStatus = getLegalStatusLabel(listing.legal_status);
  const { data: priceReduced } = usePriceReduced(listing.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      toggle(listing.id);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.share?.({
      title: listing.title,
      url: `${window.location.origin}/propiedad/${listing.id}`,
    }).catch(() => {
      navigator.clipboard.writeText(`${window.location.origin}/propiedad/${listing.id}`);
    });
  };

  return (
    <Link 
      to={`/propiedad/${listing.id}`}
      onMouseEnter={() => onHover?.(listing)}
      onMouseLeave={() => onHover?.(null)}
      className="block focus-ring rounded-xl"
    >
      <Card className={cn(
        "group overflow-hidden glass border-white/10",
        "hover:border-primary/40 hover:shadow-glow",
        "transition-all duration-300 ease-out",
        "hover:scale-[1.02]",
        "active:scale-[0.98]",
        className
      )}>
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={listingCoverUrl(listing.images, listing.lat, listing.lng, mapToken) || '/placeholder.svg'}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Gradient Overlay - Enhanced */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {listing.featured && (
              <Badge className="bg-primary text-primary-foreground flex items-center gap-1 text-xs shadow-lg">
                <Sparkles className="h-3 w-3" />
                Destacado
              </Badge>
            )}
            <Badge variant="secondary" className="glass text-xs shadow-lg">
              {getListingTypeLabel(listing.type)}
            </Badge>
            {matchResult && matchResult.score >= 50 && (
              <MatchScoreBadge 
                score={matchResult.score}
                criteria={matchResult.criteria.map(c => ({ label: c.label, matched: c.matched }))}
                size="sm"
              />
            )}
            {priceReduced && (
              <Badge className="bg-green-500/90 text-white flex items-center gap-1 text-xs shadow-lg">
                <TrendingDown className="h-3 w-3" />
                -{priceReduced.pct}%
              </Badge>
            )}
          </div>

          {/* Top Right Actions */}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 glass hover:bg-white/30 transition-colors touch-target"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 text-white" />
            </Button>
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 glass hover:bg-white/30 transition-colors touch-target",
                  isFavorite ? 'text-red-500' : 'text-white'
                )}
                onClick={handleFavoriteClick}
                disabled={isLoading}
              >
                <Heart className={cn("h-4 w-4", isFavorite && 'fill-current')} />
              </Button>
            )}
          </div>

          {/* Bottom Info on Image */}
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-xl sm:text-2xl font-bold text-white mb-1 drop-shadow-lg">
              {formatPrice(listing.price, listing.currency)}
            </p>
            <div className="flex items-center gap-1.5 text-white/90 text-sm">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{listing.location}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors text-sm sm:text-base leading-snug">
            {listing.title}
          </h3>

          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <div className="flex items-center gap-1.5">
              <Ruler className="h-4 w-4 text-primary/70" />
              <span>{formatArea(listing.area_m2, listing.area_ha)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-muted-foreground/70" />
              <span className="truncate max-w-[120px]">{listing.region || listing.city || 'Chile'}</span>
            </div>
          </div>

          {/* Price per m² */}
          {listing.area_m2 && listing.area_m2 > 0 && (
            <p className="text-xs text-muted-foreground mb-3">
              {formatPrice(Math.round(listing.price / listing.area_m2))} / m²
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {listing.tags.slice(0, 3).map((tag) => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="text-xs border-border/50 text-muted-foreground px-2 py-0.5"
              >
                {tag}
              </Badge>
            ))}
            {listing.tags.length > 3 && (
              <Badge 
                variant="outline" 
                className="text-xs border-border/50 text-muted-foreground px-2 py-0.5"
              >
                +{listing.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Legal Status */}
          <div className="flex items-center justify-between">
            <Badge className={cn(legalStatus.color, "text-xs")}>
              {listing.legal_status === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
              {legalStatus.label}
            </Badge>
            {listing.subdivision_eligible && (
              <span className="text-xs text-primary font-medium">Apto subdivisión</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ListingCard;
