import type { LegalItem } from '@/lib/projects/legalItemTypes';
import ViewerErrorBoundary from '@/components/viewer/ViewerErrorBoundary';
import { Suspense, lazy, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { parseLotFeatures } from '@/hooks/useLots';
import type { PublicLot as Lot } from '@/lib/lots/publicLotTypes';
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
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Sparkles,
  Box,
  ExternalLink,
  Satellite,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { generateLotDataCardPdf } from '@/lib/lotDataCardPdf';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { PublishLotButton } from './PublishLotButton';
import { getCanonicalUrl, getShareUrl } from '@/lib/publicUrls';
import { canReservePublicLot, formatPublicLotPrice, formatPublicLotUnitPrice } from '@/lib/lots/publicLotCommercial';
import { useSentinelImagery } from '@/hooks/useSentinelImagery';
import { formatSentinelDate, sentinelCloudLabel } from '@/lib/satellite/sentinel';
import { renderLotSatelliteSnapshot } from '@/lib/satellite/renderLotSatelliteSnapshot';

const ParcelaDesigner3D = lazy(() =>
  import('@/components/parcela/ParcelaDesigner3D').then((m) => ({ default: m.ParcelaDesigner3D }))
);

interface LotDetailSheetProps {
  lot: Lot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onReserve?: (lot: Lot) => void;
  onDesign?: (lot: Lot) => void;
  onFinance?: (lot: Lot) => void;
  legalDocuments?: LegalItem[];
  project?: import('@/lib/marketplace/lotToListing').ProjectForListing | null;
  canManage?: boolean;
}

const formatPrice = formatPublicLotPrice;

const getStatusConfig = (status: string | null) => {
  switch (status) {
    case 'available': return { label: 'Disponible', className: 'bg-success text-primary-foreground border-transparent' };
    case 'reserved': return { label: 'Reservado', className: 'bg-warning text-primary-foreground border-transparent' };
    case 'sold': return { label: 'Vendido', className: 'bg-muted text-muted-foreground border-border' };
    default: return { label: status || 'Sin estado', className: 'bg-muted text-muted-foreground' };
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
  const url = `${getCanonicalUrl('/')}proyecto/${lot.project_id}?lote=${lot.lot_number}`;
  navigator.clipboard.writeText(url).then(() => toast.success('Enlace copiado al portapapeles'));
};

const handleWhatsApp = (lot: Lot, projectName: string) => {
  const price = lot.price ? formatPrice(lot.price) : 'Consultar';
  const msg = `Hola, me interesa el Lote ${lot.lot_number} del proyecto ${projectName}.\n\nSuperficie: ${Number(lot.area).toLocaleString('es-CL')} m²\nPrecio: ${price}\n\n${getCanonicalUrl('/')}proyecto/${lot.project_id}?lote=${lot.lot_number}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
};

const ImageGallery = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  if (images.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
      <div className="aspect-[16/9]">
        <img src={images[currentIndex]} alt={`Foto ${currentIndex + 1}`} className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/25 via-transparent to-transparent" />
      {images.length > 1 && (
        <>
          <Button size="icon" variant="secondary" className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-card/90 text-foreground hover:bg-card" onClick={() => setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-card/90 text-foreground hover:bg-card" onClick={() => setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Badge className="absolute bottom-3 right-3 border-border bg-card/90 text-[10px] text-foreground">
            <ImageIcon className="mr-1 h-3 w-3" />{currentIndex + 1}/{images.length}
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
  project,
  canManage = false,
}: LotDetailSheetProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [satellitePreview, setSatellitePreview] = useState<string | null>(null);
  const [satellitePreviewState, setSatellitePreviewState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  const { token: mapboxToken } = useMapboxToken();
  const sentinelCenter = lot
    && lot.latitude !== null
    && lot.latitude !== undefined
    && lot.longitude !== null
    && lot.longitude !== undefined
    && Number.isFinite(Number(lot.latitude))
    && Number.isFinite(Number(lot.longitude))
    ? { lat: Number(lot.latitude), lng: Number(lot.longitude) }
    : null;
  const sentinelQuery = useSentinelImagery({
    lots: lot ? [lot] : [],
    center: sentinelCenter,
    enabled: open && Boolean(lot),
    maxCloudCover: 35,
    lookbackDays: 90,
  });

  useEffect(() => {
    let cancelled = false;
    if (!open || !lot || !sentinelQuery.data?.available) {
      setSatellitePreview(null);
      setSatellitePreviewState('idle');
      return () => { cancelled = true; };
    }

    setSatellitePreview(null);
    setSatellitePreviewState('loading');
    void renderLotSatelliteSnapshot(lot, sentinelQuery.data, {
      mapboxToken,
      width: 1000,
      height: 600,
    }).then((image) => {
      if (cancelled) return;
      setSatellitePreview(image);
      setSatellitePreviewState(image ? 'ready' : 'failed');
    });

    return () => { cancelled = true; };
  }, [open, lot?.id, lot?.updated_at, mapboxToken, sentinelQuery.data]);

  if (!lot) return null;

  const features = parseLotFeatures(lot.features);
  const status = getStatusConfig(lot.status);
  const polygon = lot.polygon as number[][] | null;
  const pricePerSqm = formatPublicLotUnitPrice(lot.price, Number(lot.area));
  const slopeLabel = getSlopeLabel(lot.slope_category);
  const images = ((lot).images as string[] | null) || [];

  const handleDownloadFicha = async () => {
    setIsDownloading(true);
    try {
      await generateLotDataCardPdf(lot, projectName, features, { mapboxToken, sentinelImagery: sentinelQuery.data });
      toast.success('Ficha del lote descargada');
    } catch {
      toast.error('Error al generar ficha PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="theme-rural w-full overflow-y-auto border-l border-border bg-background p-0 text-foreground sm:max-w-xl">
        <div className="sticky top-0 z-20 border-b border-border bg-card px-6 pb-5 pt-6 backdrop-blur-xl">
          <SheetHeader className="mb-0 text-left">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Terrain View · Lot Inspector
            </div>
            <div className="flex items-start justify-between gap-4 pr-8">
              <div>
                <SheetTitle className="text-3xl font-bold tracking-tight text-foreground">Lote {lot.lot_number}</SheetTitle>
                <SheetDescription className="mt-1 text-sm text-muted-foreground">
                  {projectName}{lot.name && lot.name !== lot.lot_number && ` · ${lot.name}`}
                </SheetDescription>
              </div>
              <Badge className={cn('mt-1 shrink-0 rounded-full px-3 py-1 text-xs', status.className)}>{status.label}</Badge>
            </div>
          </SheetHeader>

          <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Precio</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{formatPrice(lot.price)}</p>
              {pricePerSqm && <p className="mt-1 text-sm text-muted-foreground">{pricePerSqm}</p>}
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Superficie</p>
              <p className="mt-1 text-xl font-semibold">{Number(lot.area).toLocaleString('es-CL')} m²</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 pb-32 pt-5">
          {images.length > 0 && <ImageGallery images={images} />}

          {sentinelQuery.data?.available && (
            <section className="overflow-hidden rounded-2xl border border-primary/25 bg-muted/60">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold">
                    <Satellite className="h-4 w-4 text-primary" />
                    Imagen satelital actual
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Sentinel-2 · {formatSentinelDate(sentinelQuery.data.acquisition_datetime)} · {sentinelCloudLabel(sentinelQuery.data.cloud_cover)}
                  </p>
                </div>
                <Badge variant="outline" className="border-primary/25 bg-primary/10 text-[10px] text-primary">
                  Microsoft Planetary Computer
                </Badge>
              </div>
              <div className="aspect-[5/3] bg-card">
                {satellitePreviewState === 'ready' && satellitePreview ? (
                  <img
                    src={satellitePreview}
                    alt={`Sentinel-2 reciente con deslinde del Lote ${lot.lot_number}`}
                    className="h-full w-full object-cover"
                  />
                ) : satellitePreviewState === 'failed' ? (
                  <div className="flex h-full items-center justify-center px-6 text-center text-xs text-muted-foreground">
                    La escena Sentinel está disponible, pero esta vista no pudo renderizarse. El masterplan mantiene Mapbox Satellite como respaldo.
                  </div>
                ) : (
                  <Skeleton className="h-full w-full bg-muted/60" />
                )}
              </div>
              <p className="border-t border-border px-4 py-2.5 text-[10px] leading-relaxed text-muted-foreground">
                El satélite actualiza el contexto visual. El deslinde blanco/verde proviene de la geometría KMZ/topográfica del proyecto y no se modifica desde Sentinel.
              </p>
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-border bg-muted/60">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-xs font-semibold">Vista de parcela</p>
                <p className="text-[11px] text-muted-foreground">Forma, escala y contexto 3D</p>
              </div>
              <Box className="h-4 w-4 text-primary" />
            </div>
            <div className="h-[300px] bg-card sm:h-[340px]">
              <ViewerErrorBoundary label="la vista 3D" className="h-full rounded-none border-0">
              <Suspense fallback={<Skeleton className="h-full w-full bg-muted/60" />}>
                <div className="h-full [&>div]:!h-full [&>div]:!rounded-none [&>div]:!border-0">
                  <ParcelaDesigner3D
                    polygon={polygon}
                    lotNumber={lot.lot_number}
                    lotArea={Number(lot.area)}
                    lotPrice={lot.price ?? undefined}
                    latitude={lot.latitude ?? undefined}
                    longitude={lot.longitude ?? undefined}
                    mode="preview"
                  />
                </div>
              </Suspense>
              </ViewerErrorBoundary>
            </div>
            {lot.status === 'available' && onDesign && (
              <button type="button" onClick={() => onDesign(lot)} className="flex w-full items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
                <span className="flex items-center gap-2"><Palette className="h-4 w-4 text-primary" />Abrir diseñador 3D</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-muted/60 p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground"><Ruler className="h-3.5 w-3.5" />Superficie</div>
              <p className="mt-2 text-xl font-semibold">{Number(lot.area).toLocaleString('es-CL')} m²</p>
            </div>
            <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" />Precio/m²</div>
              <p className="mt-2 text-xl font-semibold text-primary">{pricePerSqm ?? '—'}</p>
            </div>
          </section>

          {features.rolSii && (
            <section className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/60 p-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Rol SII propio</p>
                <p className="mt-1 font-mono text-lg font-semibold">{features.rolSii}</p>
              </div>
              {features.rolCertificate && (
                <p className="text-right text-xs text-muted-foreground">Certificado SII<br />N° {features.rolCertificate}</p>
              )}
            </section>
          )}

          {(lot.elevation_avg || slopeLabel || features.hasWater || features.hasElectricity || features.hasRoad) && (
            <section>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Condiciones del lote</p>
              <div className="flex flex-wrap gap-2">
                {lot.elevation_avg && <Badge variant="outline" className="border-border bg-muted/60 text-muted-foreground"><Mountain className="mr-1.5 h-3.5 w-3.5" />{Math.round(Number(lot.elevation_avg))}m snm</Badge>}
                {slopeLabel && <Badge variant="outline" className="border-border bg-muted/60 text-muted-foreground">📐 {slopeLabel}</Badge>}
                {features.hasWater && <Badge variant="outline" className="border-border bg-muted/60 text-muted-foreground"><Droplets className="mr-1.5 h-3.5 w-3.5 text-sky-400" />Agua</Badge>}
                {features.hasElectricity && <Badge variant="outline" className="border-border bg-muted/60 text-muted-foreground"><Zap className="mr-1.5 h-3.5 w-3.5 text-amber-400" />Electricidad</Badge>}
                {features.hasRoad && <Badge variant="outline" className="border-border bg-muted/60 text-muted-foreground"><Route className="mr-1.5 h-3.5 w-3.5" />Acceso vial</Badge>}
              </div>
            </section>
          )}

          {lot.latitude && lot.longitude && (
            <section className="rounded-2xl border border-border bg-muted/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4 text-primary" />Ubicación</div>
              <p className="mt-2 text-xs text-muted-foreground">{Number(lot.latitude).toFixed(5)}, {Number(lot.longitude).toFixed(5)}</p>
              <a href={`https://www.google.com/maps?q=${lot.latitude},${lot.longitude}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:text-primary">
                Ver en Google Maps <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </section>
          )}

          {legalDocuments.length > 0 && (
            <section>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Documentos del proyecto</p>
              <div className="divide-y divide-white/10 rounded-2xl border border-border bg-muted/60">
                {legalDocuments.slice(0, 4).map((doc, i: number) => (
                  <a key={i} href={doc.url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
                    <span>📄 {doc.name || `Documento ${i + 1}`}</span><ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </section>
          )}

          <Separator className="bg-muted/60" />

          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" className="border-border bg-muted/60 text-foreground hover:bg-muted/60" onClick={() => handleShare(lot)}><Share2 className="mr-1.5 h-3.5 w-3.5" />Compartir</Button>
            <Button variant="outline" size="sm" className="border-primary/25 bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary" onClick={() => handleWhatsApp(lot, projectName)}><MessageCircle className="mr-1.5 h-3.5 w-3.5" />WhatsApp</Button>
            <Button variant="outline" size="sm" className="border-border bg-muted/60 text-foreground hover:bg-muted/60" onClick={handleDownloadFicha} disabled={isDownloading}><Download className="mr-1.5 h-3.5 w-3.5" />{isDownloading ? '...' : 'Ficha'}</Button>
          </div>

          {lot.status === 'reserved' && (
            <div className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 text-sm text-amber-300">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>Este lote se encuentra actualmente reservado.</span>
            </div>
          )}

          {canManage && project && (
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Gestión</p>
              <PublishLotButton lot={lot} project={project} />
            </div>
          )}
        </div>

        {lot.status === 'available' && (
          <div className="fixed bottom-0 right-0 z-30 w-full space-y-2 border-t border-border bg-card p-4 backdrop-blur-xl sm:max-w-xl">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              {canReservePublicLot(lot) && onReserve ? (
                <Button size="lg" className="h-12 gap-2 rounded-xl bg-primary font-semibold text-black hover:bg-emerald-400" onClick={() => onReserve(lot)}>
                  <Bookmark className="h-4 w-4" />Reservar lote
                </Button>
              ) : (
                <Button size="lg" variant="secondary" className="h-12 gap-2 rounded-xl" onClick={() => handleWhatsApp(lot, projectName)}>
                  <MessageCircle className="h-4 w-4" />Consultar lote
                </Button>
              )}
              {onDesign && <Button variant="outline" size="lg" className="h-12 rounded-xl border-border bg-muted/60 px-4 text-foreground hover:bg-muted/60" onClick={() => onDesign(lot)} aria-label="Diseñar parcela"><Palette className="h-4 w-4" /></Button>}
              {canReservePublicLot(lot) && onFinance && <Button variant="outline" size="lg" className="h-12 rounded-xl border-border bg-muted/60 px-4 text-foreground hover:bg-muted/60" onClick={() => onFinance(lot)} aria-label="Simular financiamiento"><Calculator className="h-4 w-4" /></Button>}
            </div>
            <Button asChild variant="outline" size="sm" className="w-full gap-2 rounded-xl border-border bg-muted/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground">
              <Link
                to={`/agendar?project_id=${lot.project_id}&lot_id=${lot.id}&lot_number=${encodeURIComponent(lot.lot_number)}&project_name=${encodeURIComponent(projectName)}&source=lot-detail`}
              >
                <CalendarCheck className="h-3.5 w-3.5" />Agendar visita a terreno
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
