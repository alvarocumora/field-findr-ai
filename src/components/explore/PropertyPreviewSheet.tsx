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
  Mail,
  MessageCircle,
  Eye,
  TrendingUp
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
import { Listing, formatPrice, formatArea, getListingTypeLabel, getPricePerM2, formatPriceShort, getCountryFlag } from '@/hooks/useListings';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { whatsapp } from '@/lib/whatsappUtils';
import { cn } from '@/lib/utils';

interface PropertyPreviewSheetProps {
  listing: Listing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewDetails?: (listing: Listing) => void;
  similarListings?: Listing[];
}

const PropertyPreviewSheet = ({
  listing,
  open,
  onOpenChange,
  onViewDetails,
  similarListings = [],
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
  const pricePerM2 = getPricePerM2(listing.price, listing.area_m2);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

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

  const handleWhatsApp = () => {
    const url = whatsapp.listingInquiry({
      title: listing.title,
      price: listing.price,
      currency: listing.currency || 'CLP',
      area: listing.area_m2,
      location: listing.location,
    });
    window.open(url, '_blank');
  };

  // Handle touch swipe for gallery
  let touchStartX = 0;
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? nextImage() : prevImage();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md p-0 border-l border-border/30 bg-background/95 backdrop-blur-xl"
      >
        {/* Image Gallery with swipe */}
        <div 
          className="relative h-56 bg-muted"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={images[currentImageIndex]}
            alt={listing.title}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {images.length > 1 && (
            <>
              <Button variant="ghost" size="icon" className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50" onClick={prevImage}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50" onClick={nextImage}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
                    )}
                    onClick={() => setCurrentImageIndex(idx)}
                  />
                ))}
              </div>
            </>
          )}

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
              <div className="flex items-center gap-2">
                <span className="text-sm">{getCountryFlag(listing.country)}</span>
                <Badge variant="outline" className="text-xs">
                  {getListingTypeLabel(listing.type)}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className={cn('h-8 w-8 rounded-full', favorite && 'text-red-500')} onClick={() => toggleFavorite(listing.id)}>
                  <Heart className={cn('h-4 w-4', favorite && 'fill-current')} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-foreground mb-1">{listing.title}</h2>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{listing.city || listing.location}</span>
              {listing.region && (<><span>•</span><span>{listing.region}</span></>)}
            </div>
          </div>

          {/* Price */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-2xl font-bold text-primary">
              {formatPrice(listing.price, listing.currency)}
            </p>
            {pricePerM2 && (
              <p className="text-sm text-muted-foreground">
                {formatPrice(pricePerM2)}/m²
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
                {new Date(listing.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            {listing.views_count > 0 && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="text-xs">Vistas</span>
                </div>
                <p className="text-sm font-medium text-foreground">{listing.views_count}</p>
              </div>
            )}
            {pricePerM2 && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-xs">Precio/m²</span>
                </div>
                <p className="text-sm font-medium text-foreground">{formatPriceShort(pricePerM2)}</p>
              </div>
            )}
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
                  <Badge key={tag} variant="secondary" className="text-xs capitalize">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description Preview */}
          {listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">{listing.description}</p>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <Button className="w-full h-11 rounded-xl gap-2" onClick={handleViewDetails}>
              <ExternalLink className="h-4 w-4" />
              Ver Detalle Completo
            </Button>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="h-10 rounded-xl gap-1.5 text-xs">
                <Phone className="h-3.5 w-3.5" />
                Llamar
              </Button>
              <Button variant="outline" className="h-10 rounded-xl gap-1.5 text-xs" onClick={handleWhatsApp}>
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </Button>
              <Button variant="outline" className="h-10 rounded-xl gap-1.5 text-xs">
                <Mail className="h-3.5 w-3.5" />
                Email
              </Button>
            </div>
          </div>

          {/* Similar Properties */}
          {similarListings.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Propiedades similares</h3>
                <div className="space-y-2">
                  {similarListings.slice(0, 3).map(sim => (
                    <div 
                      key={sim.id} 
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        onOpenChange(false);
                        setTimeout(() => onViewDetails?.(sim), 200);
                      }}
                    >
                      <img src={sim.images[0] || '/placeholder.svg'} alt={sim.title} className="w-14 h-14 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{sim.title}</p>
                        <p className="text-xs text-primary font-semibold">{formatPriceShort(sim.price)}</p>
                        <p className="text-[11px] text-muted-foreground">{formatArea(sim.area_m2, sim.area_ha)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PropertyPreviewSheet;
