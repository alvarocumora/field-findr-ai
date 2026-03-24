import { Suspense, lazy, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Lot, parseLotFeatures } from '@/hooks/useLots';
import {
  DollarSign,
  Ruler,
  Droplets,
  Zap,
  Route,
  Mountain,
  MapPin,
  Bookmark,
  Palette,
  Calculator,
  TrendingUp,
  TriangleAlert,
  Share2,
  MessageCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { generateLotDataCardPdf } from '@/lib/lotDataCardPdf';

const ParcelaDesigner3D = lazy(() =>
  import('@/components/parcela/ParcelaDesigner3D').then((m) => ({
    default: m.ParcelaDesigner3D,
  }))
);

interface LotDetailSheetProps {
  lot: Lot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onReserve?: (lot: Lot) => void;
  onDesign?: (lot: Lot) => void;
  onFinance?: (lot: Lot) => void;
  legalDocuments?: any[];
}

const formatPrice = (price: number | null) => {
  if (!price) return 'Consultar';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(price);
};

const getStatusConfig = (status: string | null) => {
  switch (status) {
    case 'available':
      return { label: 'Disponible', className: 'bg-emerald-500 text-white' };
    case 'reserved':
      return { label: 'Reservado', className: 'bg-amber-500 text-white' };
    case 'sold':
      return { label: 'Vendido', className: 'bg-muted text-muted-foreground' };
    default:
      return { label: status || 'Sin estado', className: 'bg-muted text-muted-foreground' };
  }
};

const getSlopeLabel = (slope: string | null) => {
  switch (slope) {
    case 'flat': return 'Plano';
    case 'gentle': return 'Pendiente suave';
    case 'steep': return 'Pendiente fuerte';
    default: return null;
  }
};

const handleShare = (lot: Lot) => {
  const url = `${window.location.origin}/proyecto/${lot.project_id}?lote=${lot.lot_number}`;
  navigator.clipboard.writeText(url).then(() => {
    toast.success('Enlace copiado al portapapeles');
  });
};

const handleWhatsApp = (lot: Lot, projectName: string) => {
  const price = lot.price ? formatPrice(lot.price) : 'Consultar';
  const msg = `Hola, me interesa el Lote ${lot.lot_number} del proyecto ${projectName}.\n\nSuperficie: ${Number(lot.area).toLocaleString('es-CL')} m²\nPrecio: ${price}\n\n${window.location.origin}/proyecto/${lot.project_id}?lote=${lot.lot_number}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
};

/** Image Gallery Carousel */
const ImageGallery = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="aspect-[16/9] bg-muted">
        <img
          src={images[currentIndex]}
          alt={`Foto ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <>
          <Button
            size="icon"
            variant="secondary"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-md"
            onClick={() => setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-md"
            onClick={() => setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                )}
                onClick={() => setCurrentIndex(i)}
              />
            ))}
          </div>
          <Badge className="absolute top-2 right-2 bg-black/50 text-white text-[10px]">
            <ImageIcon className="h-3 w-3 mr-1" />
            {currentIndex + 1}/{images.length}
          </Badge>
        </>
      )}
    </div>
  );
};

