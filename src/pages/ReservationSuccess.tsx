import { useSearchParams, Link } from 'react-router-dom';
import { useReservation } from '@/hooks/useReservations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MapPin, Calendar, Download, ArrowLeft, Loader2, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(price);
};

export default function ReservationSuccess() {
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('reservation_id');

  // MercadoPago redirects here the instant it approves, often before the
  // webhook has marked the reservation as paid — poll until the DB confirms.
  const { data: reservation, isLoading, error } = useReservation(reservationId || '', {
    refetchWhilePending: true,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Reserva no encontrada</CardTitle>
            <CardDescription>
              No pudimos encontrar los detalles de tu reserva.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lot = reservation.lots as any;
  const project = lot?.projects;

  // The URL only says MP redirected with "approved" — the source of truth is
  // the reservation row, updated by the webhook.
  const isPaid = reservation.status === 'paid' || reservation.status === 'converted';
  const isProcessing = reservation.status === 'pending_payment';

  if (!isPaid && !isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <CardTitle>Reserva no vigente</CardTitle>
            <CardDescription>
              Esta reserva fue cancelada o expiró. Si crees que es un error, contáctanos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center pb-2">
          {isPaid ? (
            <>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl">¡Reserva Confirmada!</CardTitle>
              <CardDescription>
                Tu seña ha sido procesada exitosamente
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-10 w-10 text-amber-600 animate-pulse" />
              </div>
              <CardTitle className="text-2xl">Confirmando tu pago…</CardTitle>
              <CardDescription>
                MercadoPago aprobó el pago y estamos registrando tu reserva.
                Esta página se actualiza sola.
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Reservation Details */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Lote</span>
              <Badge variant="secondary" className="text-base">
                {lot?.lot_number}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Proyecto</span>
              <span className="font-medium">{project?.name}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Superficie</span>
              <span className="font-medium">{lot?.area?.toLocaleString()} m²</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{isPaid ? 'Seña pagada' : 'Seña'}</span>
              <span className="font-bold text-primary text-lg">
                {formatPrice(reservation.reservation_amount)}
              </span>
            </div>
            
            {reservation.paid_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fecha de pago</span>
                <span className="font-medium">
                  {format(new Date(reservation.paid_at), "d 'de' MMMM, yyyy", { locale: es })}
                </span>
              </div>
            )}
          </div>

          {/* Buyer Info */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <h4 className="font-medium text-sm">Datos del comprador</h4>
            <p className="text-sm">{reservation.buyer_name}</p>
            <p className="text-sm text-muted-foreground">{reservation.buyer_email}</p>
            {reservation.buyer_phone && (
              <p className="text-sm text-muted-foreground">{reservation.buyer_phone}</p>
            )}
          </div>

          {/* Next Steps */}
          <div className="rounded-lg border-2 border-dashed border-primary/30 p-4 space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximos pasos
            </h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Recibirás un email con el comprobante de tu reserva</li>
              <li>Un asesor te contactará en las próximas 24 horas</li>
              <li>Coordinaremos la firma de la Promesa de Compraventa</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Link>
            </Button>
            <Button
              className="flex-1"
              disabled={!isPaid}
              onClick={async () => {
                // jsPDF loads on demand so the route chunk stays light
                const { downloadReservationReceipt } = await import('@/lib/reservationReceiptPdf');
                downloadReservationReceipt(reservation);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Comprobante
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
