import { memo, useRef, useEffect } from 'react';
import { Heart, ChevronRight, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Listing, formatPrice, formatArea, getListingTypeLabel } from '@/hooks/useListings';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface QuickPropertyCardProps {
  listing: Listing;
  isHovered?: boolean;
  isSelected?: boolean;
  onHover?: (listing: Listing | null) => void;
  onClick?: (listing: Listing) => void;
  onPreview?: (listing: Listing) => void;
}

const QuickPropertyCard = memo(({
  listing,
  isHovered = false,
  isSelected = false,
  onHover,
  onClick,
  onPreview,
}: QuickPropertyCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { data: favoriteIds = [] } = useFavoriteIds();
  const { toggle: toggleFavorite } = useToggleFavorite();
  const favorite = favoriteIds.includes(listing.id);

  // Auto-scroll into view when selected from map
  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isSelected]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(listing.id);
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'group relative flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200',
        'border border-transparent hover:border-primary/20',
        'bg-card hover:bg-accent/5',
        isHovered && 'ring-2 ring-primary/30 bg-primary/5',
        isSelected && 'ring-2 ring-primary bg-primary/10 border-primary/30'
      )}
      onMouseEnter={() => onHover?.(listing)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onClick?.(listing)}
    >
      {/* Thumbnail */}
      <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={listing.images[0] || '/placeholder.svg'}
          alt={listing.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {listing.featured && (
          <div className="absolute top-1 left-1">
            <Badge className="h-4 px-1.5 text-[9px] bg-amber-500/90 text-white border-0">
              Destacado
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        {/* Price and Type */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-sm text-primary">
            {formatPrice(listing.price, listing.currency)}
          </span>
          <Badge variant="outline" className="h-4 px-1.5 text-[9px] text-muted-foreground border-border/50">
            {getListingTypeLabel(listing.type)}
          </Badge>
        </div>

        {/* Title - truncated */}
        <h4 className="text-xs font-medium text-foreground truncate mb-0.5">
          {listing.title}
        </h4>

        {/* Location and Area */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5 truncate">
            <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
            {listing.city || listing.region || listing.location}
          </span>
          <span className="text-border">•</span>
          <span className="flex-shrink-0">
            {formatArea(listing.area_m2, listing.area_ha)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handleFavoriteClick}
          className={cn(
            'p-1.5 rounded-full transition-colors',
            favorite 
              ? 'text-red-500 hover:bg-red-500/10' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <Heart className={cn('h-3.5 w-3.5', favorite && 'fill-current')} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview?.(listing);
          }}
          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Hover indicator line for map sync */}
      {(isHovered || isSelected) && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
      )}
    </div>
  );
});

QuickPropertyCard.displayName = 'QuickPropertyCard';

export default QuickPropertyCard;
