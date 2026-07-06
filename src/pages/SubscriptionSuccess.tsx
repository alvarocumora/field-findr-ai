import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PublicLayout from '@/components/layouts/PublicLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // MP redirects here before the webhook runs; poll the subscription until it
  // is really active instead of declaring victory from the URL alone.
  const { data: subscription } = useQuery({
    queryKey: ['subscription-status', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan_type')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: (query) =>
      query.state.data?.status === 'active' ? false : 3000,
  });

  const isActive = subscription?.status === 'active';

  useEffect(() => {
    // Refresh subscription/roles once the webhook activates the plan
    if (user && isActive) {
      queryClient.invalidateQueries({ queryKey: ['subscription', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-roles', user.id] });
    }
  }, [user, isActive, queryClient]);

  return (
    <PublicLayout>
      <div className="container py-16 px-4 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            {isActive ? (
              <>
                <div className="mx-auto p-4 rounded-full bg-primary/10 mb-4">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">¡Pago Exitoso!</CardTitle>
                <CardDescription className="text-base">
                  Tu suscripción ha sido activada correctamente. Ahora tienes acceso a todas las
                  funcionalidades premium de OfertaTerrenos AI.
                </CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto p-4 rounded-full bg-amber-500/10 mb-4">
                  <Clock className="h-12 w-12 text-amber-600 animate-pulse" />
                </div>
                <CardTitle className="text-2xl">Activando tu plan…</CardTitle>
                <CardDescription className="text-base">
                  El pago fue aprobado y estamos activando tu suscripción.
                  Esta página se actualiza sola en unos segundos.
                </CardDescription>
              </>
            )}
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
