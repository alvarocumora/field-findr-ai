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
import {
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Ruler,
  Droplets,
  Zap,
  Route,
  MapPin,
  User,
  Calculator,
  Star,
  Clock,
  AlertTriangle,
  Mountain,
  Box,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { useMemo } from 'react';

interface EnhancedLotCardProps {
  lot: Lot;
  index?: number;
  totalAvailable?: number;
  onView?: (lot: Lot) => void;
  onEdit?: (lot: Lot) => void;
  onDelete?: (lot: Lot) => void;
  onSimulateFinancing?: (lot: Lot) => void;
  onView3D?: (lot: Lot) => void;
  isSelected?: boolean;
}

const formatPrice = (price: number | null) => {
  if (!price) return '—';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(price);
};

const formatPricePerSqm = (price: number | null, area: number) => {
  if (!price || !area) return '—';
  const pricePerSqm = price / area;
  return (
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(pricePerSqm) + '/m²'
  );
};

const getStatusColor = (status: string | null) => {
  switch (status) {
    case 'available': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    case 'reserved': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'sold': return 'bg-muted text-muted-foreground border-muted';
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

const getSlopeIcon = (slope: string | null) => {
  switch (slope) {
    case 'flat': return '▬';
    case 'gentle': return '⟋';
    case 'steep': return '⟰';
    default: return null;
  }
};

const getSlopeLabel = (slope: string | null) => {
  switch (slope) {
    case 'flat': return 'Plano';
    case 'gentle': return 'Suave';
    case 'steep': return 'Fuerte';
    default: return null;
  }
};

/** Renders an inline SVG miniature of the lot polygon */
const PolygonMiniature = ({ polygon }: { polygon: number[][] }) => {
  const pathD = useMemo(() => {
    if (!polygon || polygon.length < 3) return null;
    const lngs = polygon.map((p) => p[0]);
    const lats = polygon.map((p) => p[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const w = maxLng - minLng || 1;
    const h = maxLat - minLat || 1;
    const pad = 4;
    const size = 40;
    const scale = (size - pad * 2) / Math.max(w, h);

    const points = polygon.map(([lng, lat]) => {
      const x = pad + (lng - minLng) * scale;
      const y = pad + (maxLat - lat) * scale; // flip Y
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M${points.join('L')}Z`;
  }, [polygon]);

  if (!pathD) return null;

  return (
    <svg viewBox="0 0 40 40" className="w-10 h-10 shrink-0">
      <path
        d={pathD}
        fill="hsl(var(--primary) / 0.15)"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const EnhancedLotCard = ({
  lot,
  index = 0,
  totalAvailable = 0,
  onView,
  onEdit,
  onDelete,
  onSimulateFinancing,
  onView3D,
  isSelected = false,
}: EnhancedLotCardProps) => {
  const features = parseLotFeatures(lot.features);
  const hasCoordinates = lot.latitude && lot.longitude;
  const polygon = lot.polygon as number[][] | null;
  const pricePerSqm =
    lot.price_per_sqm || (lot.price && lot.area ? lot.price / Number(lot.area) : null);

  const daysOnMarket = lot.created_at
    ? differenceInDays(new Date(), new Date(lot.created_at))
    : null;
  const daysSinceReservation = lot.reservation_date
    ? differenceInDays(new Date(), new Date(lot.reservation_date))
    : null;

  const isLastAvailable =
    lot.status === 'available' && totalAvailable <= 3 && totalAvailable > 0;

  const isPremium =
    features.additionalFeatures?.includes('premium') ||
    features.additionalFeatures?.includes('destacado');

  const slopeLabel = getSlopeLabel(lot.slope_category);
  const slopeIcon = getSlopeIcon(lot.slope_category);

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:border-primary/30',
        'opacity-0 animate-slide-in-up',
        isSelected && 'ring-2 ring-primary shadow-lg',
        lot.status === 'sold' && 'opacity-60'
      )}
      style={{
        animationDelay: `${index * 0.05}s`,
        animationFillMode: 'forwards',
      }}
    >
      {isPremium && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-1">
            <Star className="h-3 w-3 fill-current" />
            Destacado
          </Badge>
        </div>
      )}

      {isLastAvailable && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-destructive/90 text-destructive-foreground gap-1 animate-pulse">
            <AlertTriangle className="h-3 w-3" />
            ¡Últimos!
          </Badge>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Polygon miniature */}
            {polygon && polygon.length >= 3 && <PolygonMiniature polygon={polygon} />}
            <div className="min-w-0">
              <CardTitle className="text-lg truncate">{lot.lot_number}</CardTitle>
              {lot.name && lot.name !== `Lote-${lot.lot_number}` && lot.name !== lot.lot_number && (
                <p className="text-xs text-muted-foreground truncate">{lot.name}</p>
              )}
            </div>
            {hasCoordinates && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {lot.latitude?.toFixed(4)}, {lot.longitude?.toFixed(4)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <Badge className={cn('shrink-0', getStatusColor(lot.status))}>
            {getStatusLabel(lot.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2.5 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <Ruler className="h-3.5 w-3.5" />
              Superficie
            </div>
            <p className="font-semibold">{Number(lot.area).toLocaleString('es-CL')} m²</p>
          </div>
          <div className="p-2.5 rounded-lg bg-primary/5">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              Precio
            </div>
            <p className="font-bold text-primary">{formatPrice(lot.price)}</p>
          </div>
        </div>

        {/* Price per sqm */}
        {pricePerSqm && Number(lot.area) >= 500 && Number(lot.area) <= 100000 && (
          <div className="flex items-center justify-between text-sm px-1">
            <span className="text-muted-foreground">Precio/m²</span>
            <span className="font-medium">
              {formatPricePerSqm(lot.price, Number(lot.area))}
            </span>
          </div>
        )}

        {/* Topography indicator */}
        {(slopeLabel || lot.elevation_avg) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Mountain className="h-3.5 w-3.5" />
            {slopeLabel && (
              <span>
                {slopeIcon} {slopeLabel}
              </span>
            )}
            {lot.elevation_avg && (
              <span className="ml-auto">{Math.round(Number(lot.elevation_avg))}m snm</span>
            )}
          </div>
        )}

        {/* Time indicator */}
        {lot.status !== 'sold' &&
          (daysOnMarket !== null || daysSinceReservation !== null) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <Clock className="h-3.5 w-3.5" />
              {lot.status === 'reserved' && daysSinceReservation !== null ? (
                <span>Reservado hace {daysSinceReservation} días</span>
              ) : daysOnMarket !== null ? (
                <span>{daysOnMarket} días en venta</span>
              ) : null}
            </div>
          )}

        {/* Services */}
        {(features.hasWater ||
          features.hasElectricity ||
          features.hasRoad ||
          (features.additionalFeatures && features.additionalFeatures.length > 0)) && (
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
                      <Route className="h-3 w-3 text-muted-foreground" />
                      Acceso
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Acceso por camino</TooltipContent>
                </Tooltip>
              )}
              {features.additionalFeatures
                ?.filter((f) => f !== 'premium' && f !== 'destacado')
                .slice(0, 2)
                .map((feature, i) => (
                  <Badge key={i} variant="outline" className="text-xs px-2 py-0.5">
                    {feature}
                  </Badge>
                ))}
            </TooltipProvider>
          </div>
        )}

        {/* Buyer info */}
        {(lot.status === 'sold' || lot.status === 'reserved') && lot.buyer_name && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-3">
            <User className="h-3.5 w-3.5" />
            <span className="font-medium">Comprador:</span>
            <span className="truncate">{lot.buyer_name}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {/* Primary CTA: Ver 3D for available lots */}
          {lot.status === 'available' && onView3D && (
            <Button
              size="sm"
              variant="default"
              className="flex-1 gap-1 h-8"
              onClick={(e) => {
                e.stopPropagation();
                onView3D(lot);
              }}
            >
              <Box className="h-3 w-3" />
              Ver 3D
            </Button>
          )}
          {lot.status === 'available' && onSimulateFinancing && !onView3D && (
            <Button
              size="sm"
              variant="default"
              className="flex-1 gap-1 h-8"
              onClick={(e) => {
                e.stopPropagation();
                onSimulateFinancing(lot);
              }}
            >
              <Calculator className="h-3 w-3" />
              Simular
            </Button>
          )}
          {onView && (
            <Button
              size="sm"
              variant="outline"
              className={cn('gap-1 h-8', !onView3D && !onSimulateFinancing && 'flex-1')}
              onClick={(e) => {
                e.stopPropagation();
                onView(lot);
              }}
            >
              <Eye className="h-3 w-3" />
              {!onView3D && !onSimulateFinancing && 'Ver'}
            </Button>
          )}
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(lot);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(lot);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
