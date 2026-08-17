import { useEffect, useRef } from 'react';
import { MapPin, Maximize2, Sparkles, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Listing, formatPrice, formatArea, getListingTypeLabel, getPricePerM2, formatPriceShort, getCountryFlag } from '@/hooks/useListings';
import { cn } from '@/lib/utils';
import { listingCoverUrl } from '@/lib/staticMapImage';
import { useStaticMapToken } from '@/hooks/useStaticMapToken';

interface CompactListingCardProps {
  listing: Listing;
  isSelected?: boolean;
  onSelect: (listing: Listing) => void;
  onNavigate: (listing: Listing) => void;
}

const CompactListingCard = ({
  listing,
  isSelected,
  onSelect,
  onNavigate,
}: CompactListingCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mapToken = useStaticMapToken();
  const imageUrl = listingCoverUrl(listing.images, listing.lat, listing.lng, mapToken) || '/placeholder.svg';
  const pricePerM2 = getPricePerM2(listing.price, listing.area_m2);

  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.animate([
        { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)' },
        { transform: 'scale(1.03)', boxShadow: '0 0 0 8px rgba(34, 197, 94, 0)' },
        { transform: 'scale(1.02)', boxShadow: '0 0 0 0 rgba(34, 197, 94, 0)' },
      ], { duration: 400, easing: 'ease-out' });
    }
  }, [isSelected]);

  return (
    <div
      ref={cardRef}
      onClick={() => onSelect(listing)}
      className={cn(
        "relative w-[170px] h-[220px] shrink-0 rounded-xl overflow-hidden cursor-pointer snap-start",
        "bg-card border shadow-sm",
        "transition-all duration-300 ease-out",
        isSelected 
          ? "ring-2 ring-primary border-primary/50 shadow-lg shadow-primary/20" 
          : "border-border/40 hover:border-border hover:shadow-md active:scale-[0.98]"
      )}
    >
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none z-10" />
      )}

      {/* Image section */}
      <div className="relative h-[110px] overflow-hidden">
        <img
          src={imageUrl}
          alt={listing.title}
          className={cn("w-full h-full object-cover transition-transform duration-300", isSelected && "scale-105")}
          loading="lazy"
        />
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-6 pb-2 px-2">
          <p className="text-white font-bold text-sm leading-tight">
            {formatPrice(listing.price, listing.currency)}
          </p>
          {pricePerM2 && (
            <p className="text-white/70 text-[10px]">{formatPriceShort(pricePerM2)}/m²</p>
          )}
        </div>

        {isSelected && (
          <div className="absolute top-2 left-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-lg animate-pulse">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
        )}

        {listing.featured && !isSelected && (
          <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] h-5 px-1.5">
            Destacado
          </Badge>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(listing); }}
          className={cn(
            "absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center transition-all",
            isSelected ? "bg-primary text-primary-foreground shadow-lg" : "bg-background/80 backdrop-blur-sm hover:bg-background text-foreground"
          )}
          aria-label="Ver detalles"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Info section */}
      <div className="p-2.5 space-y-1.5">
        <h4 className={cn("font-medium text-sm leading-tight line-clamp-2 transition-colors", isSelected ? "text-primary" : "text-foreground")}>
          {listing.title}
        </h4>

        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className={cn("h-3 w-3 shrink-0 transition-colors", isSelected && "text-primary")} />
          <span className="text-xs truncate">{listing.city || listing.location}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatArea(listing.area_m2, listing.area_ha)}
          </span>
          <div className="flex items-center gap-1">
            {listing.views_count > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70">
                <Eye className="h-2.5 w-2.5" />
                {listing.views_count}
              </span>
            )}
            <span className="text-[10px]">{getCountryFlag(listing.country)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactListingCard;
