import { Card, CardContent } from '@/components/ui/card';
import { Grid3X3, MapPin, DollarSign, Clock } from 'lucide-react';

interface LotStatsProps {
  stats: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
    totalArea?: number;
    totalValue?: number;
  };
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP', 
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(price);
};

export const LotStats = ({ stats }: LotStatsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Lotes</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Grid3X3 className="h-8 w-8 text-primary/60" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Disponibles</p>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            </div>
            <MapPin className="h-8 w-8 text-green-500/60" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 border-yellow-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Reservados</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.reserved}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500/60" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Vendidos</p>
              <p className="text-2xl font-bold text-red-600">{stats.sold}</p>
            </div>
            <DollarSign className="h-8 w-8 text-red-500/60" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