export const LotDetailSheet = ({
  lot,
  open,
  onOpenChange,
  projectName,
  onReserve,
  onDesign,
  onFinance,
  legalDocuments = [],
}: LotDetailSheetProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!lot) return null;

  const features = parseLotFeatures(lot.features);
  const status = getStatusConfig(lot.status);
  const polygon = lot.polygon as number[][] | null;
  const pricePerSqm =
    lot.price_per_sqm || (lot.price && lot.area ? lot.price / Number(lot.area) : null);
  const slopeLabel = getSlopeLabel(lot.slope_category);
  const images = ((lot as any).images as string[] | null) || [];

  const handleDownloadFicha = async () => {
    setIsDownloading(true);
    try {
      await generateLotDataCardPdf(lot, projectName, features);
      toast.success('Ficha del lote descargada');
    } catch (err) {
      toast.error('Error al generar ficha PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border px-6 pt-6 pb-4">
          <SheetHeader className="mb-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">Lote {lot.lot_number}</SheetTitle>
              <Badge className={cn('shrink-0', status.className)}>{status.label}</Badge>
            </div>
            <SheetDescription className="text-sm">
              {projectName}
              {lot.name && lot.name !== lot.lot_number && ` · ${lot.name}`}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-6 pb-6 space-y-5 pt-4">
          {/* Image Gallery (if images exist) */}
          {images.length > 0 && <ImageGallery images={images} />}

          {/* 3D Preview */}
          <div className="rounded-xl overflow-hidden border border-border/40 h-[280px] bg-muted/30">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="w-full h-full" />
                </div>
              }
            >
              <div className="h-full [&>div]:!h-full [&>div]:!rounded-none [&>div]:!border-0">
                <ParcelaDesigner3D
                  polygon={polygon}
                  lotNumber={lot.lot_number}
                  lotArea={Number(lot.area)}
                  lotPrice={lot.price ?? undefined}
                  latitude={lot.latitude ?? undefined}
                  longitude={lot.longitude ?? undefined}
                />
              </div>
            </Suspense>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-muted/50 border border-border/30">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Ruler className="h-3.5 w-3.5" />
                Superficie
              </div>
              <p className="font-semibold text-lg">
                {Number(lot.area).toLocaleString('es-CL')} m²
              </p>
            </div>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <DollarSign className="h-3.5 w-3.5" />
                Precio
              </div>
              <p className="font-bold text-lg text-primary">{formatPrice(lot.price)}</p>
            </div>
          </div>

          {pricePerSqm && (
            <div className="flex items-center justify-between text-sm px-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                Precio/m²
              </span>
              <span className="font-medium">{formatPrice(pricePerSqm)}/m²</span>
            </div>
          )}

          <Separator />

          {/* Topography */}
          {(lot.elevation_avg || slopeLabel) && (
            <>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Mountain className="h-4 w-4 text-muted-foreground" />
                  Topografía
                </h4>
                <div className="flex flex-wrap gap-2">
                  {lot.elevation_avg && (
                    <Badge variant="outline" className="text-xs gap-1">
                      ⛰ {Math.round(Number(lot.elevation_avg))}m snm
                    </Badge>
                  )}
                  {slopeLabel && (
                    <Badge variant="outline" className="text-xs gap-1">
                      📐 {slopeLabel}
                    </Badge>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Services */}
          {(features.hasWater || features.hasElectricity || features.hasRoad) && (
            <>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Servicios</h4>
                <TooltipProvider delayDuration={200}>
                  <div className="flex flex-wrap gap-2">
                    {features.hasWater && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs gap-1 px-2.5 py-1">
                            <Droplets className="h-3.5 w-3.5 text-blue-500" />
                            Agua
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Conexión de agua disponible</TooltipContent>
                      </Tooltip>
                    )}
                    {features.hasElectricity && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs gap-1 px-2.5 py-1">
                            <Zap className="h-3.5 w-3.5 text-yellow-500" />
                            Electricidad
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Conexión eléctrica disponible</TooltipContent>
                      </Tooltip>
                    )}
                    {features.hasRoad && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs gap-1 px-2.5 py-1">
                            <Route className="h-3.5 w-3.5 text-muted-foreground" />
                            Acceso vial
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Acceso por camino</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TooltipProvider>
              </div>
              <Separator />
            </>
          )}

          {/* Location with map hint */}
          {lot.latitude && lot.longitude && (
            <>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  Ubicación
                </h4>
                <div className="rounded-lg bg-muted/50 border border-border/30 p-3">
                  <p className="text-xs text-muted-foreground">
                    {Number(lot.latitude).toFixed(5)}, {Number(lot.longitude).toFixed(5)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${lot.latitude},${lot.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    Ver en Google Maps →
                  </a>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Documents */}
          {legalDocuments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Documentos del Proyecto</h4>
              <div className="space-y-1.5">
                {legalDocuments.slice(0, 5).map((doc: any, i: number) => (
                  <a
                    key={i}
                    href={doc.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted/50"
                  >
                    📄 {doc.name || `Documento ${i + 1}`}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Share & Download Section */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              onClick={() => handleShare(lot)}
            >
              <Share2 className="h-3.5 w-3.5" />
              Copiar Enlace
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 border-emerald-500/20"
              onClick={() => handleWhatsApp(lot, projectName)}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleDownloadFicha}
              disabled={isDownloading}
            >
              <Download className="h-3.5 w-3.5" />
              {isDownloading ? '...' : 'Ficha'}
            </Button>
          </div>

          {/* Action Buttons */}
          {lot.status === 'available' && (
            <div className="space-y-2 pt-2">
              <Button
                className="w-full gap-2 h-11"
                size="lg"
                onClick={() => onReserve?.(lot)}
              >
                <Bookmark className="h-4 w-4" />
                Reservar este Lote
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => onDesign?.(lot)}
                >
                  <Palette className="h-4 w-4" />
                  Diseñar Parcela
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => onFinance?.(lot)}
                >
                  <Calculator className="h-4 w-4" />
                  Simular Crédito
                </Button>
              </div>
            </div>
          )}

          {lot.status === 'reserved' && (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm text-amber-600 flex items-start gap-2">
              <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Este lote se encuentra actualmente reservado.</span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
