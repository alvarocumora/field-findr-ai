import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PublicLayout from '@/components/layouts/PublicLayout';

const SubscriptionFailure = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <div className="container py-16 px-4 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto p-4 rounded-full bg-destructive/10 mb-4">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Pago No Completado</CardTitle>
            <CardDescription className="text-base">
              Hubo un problema al procesar tu pago. No se realizó ningún cargo a tu cuenta.
              Puedes intentarlo nuevamente o contactar a soporte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-left">
              <p className="text-sm font-medium mb-2">Posibles causas:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Fondos insuficientes</li>
                <li>• Tarjeta rechazada por el banco</li>
                <li>• Datos de pago incorrectos</li>
                <li>• Conexión interrumpida</li>
              </ul>
            </div>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => navigate('/pricing')}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Intentar Nuevamente
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default SubscriptionFailure;
