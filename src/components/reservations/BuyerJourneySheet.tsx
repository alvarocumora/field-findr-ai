import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  Circle,
  CircleDot,
  FileCheck,
  Mail,
  Phone,
  User,
  Wallet,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useBuyerJourney, type JourneyEvent } from '@/hooks/useBuyerJourney';
import { cn } from '@/lib/utils';

interface BuyerJourneySheetProps {
  reservationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const StatusIcon = ({ status }: { status: JourneyEvent['status'] }) => {
  if (status === 'done') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (status === 'current') return <CircleDot className="h-5 w-5 text-amber-500 animate-pulse" />;
  return <Circle className="h-5 w-5 text-muted-foreground/40" />;
};

/**
 * Historia del comprador: el recorrido completo de una transacción
 * (lead → reserva → seña → venta → contrato → crédito → cierre) en un panel
 * lateral, anclado a la reserva.
 */
const BuyerJourneySheet = ({ reservationId, open, onOpenChange }: BuyerJourneySheetProps) => {
  const { data: journey, isLoading } = useBuyerJourney(open ? reservationId : null);

  const res = journey?.reservation;
  const lot = res?.lots;
  const project = lot?.projects;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Historia del comprador
          </SheetTitle>
          <SheetDescription>
            Recorrido completo de la transacción
          </SheetDescription>
        </SheetHeader>

        {isLoading || !journey ? (
          <div className="space-y-4 py-6">
            <Skeleton className="h-20 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-5 py-5">
            {/* Buyer + lot summary */}
            <div className="rounded-xl border border-border/40 bg-muted/30 p-4 space-y-2">
              <p className="font-semibold text-foreground">{res.buyer_name}</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                {res.buyer_email && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> {res.buyer_email}
                  </p>
                )}
                {res.buyer_phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> {res.buyer_phone}
                  </p>
                )}
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" />
                  {lot?.name || `Lote ${lot?.lot_number}`} · {project?.name}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="outline" className="text-[10px]">
                  Seña {formatCLP(Number(res.reservation_amount || 0))}
                </Badge>
                {lot?.price != null && (
                  <Badge variant="outline" className="text-[10px]">
                    Precio {formatCLP(Number(lot.price))}
                  </Badge>
                )}
                {journey.commission && (
                  <Badge variant="outline" className="text-[10px] text-violet-600 border-violet-500/30">
                    Comisión {formatCLP(Number(journey.commission.commission_amount))}
                    {journey.commission.status === 'paid' ? ' · pagada' : ' · pendiente'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="relative pl-1">
              {journey.events.map((event, i) => (
                <div key={event.key} className="relative flex gap-3 pb-5 last:pb-0">
                  {/* Connector line */}
                  {i < journey.events.length - 1 && (
                    <span
                      className={cn(
                        'absolute left-[9px] top-6 bottom-0 w-px',
                        event.status === 'done' ? 'bg-emerald-500/40' : 'bg-border',
                      )}
                    />
                  )}
                  <div className="relative z-10 mt-0.5 shrink-0 bg-background rounded-full">
                    <StatusIcon status={event.status} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          event.status === 'pending' ? 'text-muted-foreground/70' : 'text-foreground',
                        )}
                      >
                        {event.title}
                      </p>
                      {event.date && (
                        <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                          {format(new Date(event.date), 'dd MMM yyyy', { locale: es })}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                    )}
                    {event.documentUrl && (
                      <a
                        href={event.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                      >
                        <FileCheck className="h-3 w-3" /> Ver documento
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Credit installments summary */}
            {journey.credit && journey.creditPayments.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    Cuotas del crédito
                  </p>
                  <div className="grid grid-cols-10 gap-1">
                    {journey.creditPayments.map((p: any) => (
                      <span
                        key={p.id}
                        title={`Cuota ${p.payment_number} · ${p.status}`}
                        className={cn(
                          'h-2.5 rounded-sm',
                          p.status === 'paid'
                            ? 'bg-emerald-500'
                            : p.status === 'overdue'
                              ? 'bg-red-500'
                              : 'bg-muted-foreground/20',
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {journey.creditPayments.filter((p: any) => p.status === 'paid').length} pagadas ·{' '}
                    {journey.creditPayments.filter((p: any) => p.status === 'overdue').length} vencidas ·{' '}
                    {journey.creditPayments.filter((p: any) => p.status === 'pending').length} pendientes
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default BuyerJourneySheet;
