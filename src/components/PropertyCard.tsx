import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Maximize, 
  Heart, 
  MessageCircle
} from 'lucide-react';

interface PropertyCardProps {
  property: {
    id: number;
    title: string;
    location: string;
    price: string;
    pricePerHectare: string;
    area: string;
    type: string;
    images: string[];
    features: string[];
    agent: {
      name: string;
      phone: string;
      rating: number;
      verified: boolean;
    };
    views: number;
    daysPosted: number;
    featured: boolean;
    isNew: boolean;
    waterRights: boolean;
    legalStatus: string;
  };
  variant?: 'default' | 'compact' | 'featured';
}

const PropertyCard = ({ property, variant = 'default' }: PropertyCardProps) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleWhatsApp = () => {
    const message = `Hola, me interesa: ${property.title}`;
    const url = `https://wa.me/56${property.agent.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  if (variant === 'compact') {
    return (
      <Card className="card-hover overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground truncate">{property.title}</h3>
              <p className="text-xs text-muted-foreground mb-2">{property.location}</p>
              <p className="text-sm font-semibold text-primary">{property.price}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">{property.area}</Badge>
                <Badge variant="outline" className="text-xs">{property.type}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-hover overflow-hidden">
      {/* Image Section */}
      <div className="relative">
        <div className="aspect-[4/3] relative overflow-hidden">
          <img
            src={property.images[currentImageIndex]}
            alt={property.title}
            className="w-full h-full object-cover"
            onClick={nextImage}
          />
          
          {/* Badges - Maximum 2 */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {property.isNew && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                Nuevo
              </Badge>
            )}
            {property.waterRights && (
              <Badge variant="secondary" className="text-xs">
                💧 Agua
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
            className={`absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 hover:bg-background ${
              isFavorited ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
          </Button>

          {/* Image counter */}
          {property.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-foreground/60 text-background text-xs px-2 py-1 rounded">
              {currentImageIndex + 1}/{property.images.length}
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title and Location */}
        <h3 className="font-medium text-foreground line-clamp-1 mb-1">{property.title}</h3>
        <div className="flex items-center text-muted-foreground text-sm mb-3">
          <MapPin className="h-3.5 w-3.5 mr-1" />
          <span className="truncate">{property.location}</span>
        </div>

        {/* Price */}
        <p className="text-xl font-semibold text-primary mb-3">{property.price}</p>

        {/* Area and Type */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
          <div className="flex items-center">
            <Maximize className="h-4 w-4 mr-1" />
            <span>{property.area}</span>
          </div>
          <span>•</span>
          <span>{property.type}</span>
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleWhatsApp}
          className="w-full bg-primary hover:bg-primary/90"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Contactar
        </Button>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
