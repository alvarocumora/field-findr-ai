import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ArrowLeft, RefreshCw, Mail } from 'lucide-react';

export default function ReservationPending() {
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('reservation_id');

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-500/5 to-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Pago Pendiente</CardTitle>
          <CardDescription>
            Tu pago está siendo procesado
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Info */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-center">
            <p className="text-sm text-muted-foreground">
              El pago de tu reserva está pendiente de confirmación. 
              Esto puede tomar unos minutos dependiendo del método de pago utilizado.
            </p>
          </div>

          {/* Next Steps */}
          <div className="rounded-lg border-2 border-dashed border-yellow-500/30 p-4 space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              ¿Qué sigue?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Recibirás un email cuando el pago sea confirmado</li>
              <li>Tu lote quedará reservado por 48 horas</li>
              <li>Si el pago falla, podrás intentar nuevamente</li>
            </ul>
          </div>

          {/* Payment Methods Info */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-medium text-sm">Tiempos de acreditación:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><strong>Tarjeta de crédito/débito:</strong> Instantáneo</li>
              <li><strong>Transferencia bancaria:</strong> 1-2 días hábiles</li>
              <li><strong>Efectivo en puntos de pago:</strong> 1-3 horas</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Button asChild variant="outline" className="w-full">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Link>
            </Button>
          </div>

          {/* Reservation ID */}
          {reservationId && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                ID de reserva: <code className="bg-muted px-1 rounded">{reservationId}</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
