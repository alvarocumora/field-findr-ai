import { MapPin, Maximize2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Listing, formatPrice, formatArea, getListingTypeLabel } from '@/hooks/useListings';
import { cn } from '@/lib/utils';

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
  const imageUrl = listing.images?.[0] || '/placeholder.svg';

  return (
    <div
      onClick={() => onSelect(listing)}
      className={cn(
        "relative w-[160px] h-[200px] shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 snap-start",
        "bg-card border shadow-sm",
        isSelected 
          ? "ring-2 ring-primary border-primary/50 scale-[1.02]" 
          : "border-border/40 hover:border-border active:scale-[0.98]"
      )}
    >
      {/* Image section */}
      <div className="relative h-[110px] overflow-hidden">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Price overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-6 pb-2 px-2">
          <p className="text-white font-bold text-sm leading-tight">
            {formatPrice(listing.price, listing.currency)}
          </p>
        </div>

        {/* Featured badge */}
        {listing.featured && (
          <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] h-5 px-1.5">
            Destacado
          </Badge>
        )}

        {/* Navigate to detail button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(listing);
          }}
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
          aria-label="Ver detalles"
        >
          <Maximize2 className="h-3.5 w-3.5 text-foreground" />
        </button>
      </div>

      {/* Info section */}
      <div className="p-2.5 space-y-1.5">
        <h4 className="font-medium text-sm leading-tight line-clamp-2 text-foreground">
          {listing.title}
        </h4>

        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="text-xs truncate">
            {listing.city || listing.location}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatArea(listing.area_m2, listing.area_ha)}
          </span>
          <Badge 
            variant="outline" 
            className="text-[10px] h-5 px-1.5 border-border/50 text-muted-foreground"
          >
            {getListingTypeLabel(listing.type).split(' ')[0]}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default CompactListingCard;
