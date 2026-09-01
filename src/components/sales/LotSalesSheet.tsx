import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { LotFinancialSummary } from './LotFinancialSummary';
import {
  CalendarDays, ChevronLeft, ChevronRight, MapPin, MessageCircle, Mountain, Ruler,
} from 'lucide-react';

export interface SalesLot {
  id: string;
  lot_number?: string | null;
  status?: string | null;
  area?: number | null;
  price?: number | null;
  slope_category?: string | null;
  elevation_avg?: number | null;
  images?: string[] | null;
}

interface LotSalesSheetProps {
  lot: SalesLot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  /** Número de WhatsApp del proyecto (opcional). */
  whatsapp?: string;
  onLead: (lot: SalesLot) => void;
  onReserve?: (lot: SalesLot) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

const clp = (n?: number | null) =>
  n && n > 0 ? `$${Math.round(n).toLocaleString('es-CL')}` : 'Consultar';

const statusMeta = (status?: string | null) => {
  switch (status) {
    case 'available':
      return { label: 'Disponible', className: 'bg-emerald-500 text-white' };
    case 'reserved':
      return { label: 'Reservado', className: 'bg-amber-500 text-white' };
    case 'sold':
      return { label: 'Vendido', className: 'bg-muted text-muted-foreground' };
    default:
      return { label: status ?? 'Sin estado', className: 'bg-muted text-muted-foreground' };
  }
};

/**
 * Ficha comercial de lote reutilizable: bottom-sheet en mobile y panel lateral
 * en escritorio. Solo presentación sobre datos públicos ya existentes
 * (get_public_lots): no consulta ni escribe backend.
 */
export const LotSalesSheet = ({
  lot, open, onOpenChange, projectName, whatsapp,
  onLead, onReserve, onPrev, onNext, hasPrev, hasNext,
}: LotSalesSheetProps) => {
  const isMobile = useIsMobile();
  if (!lot) return null;

  const meta = statusMeta(lot.status);
  const available = (lot.status ?? 'available') === 'available';
  const waHref = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Hola, me interesa el lote ${lot.lot_number ?? ''} de ${projectName}.`,
      )}`
    : undefined;
  const image = lot.images?.[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={
          isMobile
            ? 'h-[88vh] rounded-t-2xl overflow-y-auto p-0'
            : 'w-full sm:max-w-md overflow-y-auto p-0'
        }
      >
        <div className="p-5 space-y-4">
          <SheetHeader className="space-y-2 text-left">
            <div className="flex items-center justify-between gap-2">
              <SheetTitle className="text-xl">
                Lote {lot.lot_number ?? '—'}
              </SheetTitle>
              <Badge className={meta.className}>{meta.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />{projectName}
            </p>
          </SheetHeader>

          {image && (
            <img
              src={image}
              alt={`Lote ${lot.lot_number ?? ''} de ${projectName}`}
              loading="lazy"
              className="aspect-video w-full rounded-xl object-cover"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5" />Superficie
              </p>
              <p className="mt-1 font-semibold text-foreground">
                {lot.area ? `${Math.round(lot.area).toLocaleString('es-CL')} m²` : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Precio</p>
              <p className="mt-1 font-semibold text-foreground">{clp(lot.price)}</p>
            </div>
          </div>

          {(lot.slope_category || lot.elevation_avg) && (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {lot.slope_category && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1">
                  <Mountain className="h-3.5 w-3.5" />Pendiente: {lot.slope_category}
                </span>
              )}
              {lot.elevation_avg ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1">
                  Elevación: {Math.round(lot.elevation_avg)} m
                </span>
              ) : null}
            </div>
          )}

          <LotFinancialSummary price={lot.price} area={lot.area} className="border-border/60" />

          <Separator />

          <div className="grid gap-2">
            <Button size="lg" className="w-full min-h-11" onClick={() => onLead(lot)}>
              <CalendarDays className="h-4 w-4 mr-2" />Agendar visita
            </Button>
            {waHref && (
              <Button asChild size="lg" variant="secondary" className="w-full min-h-11">
                <a href={waHref} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" />Hablar con un asesor
                </a>
              </Button>
            )}
            {available && onReserve && (
              <Button
                size="lg"
                variant="outline"
                className="w-full min-h-11"
                onClick={() => onReserve(lot)}
              >
                Reservar lote
              </Button>
            )}
          </div>

          {(onPrev || onNext) && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11"
                onClick={onPrev}
                disabled={!hasPrev}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />Anterior
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11"
                onClick={onNext}
                disabled={!hasNext}
              >
                Siguiente<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LotSalesSheet;
