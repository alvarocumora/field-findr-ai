import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PublicLayout from '@/components/layouts/PublicLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMyOrganization } from '@/hooks/useMyOrganization';

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: team } = useMyOrganization();
  const checkoutId = searchParams.get('checkout_id');

  // MP redirects here before the webhook runs; poll for the subscription the
  // webhook stamps with THIS exact checkout_id instead of trusting the URL
  // or declaring victory from any pre-existing active subscription (the
  // viewer's own prior plan, or another org's).
  const { data: subscription } = useQuery({
    queryKey: ['subscription-checkout', checkoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan_type, user_id, organization_id')
        .eq('last_checkout_id', checkoutId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!checkoutId,
    refetchInterval: (query) =>
      query.state.data?.status === 'active' ? false : 3000,
  });

  // Defense in depth: even a matched checkout_id must belong to the viewer
  // (their own user_id, or an organization they're part of) before it counts.
  const belongsToViewer = !!subscription && (
    subscription.user_id === user?.id
    || (!!subscription.organization_id && !!team?.organizations.some((org) => org.id === subscription.organization_id))
  );
  const isActive = belongsToViewer && subscription?.status === 'active';
  // No checkout_id at all (stale bookmark, direct navigation): we cannot
  // verify which payment this is, so we never guess from an unrelated plan.
  const unconfirmed = !checkoutId;

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
            {unconfirmed ? (
              <>
                <div className="mx-auto p-4 rounded-full bg-amber-500/10 mb-4">
                  <AlertTriangle className="h-12 w-12 text-amber-600" />
                </div>
                <CardTitle className="text-2xl">No pudimos confirmar este pago</CardTitle>
                <CardDescription className="text-base">
                  No encontramos una referencia de pago en este enlace. Revisa el estado de tu
                  suscripción o vuelve a intentar el pago desde tu panel.
                </CardDescription>
              </>
            ) : isActive ? (
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
              onClick={() => navigate(unconfirmed ? '/subscription' : '/dashboard')}
            >
              {unconfirmed ? 'Ver mi suscripción' : 'Ir al Dashboard'}
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
