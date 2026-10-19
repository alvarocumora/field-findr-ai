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
  legalDocuments?: any[];
  project?: import('@/lib/marketplace/lotToListing').ProjectForListing | null;
  canManage?: boolean;
}

const formatPrice = (price: number | null) => {
  if (!price) return 'Consultar';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
  }).format(price);
};

const getStatusConfig = (status: string | null) => {
  switch (status) {
    case 'available': return { label: 'Disponible', className: 'bg-emerald-500 text-white border-emerald-400/30' };
    case 'reserved': return { label: 'Reservado', className: 'bg-amber-500 text-white border-amber-400/30' };
    case 'sold': return { label: 'Vendido', className: 'bg-zinc-700 text-zinc-200 border-zinc-600' };
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
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
      <div className="aspect-[16/9]">
        <img src={images[currentIndex]} alt={`Foto ${currentIndex + 1}`} className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      {images.length > 1 && (
        <>
          <Button size="icon" variant="secondary" className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-black/55 text-white hover:bg-black/75" onClick={() => setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-black/55 text-white hover:bg-black/75" onClick={() => setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Badge className="absolute bottom-3 right-3 border-white/10 bg-black/55 text-[10px] text-white">
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
  const pricePerSqm = lot.price_per_sqm || (lot.price && lot.area ? lot.price / Number(lot.area) : null);
  const slopeLabel = getSlopeLabel(lot.slope_category);
  const images = ((lot as any).images as string[] | null) || [];

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
      <SheetContent side="right" className="w-full overflow-y-auto border-l border-white/10 bg-zinc-950 p-0 text-white sm:max-w-xl">
        <div className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/92 px-6 pb-5 pt-6 backdrop-blur-xl">
          <SheetHeader className="mb-0 text-left">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Terrain View · Lot Inspector
            </div>
            <div className="flex items-start justify-between gap-4 pr-8">
              <div>
                <SheetTitle className="text-3xl font-bold tracking-tight text-white">Lote {lot.lot_number}</SheetTitle>
                <SheetDescription className="mt-1 text-sm text-white/50">
                  {projectName}{lot.name && lot.name !== lot.lot_number && ` · ${lot.name}`}
                </SheetDescription>
              </div>
              <Badge className={cn('mt-1 shrink-0 rounded-full px-3 py-1 text-xs', status.className)}>{status.label}</Badge>
            </div>
          </SheetHeader>

          <div className="mt-5 grid grid-cols-[1fr_auto] items-end gap-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Precio</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-white">{formatPrice(lot.price)}</p>
              {pricePerSqm && <p className="mt-1 text-sm text-white/45">{formatPrice(pricePerSqm)}/m²</p>}
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Superficie</p>
              <p className="mt-1 text-xl font-semibold">{Number(lot.area).toLocaleString('es-CL')} m²</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 pb-32 pt-5">
          {images.length > 0 && <ImageGallery images={images} />}

          {sentinelQuery.data?.available && (
            <section className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-white/[0.035]">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold">
                    <Satellite className="h-4 w-4 text-emerald-400" />
                    Imagen satelital actual
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/40">
                    Sentinel-2 · {formatSentinelDate(sentinelQuery.data.acquisition_datetime)} · {sentinelCloudLabel(sentinelQuery.data.cloud_cover)}
                  </p>
                </div>
                <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-[10px] text-emerald-300">
                  Microsoft Planetary Computer
                </Badge>
              </div>
              <div className="aspect-[5/3] bg-zinc-900/60">
                {satellitePreviewState === 'ready' && satellitePreview ? (
                  <img
                    src={satellitePreview}
                    alt={`Sentinel-2 reciente con deslinde del Lote ${lot.lot_number}`}
                    className="h-full w-full object-cover"
                  />
                ) : satellitePreviewState === 'failed' ? (
                  <div className="flex h-full items-center justify-center px-6 text-center text-xs text-white/45">
                    La escena Sentinel está disponible, pero esta vista no pudo renderizarse. El masterplan mantiene Mapbox Satellite como respaldo.
                  </div>
                ) : (
                  <Skeleton className="h-full w-full bg-white/5" />
                )}
              </div>
              <p className="border-t border-white/10 px-4 py-2.5 text-[10px] leading-relaxed text-white/40">
                El satélite actualiza el contexto visual. El deslinde blanco/verde proviene de la geometría KMZ/topográfica del proyecto y no se modifica desde Sentinel.
              </p>
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-xs font-semibold">Vista de parcela</p>
                <p className="text-[11px] text-white/40">Forma, escala y contexto 3D</p>
              </div>
              <Box className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="h-[300px] bg-zinc-900/50 sm:h-[340px]">
              <Suspense fallback={<Skeleton className="h-full w-full bg-white/5" />}>
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
            </div>
            {lot.status === 'available' && onDesign && (
              <button type="button" onClick={() => onDesign(lot)} className="flex w-full items-center justify-between border-t border-white/10 px-4 py-3 text-sm text-white/65 transition-colors hover:bg-white/5 hover:text-white">
                <span className="flex items-center gap-2"><Palette className="h-4 w-4 text-emerald-400" />Abrir diseñador 3D</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/35"><Ruler className="h-3.5 w-3.5" />Superficie</div>
              <p className="mt-2 text-xl font-semibold">{Number(lot.area).toLocaleString('es-CL')} m²</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/35"><TrendingUp className="h-3.5 w-3.5" />Precio/m²</div>
              <p className="mt-2 text-xl font-semibold text-emerald-400">{pricePerSqm ? `${formatPrice(pricePerSqm)}/m²` : '—'}</p>
            </div>
          </section>

          {(lot.elevation_avg || slopeLabel || features.hasWater || features.hasElectricity || features.hasRoad) && (
            <section>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Condiciones del lote</p>
              <div className="flex flex-wrap gap-2">
                {lot.elevation_avg && <Badge variant="outline" className="border-white/10 bg-white/[0.035] text-white/70"><Mountain className="mr-1.5 h-3.5 w-3.5" />{Math.round(Number(lot.elevation_avg))}m snm</Badge>}
                {slopeLabel && <Badge variant="outline" className="border-white/10 bg-white/[0.035] text-white/70">📐 {slopeLabel}</Badge>}
                {features.hasWater && <Badge variant="outline" className="border-white/10 bg-white/[0.035] text-white/70"><Droplets className="mr-1.5 h-3.5 w-3.5 text-sky-400" />Agua</Badge>}
                {features.hasElectricity && <Badge variant="outline" className="border-white/10 bg-white/[0.035] text-white/70"><Zap className="mr-1.5 h-3.5 w-3.5 text-amber-400" />Electricidad</Badge>}
                {features.hasRoad && <Badge variant="outline" className="border-white/10 bg-white/[0.035] text-white/70"><Route className="mr-1.5 h-3.5 w-3.5" />Acceso vial</Badge>}
              </div>
            </section>
          )}

          {lot.latitude && lot.longitude && (
            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4 text-emerald-400" />Ubicación</div>
              <p className="mt-2 text-xs text-white/40">{Number(lot.latitude).toFixed(5)}, {Number(lot.longitude).toFixed(5)}</p>
              <a href={`https://www.google.com/maps?q=${lot.latitude},${lot.longitude}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300">
                Ver en Google Maps <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </section>
          )}

          {legalDocuments.length > 0 && (
            <section>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Documentos del proyecto</p>
              <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.025]">
                {legalDocuments.slice(0, 4).map((doc: any, i: number) => (
                  <a key={i} href={doc.url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-3 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white">
                    <span>📄 {doc.name || `Documento ${i + 1}`}</span><ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </section>
          )}

          <Separator className="bg-white/10" />

          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" className="border-white/10 bg-white/[0.025] text-white hover:bg-white/5" onClick={() => handleShare(lot)}><Share2 className="mr-1.5 h-3.5 w-3.5" />Compartir</Button>
            <Button variant="outline" size="sm" className="border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300" onClick={() => handleWhatsApp(lot, projectName)}><MessageCircle className="mr-1.5 h-3.5 w-3.5" />WhatsApp</Button>
            <Button variant="outline" size="sm" className="border-white/10 bg-white/[0.025] text-white hover:bg-white/5" onClick={handleDownloadFicha} disabled={isDownloading}><Download className="mr-1.5 h-3.5 w-3.5" />{isDownloading ? '...' : 'Ficha'}</Button>
          </div>

          {lot.status === 'reserved' && (
            <div className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 text-sm text-amber-300">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>Este lote se encuentra actualmente reservado.</span>
            </div>
          )}

          {canManage && project && (
            <div className="border-t border-white/10 pt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Gestión</p>
              <PublishLotButton lot={lot as any} project={project} />
            </div>
          )}
        </div>

        {lot.status === 'available' && (
          <div className="fixed bottom-0 right-0 z-30 w-full space-y-2 border-t border-white/10 bg-zinc-950/95 p-4 backdrop-blur-xl sm:max-w-xl">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <Button size="lg" className="h-12 gap-2 rounded-xl bg-emerald-500 font-semibold text-black hover:bg-emerald-400" onClick={() => onReserve?.(lot)}>
                <Bookmark className="h-4 w-4" />Reservar lote
              </Button>
              {onDesign && <Button variant="outline" size="lg" className="h-12 rounded-xl border-white/10 bg-white/[0.035] px-4 text-white hover:bg-white/[0.07]" onClick={() => onDesign(lot)} aria-label="Diseñar parcela"><Palette className="h-4 w-4" /></Button>}
              {onFinance && <Button variant="outline" size="lg" className="h-12 rounded-xl border-white/10 bg-white/[0.035] px-4 text-white hover:bg-white/[0.07]" onClick={() => onFinance(lot)} aria-label="Simular financiamiento"><Calculator className="h-4 w-4" /></Button>}
            </div>
            <Button asChild variant="outline" size="sm" className="w-full gap-2 rounded-xl border-white/10 bg-white/[0.025] text-white/80 hover:bg-white/5 hover:text-white">
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
