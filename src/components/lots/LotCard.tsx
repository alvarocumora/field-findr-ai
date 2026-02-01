import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Lot, parseLotFeatures } from '@/hooks/useLots';
import { Eye, Edit, Trash2, DollarSign, Ruler, Droplets, Zap, Route, MapPin, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LotCardProps {
  lot: Lot;
  index?: number;
  onView?: (lot: Lot) => void;
  onEdit?: (lot: Lot) => void;
  onDelete?: (lot: Lot) => void;
}

const formatPrice = (price: number | null) => {
  if (!price) return '—';
  return new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP', 
    maximumFractionDigits: 0 
  }).format(price);
};

const getStatusColor = (status: string | null) => {
  switch (status) {
    case 'available': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'reserved': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'sold': return 'bg-red-500/10 text-red-600 border-red-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getStatusLabel = (status: string | null) => {
  switch (status) {
    case 'available': return 'Disponible';
    case 'reserved': return 'Reservado';
    case 'sold': return 'Vendido';
    default: return status || 'Sin estado';
  }
};

export const LotCard = ({ lot, index = 0, onView, onEdit, onDelete }: LotCardProps) => {
  const features = parseLotFeatures(lot.features);
  const hasCoordinates = lot.latitude && lot.longitude;

  return (
    <Card 
      className={cn(
        'group hover:shadow-lg transition-all duration-300 hover:border-primary/30',
        'opacity-0 animate-slide-in-up'
      )}
      style={{ 
        animationDelay: `${index * 0.05}s`,
        animationFillMode: 'forwards'
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-lg truncate">{lot.lot_number}</CardTitle>
            {hasCoordinates && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ubicación: {lot.latitude?.toFixed(4)}, {lot.longitude?.toFixed(4)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <Badge className={cn('shrink-0', getStatusColor(lot.status))}>
            {getStatusLabel(lot.status)}
          </Badge>
        </div>
        {lot.name && (
          <p className="text-sm text-muted-foreground truncate">{lot.name}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Ruler className="h-4 w-4 shrink-0" />
            <span>{Number(lot.area).toLocaleString()} m²</span>
          </div>
          <div className="flex items-center gap-2 text-primary font-medium">
            <DollarSign className="h-4 w-4 shrink-0" />
            <span className="truncate">{formatPrice(lot.price)}</span>
          </div>
        </div>

        {/* Services with Tooltips */}
        <div className="flex flex-wrap gap-1.5">
          <TooltipProvider delayDuration={200}>
            {features.hasWater && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs gap-1 px-2 py-0.5 cursor-default">
                    <Droplets className="h-3 w-3 text-blue-500" />
                    Agua
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Conexión de agua disponible</TooltipContent>
              </Tooltip>
            )}
            {features.hasElectricity && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs gap-1 px-2 py-0.5 cursor-default">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    Luz
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Conexión eléctrica disponible</TooltipContent>
              </Tooltip>
            )}
            {features.hasRoad && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs gap-1 px-2 py-0.5 cursor-default">
                    <Route className="h-3 w-3 text-gray-500" />
                    Acceso
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Acceso por camino</TooltipContent>
              </Tooltip>
            )}
            {features.additionalFeatures?.slice(0, 2).map((feature, i) => (
              <Badge key={i} variant="outline" className="text-xs px-2 py-0.5">
                {feature}
              </Badge>
            ))}
            {(features.additionalFeatures?.length || 0) > 2 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs px-2 py-0.5 cursor-default">
                    +{(features.additionalFeatures?.length || 0) - 2}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <ul className="text-xs space-y-1">
                    {features.additionalFeatures?.slice(2).map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>

        {/* Buyer info if sold/reserved */}
        {(lot.status === 'sold' || lot.status === 'reserved') && lot.buyer_name && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
            <User className="h-3.5 w-3.5" />
            <span className="font-medium">Comprador:</span> 
            <span className="truncate">{lot.buyer_name}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
          {onView && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 gap-1 h-8" 
              onClick={() => onView(lot)}
            >
              <Eye className="h-3 w-3" />
              Ver
            </Button>
          )}
          {onEdit && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 gap-1 h-8" 
              onClick={() => onEdit(lot)}
            >
              <Edit className="h-3 w-3" />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button 
              size="sm" 
              variant="outline" 
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8" 
              onClick={() => onDelete(lot)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
