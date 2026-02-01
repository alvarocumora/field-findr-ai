import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Grid3X3, MapPin, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LotStatsProps {
  stats: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
    totalArea?: number;
    totalValue?: number;
  };
  className?: string;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CL', { 
    style: 'currency', 
    currency: 'CLP', 
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(price);
};

const formatArea = (area: number) => {
  if (area >= 10000) {
    return `${(area / 10000).toFixed(1)} há`;
  }
  return `${area.toLocaleString()} m²`;
};

export const LotStats = ({ stats, className }: LotStatsProps) => {
  const availablePercent = stats.total > 0 ? (stats.available / stats.total) * 100 : 0;
  const reservedPercent = stats.total > 0 ? (stats.reserved / stats.total) * 100 : 0;
  const soldPercent = stats.total > 0 ? (stats.sold / stats.total) * 100 : 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={cn(
          'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20',
          'opacity-0 animate-slide-in-up'
        )} style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Lotes</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Grid3X3 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn(
          'bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20',
          'opacity-0 animate-slide-in-up'
        )} style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Disponibles</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.available}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-green-500/10">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn(
          'bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 border-yellow-500/20',
          'opacity-0 animate-slide-in-up'
        )} style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Reservados</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.reserved}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn(
          'bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20',
          'opacity-0 animate-slide-in-up'
        )} style={{ animationDelay: '0.25s', animationFillMode: 'forwards' }}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Vendidos</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.sold}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-red-500/10">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {stats.total > 0 && (
        <Card className={cn(
          'opacity-0 animate-slide-in-up'
        )} style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Distribución de Lotes</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            
            {/* Stacked Progress Bar */}
            <div className="relative h-3 w-full rounded-full overflow-hidden bg-muted">
              <div 
                className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500"
                style={{ width: `${availablePercent}%` }}
              />
              <div 
                className="absolute top-0 h-full bg-yellow-500 transition-all duration-500"
                style={{ left: `${availablePercent}%`, width: `${reservedPercent}%` }}
              />
              <div 
                className="absolute top-0 h-full bg-red-500 transition-all duration-500"
                style={{ left: `${availablePercent + reservedPercent}%`, width: `${soldPercent}%` }}
              />
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">
                  Disponibles <span className="font-medium text-foreground">{availablePercent.toFixed(0)}%</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-muted-foreground">
                  Reservados <span className="font-medium text-foreground">{reservedPercent.toFixed(0)}%</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">
                  Vendidos <span className="font-medium text-foreground">{soldPercent.toFixed(0)}%</span>
                </span>
              </div>
            </div>
            
            {/* Additional Stats */}
            {(stats.totalArea || stats.totalValue) && (
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                {stats.totalArea && (
                  <div>
                    <p className="text-xs text-muted-foreground">Área Total</p>
                    <p className="text-lg font-semibold">{formatArea(stats.totalArea)}</p>
                  </div>
                )}
                {stats.totalValue && (
                  <div>
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                    <p className="text-lg font-semibold text-primary">{formatPrice(stats.totalValue)}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
