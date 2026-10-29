import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { parseLotFeatures } from '@/hooks/useLots';
import type { PublicLot } from '@/lib/lots/publicLotTypes';
import {
  Eye,
  Edit,
  Trash2,
  Ruler,
  Droplets,
  Zap,
  Route,
  MapPin,
  User,
  Calculator,
  Star,
  AlertTriangle,
  Mountain,
  Box,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { normalizePolygon } from '@/lib/polygonUtils';
import { getCanonicalUrl, getShareUrl } from '@/lib/publicUrls';

type Lot = PublicLot & { buyer_name?: string | null };

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
  projectName?: string;
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
    case 'available': return 'bg-emerald-500 text-white border-emerald-600';
    case 'reserved': return 'bg-amber-500 text-white border-amber-600';
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

const getSlopeLabel = (slope: string | null) => {
  switch (slope) {
    case 'flat': return 'Plano';
    case 'gentle': return 'Suave';
    case 'steep': return 'Fuerte';
    default: return null;
  }
};

/** Renders an inline SVG miniature of the lot polygon */
const PolygonMiniature = ({ polygon, className }: { polygon: number[][]; className?: string }) => {
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
    const pad = 8;
    const size = 120;
    const scale = (size - pad * 2) / Math.max(w, h);

    const points = polygon.map(([lng, lat]) => {
      const x = pad + (lng - minLng) * scale;
      const y = pad + (maxLat - lat) * scale;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M${points.join('L')}Z`;
  }, [polygon]);

  if (!pathD) return null;

  return (
    <svg viewBox="0 0 120 120" className={cn('w-full h-full', className)}>
      <path
        d={pathD}
        fill="hsl(var(--primary) / 0.15)"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const handleShare = (lot: Lot) => {
  const url = `${getCanonicalUrl('/')}proyecto/${lot.project_id}?lote=${lot.lot_number}`;
  navigator.clipboard.writeText(url).then(() => {
    toast.success('Enlace copiado al portapapeles');
  });
};

const handleWhatsApp = (lot: Lot, projectName?: string) => {
  const price = lot.price ? formatPrice(lot.price) : 'Consultar';
  const msg = `Hola, me interesa el Lote ${lot.lot_number}${projectName ? ` del proyecto ${projectName}` : ''}.\n\nSuperficie: ${Number(lot.area).toLocaleString('es-CL')} m²\nPrecio: ${price}\n\n${getCanonicalUrl('/')}proyecto/${lot.project_id}?lote=${lot.lot_number}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
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
  projectName,
}: EnhancedLotCardProps) => {
  const features = parseLotFeatures(lot.features);
  const normalizedPolygon = normalizePolygon(lot.polygon, lot.latitude ?? undefined, lot.longitude ?? undefined);
  const polygon = normalizedPolygon.valid ? normalizedPolygon.coords : null;
  const pricePerSqm =
    lot.price_per_sqm || (lot.price && lot.area ? lot.price / Number(lot.area) : null);
  const images = (lot).images as string[] | null;
  const heroImage = images && images.length > 0 ? images[0] : null;

  const isLastAvailable =
    lot.status === 'available' && totalAvailable <= 3 && totalAvailable > 0;

  const isPremium =
    features.additionalFeatures?.includes('premium') ||
    features.additionalFeatures?.includes('destacado');

  const slopeLabel = getSlopeLabel(lot.slope_category);

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 cursor-pointer border-0',
        'bg-card shadow-md hover:shadow-2xl hover:-translate-y-1.5',
        'rounded-2xl',
        'opacity-0 animate-slide-in-up',
        isSelected && 'ring-2 ring-primary shadow-xl',
        lot.status === 'sold' && 'opacity-60'
      )}
      style={{
        animationDelay: `${index * 0.05}s`,
        animationFillMode: 'forwards',
      }}
      onClick={() => onView?.(lot)}
    >
      {/* Hero section */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-emerald-50 via-muted to-emerald-50 dark:from-emerald-950/20 dark:via-muted dark:to-emerald-950/10">
        {heroImage ? (
          <img
            src={heroImage}
            alt={`Lote ${lot.lot_number}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : polygon && polygon.length >= 3 ? (
          <div className="flex items-center justify-center h-full p-6">
            <PolygonMiniature polygon={polygon} className="opacity-70 group-hover:opacity-90 transition-opacity" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <MapPin className="h-14 w-14 text-emerald-300/40" />
          </div>
        )}

        {/* Status badge - top left */}
        <div className="absolute top-3 left-3 z-10">
          <Badge className={cn('text-[11px] shadow-lg font-semibold tracking-wide', getStatusColor(lot.status))}>
            {getStatusLabel(lot.status)}
          </Badge>
        </div>

        {/* Premium / Last available - top right */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
          {isPremium && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-1 shadow-lg text-[10px]">
              <Star className="h-3 w-3 fill-current" />
              Destacado
            </Badge>
          )}
          {isLastAvailable && (
            <Badge className="bg-destructive text-destructive-foreground gap-1 animate-pulse shadow-lg text-[10px]">
              <AlertTriangle className="h-3 w-3" />
              ¡Últimos!
            </Badge>
          )}
        </div>

        {/* Bottom gradient with lot info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white font-bold text-xl leading-tight drop-shadow-lg">
                {formatPrice(lot.price)}
              </p>
              {pricePerSqm && (
                <p className="text-white/60 text-[11px] mt-0.5">
                  {formatPricePerSqm(lot.price, Number(lot.area))}
                </p>
              )}
            </div>
            <div className="text-white/90 text-right">
              <p className="font-bold text-sm tracking-wide">Lote {lot.lot_number}</p>
              <p className="text-[11px] text-white/60">
                {Number(lot.area).toLocaleString('es-CL')} m²
              </p>
            </div>
          </div>
        </div>

        {/* Hover share actions */}
        <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {!isPremium && !isLastAvailable && (
            <>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-lg"
                onClick={(e) => { e.stopPropagation(); handleShare(lot); }}
              >
                <Share2 className="h-3.5 w-3.5 text-foreground" />
              </Button>
              {lot.status === 'available' && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg"
                  onClick={(e) => { e.stopPropagation(); handleWhatsApp(lot, projectName); }}
                >
                  <MessageCircle className="h-3.5 w-3.5 text-white" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <CardContent className="p-3.5 space-y-2.5">
        {/* Topography + Services compact row */}
        <div className="flex flex-wrap gap-1.5">
          {slopeLabel && (
            <Badge variant="outline" className="text-[10px] gap-0.5 px-2 py-0.5 rounded-full">
              <Mountain className="h-3 w-3" />
              {slopeLabel}
            </Badge>
          )}
          <TooltipProvider delayDuration={200}>
            {features.hasWater && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-[10px] gap-0.5 px-2 py-0.5 rounded-full">
                    <Droplets className="h-3 w-3 text-blue-500" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Agua potable</TooltipContent>
              </Tooltip>
            )}
            {features.hasElectricity && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-[10px] gap-0.5 px-2 py-0.5 rounded-full">
                    <Zap className="h-3 w-3 text-yellow-500" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Electricidad</TooltipContent>
              </Tooltip>
            )}
            {features.hasRoad && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-[10px] gap-0.5 px-2 py-0.5 rounded-full">
                    <Route className="h-3 w-3" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Acceso pavimentado</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
          {lot.latitude && lot.longitude && (
            <Badge variant="outline" className="text-[10px] gap-0.5 px-2 py-0.5 rounded-full ml-auto">
              <MapPin className="h-3 w-3 text-emerald-600" />
              GPS
            </Badge>
          )}
        </div>

        {/* Buyer info */}
        {(lot.status === 'sold' || lot.status === 'reserved') && lot.buyer_name && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t border-border pt-2">
            <User className="h-3 w-3" />
            <span className="truncate">{lot.buyer_name}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1.5 pt-1">
          {lot.status === 'available' && onView3D && (
            <Button
              size="sm"
              variant="default"
              className="flex-1 gap-1.5 h-9 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              onClick={(e) => { e.stopPropagation(); onView3D(lot); }}
            >
              <Box className="h-3.5 w-3.5" />
              Ver en 3D
            </Button>
          )}
          {lot.status === 'available' && onSimulateFinancing && !onView3D && (
            <Button
              size="sm"
              variant="default"
              className="flex-1 gap-1.5 h-9 text-xs rounded-xl"
              onClick={(e) => { e.stopPropagation(); onSimulateFinancing(lot); }}
            >
              <Calculator className="h-3.5 w-3.5" />
              Simular Crédito
            </Button>
          )}
          {onView && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 h-9 text-xs rounded-xl"
              onClick={(e) => { e.stopPropagation(); onView(lot); }}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 h-9 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
              onClick={(e) => { e.stopPropagation(); onEdit(lot); }}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
              onClick={(e) => { e.stopPropagation(); onDelete(lot); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
