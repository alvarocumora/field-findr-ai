import { memo, useRef, useEffect } from 'react';
import { Heart, ChevronRight, MapPin, Sparkles } from 'lucide-react';
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
        'group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer',
        'transition-all duration-300 ease-out',
        'border border-transparent',
        'hover:bg-accent/8 hover:border-primary/15 hover:shadow-lg hover:shadow-primary/5',
        isHovered && 'ring-2 ring-primary/40 bg-primary/8 border-primary/20 shadow-lg shadow-primary/10 scale-[1.01]',
        isSelected && 'ring-2 ring-primary bg-primary/12 border-primary/30 shadow-xl shadow-primary/15 scale-[1.02]'
      )}
      onMouseEnter={() => onHover?.(listing)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onClick?.(listing)}
    >
      {/* Thumbnail with gradient overlay */}
      <div className="relative w-24 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow duration-300">
        <img
          src={listing.images[0] || '/placeholder.svg'}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {listing.featured && (
          <div className="absolute top-1.5 left-1.5">
            <Badge className="h-5 px-2 text-[10px] font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              Destacado
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5 space-y-1.5">
        {/* Price and Type row */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-base bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
            {formatPrice(listing.price, listing.currency)}
          </span>
          <Badge 
            variant="outline" 
            className="h-5 px-2 text-[10px] font-medium text-muted-foreground border-border/60 bg-muted/30"
          >
            {getListingTypeLabel(listing.type)}
          </Badge>
        </div>

        {/* Title - truncated */}
        <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">
          {listing.title}
        </h4>

        {/* Location and Area */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 flex-shrink-0 text-primary/60" />
            <span className="truncate">
              {listing.city || listing.region || listing.location}
            </span>
          </span>
          <span className="w-1 h-1 rounded-full bg-border flex-shrink-0" />
          <span className="flex-shrink-0 font-medium">
            {formatArea(listing.area_m2, listing.area_ha)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <button
          onClick={handleFavoriteClick}
          className={cn(
            'p-2 rounded-full transition-all duration-200',
            'hover:scale-110 active:scale-95',
            favorite 
              ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' 
              : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
          )}
        >
          <Heart className={cn('h-4 w-4', favorite && 'fill-current')} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview?.(listing);
          }}
          className={cn(
            'p-2 rounded-full transition-all duration-200',
            'text-muted-foreground hover:text-primary hover:bg-primary/10',
            'hover:scale-110 active:scale-95'
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Hover indicator line with animation */}
      <div 
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-primary transition-all duration-300',
          isHovered || isSelected ? 'h-12 opacity-100' : 'h-0 opacity-0'
        )}
      />

      {/* Subtle glow effect on hover */}
      <div 
        className={cn(
          'absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none',
          'bg-gradient-to-r from-primary/5 via-transparent to-accent/5',
          isHovered || isSelected ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
});

QuickPropertyCard.displayName = 'QuickPropertyCard';

export default QuickPropertyCard;
