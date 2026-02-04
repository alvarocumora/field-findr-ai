import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PublicLayout from '@/components/layouts/PublicLayout';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    // Invalidate subscription query to refresh data
    if (user) {
      queryClient.invalidateQueries({ queryKey: ['subscription', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-roles', user.id] });
    }
  }, [user, queryClient]);

  return (
    <PublicLayout>
      <div className="container py-16 px-4 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto p-4 rounded-full bg-primary/10 mb-4">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">¡Pago Exitoso!</CardTitle>
            <CardDescription className="text-base">
              Tu suscripción ha sido activada correctamente. Ahora tienes acceso a todas las 
              funcionalidades premium de OfertaTerrenos AI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                ID de transacción: {searchParams.get('payment_id') || 'Procesando...'}
              </p>
            </div>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              Ir al Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => navigate('/tools')}
            >
              Explorar Herramientas AI
            </Button>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default SubscriptionSuccess;
