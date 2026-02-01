import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Eye, 
  MessageSquare,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyInsight {
  id: string;
  title: string;
  area: string;
  price: string;
  status: 'available' | 'reserved' | 'sold';
  views: number;
  inquiries: number;
  trend?: 'up' | 'down' | 'stable';
  score?: number;
}

interface PropertyInsightsProps {
  properties: PropertyInsight[];
  maxItems?: number;
  onViewAll?: () => void;
  onViewProperty?: (id: string) => void;
  className?: string;
}

const getStatusStyles = (status: PropertyInsight['status']) => {
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

const getStatusLabel = (status: PropertyInsight['status']) => {
  switch (status) {
    case 'available': return 'Disponible';
    case 'reserved': return 'Reservado';
    case 'sold': return 'Vendido';
    default: return status;
  }
};

const PropertyCard = ({ 
  property, 
  index,
  onView 
}: { 
  property: PropertyInsight; 
  index: number;
  onView?: (id: string) => void;
}) => {
  return (
    <div 
      className={cn(
        'group relative p-4 rounded-xl border',
        'bg-card hover:bg-muted/30 transition-all duration-300',
        'hover:shadow-md hover:border-primary/20',
        'opacity-0 animate-slide-in-up cursor-pointer'
      )}
      style={{ 
        animationDelay: `${index * 0.1}s`,
        animationFillMode: 'forwards'
      }}
      onClick={() => onView?.(property.id)}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {property.title}
          </h4>
          <p className="text-xs text-muted-foreground">{property.area}</p>
        </div>
        <Badge className={cn('shrink-0 text-[10px]', getStatusStyles(property.status))}>
          {getStatusLabel(property.status)}
        </Badge>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xl font-bold text-primary">{property.price}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {property.views}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {property.inquiries}
            </span>
            {property.trend === 'up' && (
              <span className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-3 w-3" />
                Popular
              </span>
            )}
          </div>
        </div>
        
        {property.score !== undefined && (
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Sparkles className="h-3 w-3 text-primary" />
              Score
            </div>
            <div className="w-16">
              <Progress value={property.score} className="h-1.5" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{property.score}%</p>
          </div>
        )}
      </div>
      
      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};

export const PropertyInsights = ({
  properties,
  maxItems = 3,
  onViewAll,
  onViewProperty,
  className
}: PropertyInsightsProps) => {
  const displayedProperties = properties.slice(0, maxItems);
  
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Propiedades Destacadas</CardTitle>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1 text-xs">
              Ver Todas
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {displayedProperties.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No hay propiedades destacadas
          </div>
        ) : (
          displayedProperties.map((property, index) => (
            <PropertyCard
              key={property.id}
              property={property}
              index={index}
              onView={onViewProperty}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyInsights;
