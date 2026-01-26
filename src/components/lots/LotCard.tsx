import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lot, parseLotFeatures } from '@/hooks/useLots';
import { Eye, Edit, Trash2, DollarSign, Ruler, Droplets, Zap, Route } from 'lucide-react';

interface LotCardProps {
  lot: Lot;
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

export const LotCard = ({ lot, onView, onEdit, onDelete }: LotCardProps) => {
  const features = parseLotFeatures(lot.features);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{lot.lot_number}</CardTitle>
          <Badge className={getStatusColor(lot.status)}>
            {getStatusLabel(lot.status)}
          </Badge>
        </div>
        {lot.name && (
          <p className="text-sm text-muted-foreground">{lot.name}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Ruler className="h-4 w-4" />
            <span>{Number(lot.area).toLocaleString()} m²</span>
          </div>
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <DollarSign className="h-4 w-4" />
            <span>{formatPrice(lot.price)}</span>
          </div>
        </div>

        {/* Services */}
        <div className="flex flex-wrap gap-2">
          {features.hasWater && (
            <Badge variant="outline" className="text-xs gap-1">
              <Droplets className="h-3 w-3" />
              Agua
            </Badge>
          )}
          {features.hasElectricity && (
            <Badge variant="outline" className="text-xs gap-1">
              <Zap className="h-3 w-3" />
              Luz
            </Badge>
          )}
          {features.hasRoad && (
            <Badge variant="outline" className="text-xs gap-1">
              <Route className="h-3 w-3" />
              Acceso
            </Badge>
          )}
          {features.additionalFeatures?.slice(0, 2).map((feature, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
          {(features.additionalFeatures?.length || 0) > 2 && (
            <Badge variant="outline" className="text-xs">
              +{(features.additionalFeatures?.length || 0) - 2}
            </Badge>
          )}
        </div>

        {/* Buyer info if sold/reserved */}
        {(lot.status === 'sold' || lot.status === 'reserved') && lot.buyer_name && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            <span className="font-medium">Comprador:</span> {lot.buyer_name}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onView && (
            <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => onView(lot)}>
              <Eye className="h-3 w-3" />
              Ver
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => onEdit(lot)}>
              <Edit className="h-3 w-3" />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button 
              size="sm" 
              variant="outline" 
              className="text-destructive hover:text-destructive" 
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
