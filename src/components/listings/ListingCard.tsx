import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  MapPin, 
  Ruler, 
  Eye,
  CheckCircle,
  Sparkles,
  Share2
} from 'lucide-react';
import { 
  Listing, 
  formatPrice, 
  formatArea, 
  getListingTypeLabel,
  getLegalStatusLabel 
} from '@/hooks/useListings';
import { useToggleFavorite, useFavoriteIds } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';

interface ListingCardProps {
  listing: Listing;
  onHover?: (listing: Listing | null) => void;
}

const ListingCard = ({ listing, onHover }: ListingCardProps) => {
  const { user } = useAuth();
  const { toggle, isLoading } = useToggleFavorite();
  const { data: favoriteIds = [] } = useFavoriteIds();
  const isFavorite = favoriteIds.includes(listing.id);
  const legalStatus = getLegalStatusLabel(listing.legal_status);

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
    >
      <Card className="group overflow-hidden glass border-white/10 hover:border-primary/30 transition-all duration-300 card-hover">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={listing.images[0] || '/placeholder.svg'}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {listing.featured && (
              <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Destacado
              </Badge>
            )}
            <Badge variant="secondary" className="glass">
              {getListingTypeLabel(listing.type)}
            </Badge>
          </div>

          {/* Top Right Actions */}
          <div className="absolute top-3 right-3 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 glass hover:bg-white/20"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 text-white" />
            </Button>
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 glass hover:bg-white/20 ${isFavorite ? 'text-red-500' : 'text-white'}`}
                onClick={handleFavoriteClick}
                disabled={isLoading}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
            )}
          </div>

          {/* Bottom Info on Image */}
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-2xl font-bold text-white mb-1">
              {formatPrice(listing.price, listing.currency)}
            </p>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{listing.location}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>

          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Ruler className="h-4 w-4" />
              <span>{formatArea(listing.area_m2, listing.area_ha)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{listing.views_count} vistas</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {listing.tags.slice(0, 3).map((tag) => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="text-xs border-white/10 text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
            {listing.tags.length > 3 && (
              <Badge 
                variant="outline" 
                className="text-xs border-white/10 text-muted-foreground"
              >
                +{listing.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Legal Status */}
          <div className="flex items-center justify-between">
            <Badge className={`${legalStatus.color} text-xs`}>
              {listing.legal_status === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
              {legalStatus.label}
            </Badge>
            {listing.subdivision_eligible && (
              <span className="text-xs text-primary">Apto subdivisión</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ListingCard;
