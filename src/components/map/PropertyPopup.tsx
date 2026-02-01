import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  ExternalLink, 
  MapPin, 
  Ruler, 
  Tag,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyPopupProps {
  id: string;
  title: string;
  location: string;
  price: string;
  area?: string;
  type?: string;
  status?: 'available' | 'reserved' | 'sold';
  imageUrl?: string;
  tags?: string[];
  onView?: (id: string) => void;
  onFavorite?: (id: string) => void;
  onContact?: (id: string) => void;
  isFavorite?: boolean;
  className?: string;
}

const getStatusStyles = (status?: PropertyPopupProps['status']) => {
  switch (status) {
    case 'available':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'reserved':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'sold':
      return 'bg-red-500/10 text-red-600 border-red-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getStatusLabel = (status?: PropertyPopupProps['status']) => {
  switch (status) {
    case 'available': return 'Disponible';
    case 'reserved': return 'Reservado';
    case 'sold': return 'Vendido';
    default: return null;
  }
};

export const PropertyPopup = ({
  id,
  title,
  location,
  price,
  area,
  type,
  status,
  imageUrl,
  tags = [],
  onView,
  onFavorite,
  onContact,
  isFavorite = false,
  className
}: PropertyPopupProps) => {
  const statusLabel = getStatusLabel(status);
  
  return (
    <div className={cn('map-popup animate-scale-in', className)}>
      {/* Image */}
      {imageUrl && (
        <div className="relative">
          <img 
            src={imageUrl} 
            alt={title}
            className="map-popup-image"
            loading="lazy"
          />
          {/* Overlays on image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* Status Badge */}
          {statusLabel && (
            <Badge 
              className={cn(
                'absolute top-2 left-2 text-xs',
                getStatusStyles(status)
              )}
            >
              {statusLabel}
            </Badge>
          )}
          
          {/* Favorite Button */}
          {onFavorite && (
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                'absolute top-2 right-2 h-8 w-8',
                'bg-black/30 hover:bg-black/50 backdrop-blur-sm',
                isFavorite ? 'text-red-500' : 'text-white'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(id);
              }}
            >
              <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
            </Button>
          )}
          
          {/* Price on image */}
          <div className="absolute bottom-2 left-2">
            <p className="text-lg font-bold text-white drop-shadow-lg">{price}</p>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="map-popup-content">
        {/* Title & Location */}
        <div className="space-y-1">
          <h4 className="font-semibold text-sm line-clamp-1">{title}</h4>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>
        
        {/* Price (if no image) */}
        {!imageUrl && (
          <p className="text-xl font-bold text-primary">{price}</p>
        )}
        
        {/* Details */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {area && (
            <span className="flex items-center gap-1">
              <Ruler className="h-3 w-3" />
              {area}
            </span>
          )}
          {type && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {type}
            </span>
          )}
        </div>
        
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {onView && (
            <Button
              size="sm"
              className="flex-1 gap-1 h-8"
              onClick={(e) => {
                e.stopPropagation();
                onView(id);
              }}
            >
              <Eye className="h-3 w-3" />
              Ver Detalles
            </Button>
          )}
          {onContact && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 h-8"
              onClick={(e) => {
                e.stopPropagation();
                onContact(id);
              }}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyPopup;
