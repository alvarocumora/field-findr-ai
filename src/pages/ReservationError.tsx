import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw, Phone } from 'lucide-react';

export default function ReservationError() {
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('reservation_id');

  return (
    <div className="min-h-screen bg-gradient-to-b from-destructive/5 to-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Pago No Completado</CardTitle>
          <CardDescription>
            Hubo un problema al procesar tu pago de reserva
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Info */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-center">
            <p className="text-sm text-muted-foreground">
              No te preocupes, no se ha realizado ningún cobro a tu cuenta.
              Puedes intentar nuevamente o contactarnos para asistencia.
            </p>
          </div>

          {/* Possible Reasons */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-medium text-sm">Posibles razones:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Fondos insuficientes</li>
              <li>Tarjeta rechazada por el banco</li>
              <li>Tiempo de sesión expirado</li>
              <li>Problema de conexión</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Button asChild className="w-full">
              <Link to="/">
                <RefreshCw className="h-4 w-4 mr-2" />
                Intentar nuevamente
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Link>
            </Button>
          </div>

          {/* Contact */}
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              ¿Necesitas ayuda?
            </p>
            <a 
              href="tel:+56912345678" 
              className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium"
            >
              <Phone className="h-3 w-3" />
              Contáctanos
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
