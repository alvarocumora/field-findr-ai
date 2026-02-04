import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Share2, 
  ExternalLink, 
  MapPin, 
  Ruler, 
  Calendar, 
  Tag,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Listing, formatPrice, formatArea, getListingTypeLabel } from '@/hooks/useListings';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

interface PropertyPreviewSheetProps {
  listing: Listing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewDetails?: (listing: Listing) => void;
}

const PropertyPreviewSheet = ({
  listing,
  open,
  onOpenChange,
  onViewDetails,
}: PropertyPreviewSheetProps) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { data: favoriteIds = [] } = useFavoriteIds();
  const { toggle: toggleFavorite } = useToggleFavorite();
  
  const favorite = useMemo(() => {
    return listing ? favoriteIds.includes(listing.id) : false;
  }, [listing, favoriteIds]);

  if (!listing) return null;
  const images = listing.images.length > 0 ? listing.images : ['/placeholder.svg'];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(listing);
    } else {
      navigate(`/propiedad/${listing.id}`);
    }
    onOpenChange(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/propiedad/${listing.id}`;
    if (navigator.share) {
      await navigator.share({
        title: listing.title,
        text: `${listing.title} - ${formatPrice(listing.price)}`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md p-0 border-l border-border/30 bg-background/95 backdrop-blur-xl"
      >
        {/* Image Gallery */}
        <div className="relative h-56 bg-muted">
          <img
            src={images[currentImageIndex]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Image navigation */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50"
                onClick={prevImage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50"
                onClick={nextImage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              {/* Dots indicator */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      idx === currentImageIndex 
                        ? 'w-4 bg-white' 
                        : 'w-1.5 bg-white/50 hover:bg-white/70'
                    )}
                    onClick={() => setCurrentImageIndex(idx)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Featured badge */}
          {listing.featured && (
            <Badge className="absolute top-3 left-3 bg-amber-500/90 text-white border-0">
              Destacado
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-224px)]">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <Badge variant="outline" className="text-xs">
                {getListingTypeLabel(listing.type)}
              </Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 rounded-full',
                    favorite && 'text-red-500'
                  )}
                  onClick={() => toggleFavorite(listing.id)}
                >
                  <Heart className={cn('h-4 w-4', favorite && 'fill-current')} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-foreground mb-1">
              {listing.title}
            </h2>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{listing.city || listing.location}</span>
              {listing.region && (
                <>
                  <span>•</span>
                  <span>{listing.region}</span>
                </>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-2xl font-bold text-primary">
              {formatPrice(listing.price, listing.currency)}
            </p>
            {listing.area_m2 && (
              <p className="text-sm text-muted-foreground">
                {formatPrice(Math.round(listing.price / listing.area_m2))}/m²
              </p>
            )}
          </div>

          {/* Quick Facts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Ruler className="h-3.5 w-3.5" />
                <span className="text-xs">Superficie</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                {formatArea(listing.area_m2, listing.area_ha)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs">Publicado</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                {new Date(listing.created_at).toLocaleDateString('es-CL', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Tags */}
          {listing.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Tag className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Características</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {listing.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description Preview */}
          {listing.description && (
            <div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {listing.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              className="w-full h-11 rounded-xl gap-2"
              onClick={handleViewDetails}
            >
              <ExternalLink className="h-4 w-4" />
              Ver Detalle Completo
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-10 rounded-xl gap-2">
                <Phone className="h-4 w-4" />
                Llamar
              </Button>
              <Button variant="outline" className="h-10 rounded-xl gap-2">
                <Mail className="h-4 w-4" />
                Contactar
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PropertyPreviewSheet;
