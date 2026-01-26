import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lot, parseLotFeatures } from '@/hooks/useLots';
import { Eye, Edit, Trash2, Droplets, Zap, Route } from 'lucide-react';

interface LotTableProps {
  lots: Lot[];
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
    default: return status || '—';
  }
};

export const LotTable = ({ lots, onView, onEdit, onDelete }: LotTableProps) => {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Lote</th>
              <th className="text-left p-4 font-medium">Estado</th>
              <th className="text-left p-4 font-medium">Superficie</th>
              <th className="text-left p-4 font-medium">Precio</th>
              <th className="text-left p-4 font-medium">Servicios</th>
              <th className="text-left p-4 font-medium">Comprador</th>
              <th className="text-right p-4 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lots.map((lot) => {
              const features = parseLotFeatures(lot.features);
              return (
                <tr key={lot.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div>
                      <span className="font-medium">{lot.lot_number}</span>
                      {lot.name && (
                        <p className="text-xs text-muted-foreground">{lot.name}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge className={getStatusColor(lot.status)}>
                      {getStatusLabel(lot.status)}
                    </Badge>
                  </td>
                  <td className="p-4">{Number(lot.area).toLocaleString()} m²</td>
                  <td className="p-4 text-green-600 font-medium">{formatPrice(lot.price)}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {features.hasWater && (
                        <Badge variant="outline" className="text-xs">
                          <Droplets className="h-3 w-3 mr-1" />
                          Agua
                        </Badge>
                      )}
                      {features.hasElectricity && (
                        <Badge variant="outline" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Luz
                        </Badge>
                      )}
                      {features.hasRoad && (
                        <Badge variant="outline" className="text-xs">
                          <Route className="h-3 w-3 mr-1" />
                          Acceso
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {lot.buyer_name || '—'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      {onView && (
                        <Button size="icon" variant="ghost" onClick={() => onView(lot)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button size="icon" variant="ghost" onClick={() => onEdit(lot)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-destructive" 
                          onClick={() => onDelete(lot)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {lots.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No hay lotes para mostrar
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
