import { memo, useRef, useEffect, useState } from 'react';
import { Heart, ChevronRight, MapPin, Sparkles, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Listing, formatPrice, formatArea, getListingTypeLabel, getPricePerM2, formatPriceShort, getCountryFlag } from '@/hooks/useListings';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface QuickPropertyCardProps {
  listing: Listing;
  isHovered?: boolean;
  isSelected?: boolean;
  onHover?: (listing: Listing | null) => void;
  onClick?: (listing: Listing) => void;
  onPreview?: (listing: Listing) => void;
  layout?: 'horizontal' | 'vertical';
}

const QuickPropertyCard = memo(({
  listing,
  isHovered = false,
  isSelected = false,
  onHover,
  onClick,
  onPreview,
  layout = 'horizontal',
}: QuickPropertyCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { data: favoriteIds = [] } = useFavoriteIds();
  const { toggle: toggleFavorite } = useToggleFavorite();
  const favorite = favoriteIds.includes(listing.id);
  const [showSecondImage, setShowSecondImage] = useState(false);

  const pricePerM2 = getPricePerM2(listing.price, listing.area_m2);
  const countryFlag = getCountryFlag(listing.country);

  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(listing.id);
  };

  const hasSecondImage = listing.images.length > 1;
  const currentImage = showSecondImage && hasSecondImage ? listing.images[1] : (listing.images[0] || '/placeholder.svg');

  if (layout === 'vertical') {
    return (
      <div
        ref={cardRef}
        className={cn(
          'group relative rounded-xl overflow-hidden cursor-pointer',
          'transition-all duration-300 ease-out',
          'border border-border/30 bg-card',
          'hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5',
          isHovered && 'ring-2 ring-primary/40 border-primary/20 shadow-lg',
          isSelected && 'ring-2 ring-primary border-primary/30 shadow-xl'
        )}
        onMouseEnter={() => {
          onHover?.(listing);
          if (hasSecondImage) setShowSecondImage(true);
        }}
        onMouseLeave={() => {
          onHover?.(null);
          setShowSecondImage(false);
        }}
        onClick={() => onPreview?.(listing)}
      >
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={currentImage}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Favorite button */}
          <button
            onClick={handleFavoriteClick}
            className={cn(
              'absolute top-2 right-2 p-1.5 rounded-full transition-all',
              'bg-black/30 backdrop-blur-sm hover:bg-black/50',
              favorite ? 'text-red-400' : 'text-white/80 hover:text-white'
            )}
          >
            <Heart className={cn('h-3.5 w-3.5', favorite && 'fill-current')} />
          </button>

          {listing.featured && (
            <Badge className="absolute top-2 left-2 h-5 px-1.5 text-[9px] font-semibold bg-amber-500/90 text-white border-0 gap-0.5">
              <Sparkles className="h-2.5 w-2.5" />
              Top
            </Badge>
          )}

          {/* Price overlay */}
          <div className="absolute bottom-2 left-2">
            <span className="text-sm font-bold text-white drop-shadow-lg">
              {formatPriceShort(listing.price, listing.currency)}
            </span>
            {pricePerM2 && (
              <span className="text-[10px] text-white/70 ml-1">
                · {formatPriceShort(pricePerM2)}/m²
              </span>
            )}
          </div>

          {listing.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm">
              1/{listing.images.length}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2.5 space-y-1">
          <h4 className="text-xs font-semibold text-foreground truncate leading-tight">
            {listing.title}
          </h4>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0 text-primary/60" />
            <span className="truncate">{listing.city || listing.region || listing.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>{countryFlag}</span>
            <span>{getListingTypeLabel(listing.type)}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="font-medium">{formatArea(listing.area_m2, listing.area_ha)}</span>
            {listing.views_count > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-0.5">
                  <Eye className="h-2.5 w-2.5" />
                  {listing.views_count}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Horizontal layout (original)
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
      onMouseEnter={() => {
        onHover?.(listing);
        if (hasSecondImage) setShowSecondImage(true);
      }}
      onMouseLeave={() => {
        onHover?.(null);
        setShowSecondImage(false);
      }}
      onClick={() => onClick?.(listing)}
    >
      {/* Thumbnail */}
      <div className="relative w-[120px] h-[88px] rounded-xl overflow-hidden flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow duration-300">
        <img
          src={currentImage}
          alt={listing.title}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {listing.featured && (
          <div className="absolute top-1.5 left-1.5">
            <Badge className="h-5 px-2 text-[10px] font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              Destacado
            </Badge>
          </div>
        )}
        {listing.images.length > 1 && (
          <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-md backdrop-blur-sm">
            1/{listing.images.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5 space-y-1">
        <div>
          <span className="font-bold text-base bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
            {formatPrice(listing.price, listing.currency)}
          </span>
          {pricePerM2 && (
            <span className="text-[11px] text-muted-foreground ml-1.5">
              {formatPriceShort(pricePerM2)}/m²
            </span>
          )}
        </div>
        <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">
          {listing.title}
        </h4>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="h-5 px-2 text-[10px] font-medium text-muted-foreground border-border/60 bg-muted/30 gap-1">
            <span className="text-xs">{countryFlag}</span>
            {getListingTypeLabel(listing.type)}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 flex-shrink-0 text-primary/60" />
            <span className="truncate">{listing.city || listing.region || listing.location}</span>
          </span>
          <span className="w-1 h-1 rounded-full bg-border flex-shrink-0" />
          <span className="flex-shrink-0 font-medium">{formatArea(listing.area_m2, listing.area_ha)}</span>
          {listing.views_count > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-border flex-shrink-0" />
              <span className="flex items-center gap-0.5 flex-shrink-0 text-muted-foreground/70">
                <Eye className="h-3 w-3" />
                {listing.views_count}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <button
          onClick={handleFavoriteClick}
          className={cn(
            'p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95',
            favorite ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
          )}
        >
          <Heart className={cn('h-4 w-4', favorite && 'fill-current')} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onPreview?.(listing); }}
          className="p-2 rounded-full transition-all duration-200 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-110 active:scale-95"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className={cn(
        'absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-primary transition-all duration-300',
        isHovered || isSelected ? 'h-12 opacity-100' : 'h-0 opacity-0'
      )} />
    </div>
  );
});

QuickPropertyCard.displayName = 'QuickPropertyCard';

export default QuickPropertyCard;
