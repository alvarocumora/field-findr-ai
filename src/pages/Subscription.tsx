import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  useSubscription, orgBillingIdFor,
  useCreateCheckout,
  PLAN_DETAILS,
  LATAM_PRICES,
  normalizePlanId,
  type PlanType,
} from '@/hooks/useSubscription';
import { useMyOrganization } from '@/hooks/useMyOrganization';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import {
  Crown, Calendar, CreditCard, ArrowUpRight, Check, AlertCircle,
  XCircle, RefreshCw, ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Subscription = () => {
  const { user } = useAuth();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: team, isLoading: organizationLoading } = useMyOrganization();
  const organizationId = orgBillingIdFor(team as any);
  const { mutate: createCheckout, isPending: checkoutLoading } = useCreateCheckout();

  // Historial del workspace activo, con fallback para pagos personales legacy.
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', user?.id, organizationId],
    queryFn: async () => {
      if (!user) return [];

      if (organizationId) {
        const organizationPayments = await (supabase as any)
          .from('payments')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(10);
        if (organizationPayments.error) throw organizationPayments.error;
        if ((organizationPayments.data ?? []).length > 0) return organizationPayments.data;
      }

      const { data, error } = await (supabase as any)
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !organizationLoading,
  });

  const queryClient = useQueryClient();
  const currentPlan = normalizePlanId(subscription?.plan_type);
  const planDetails = PLAN_DETAILS[currentPlan];
  const currentPlanPrice = LATAM_PRICES.CLP[currentPlan];
  const isActive = subscription?.status === 'active';

  const handleUpgrade = (planType: PlanType) => {
    createCheckout(planType);
  };

  // Cancel: mark as cancel_at_period_end, keep active until period ends
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!subscription) throw new Error('No hay suscripción activa');
      const { error } = await (supabase as any)
        .from('subscriptions')
        .update({ cancel_at_period_end: true })
        .eq('id', subscription.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Suscripción cancelada', description: 'Mantendrás acceso hasta el final del período pagado.' });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  // Reactivate: undo cancel_at_period_end
  const reactivateMutation = useMutation({
    mutationFn: async () => {
      if (!subscription) throw new Error('No hay suscripción');
      const { error } = await (supabase as any)
        .from('subscriptions')
        .update({ cancel_at_period_end: false })
        .eq('id', subscription.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Suscripción reactivada', description: 'Se renovará automáticamente al final del período.' });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  // Other paid plans available to switch to
  const CHANGEABLE_PLANS: PlanType[] = ['corredor', 'corredora', 'inmobiliaria', 'grupo', 'enterprise'];
  const otherPlans = CHANGEABLE_PLANS.filter((p) => p !== currentPlan);


  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      active: { variant: 'default', label: 'Activo' },
      approved: { variant: 'default', label: 'Pagado' },
      pending: { variant: 'secondary', label: 'Pendiente' },
      cancelled: { variant: 'destructive', label: 'Cancelado' },
      rejected: { variant: 'destructive', label: 'Rechazado' },
    };
    const config = variants[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (subLoading) {
    return (
      <Layout>
        <div className="container max-w-4xl py-8 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-4xl py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mi Suscripción</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tu plan y revisa tu historial de pagos
          </p>
        </div>

        {/* Current Plan Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{planDetails.name}</CardTitle>
                  <CardDescription>
                    {currentPlan === 'free' ? 'Plan gratuito' : 'Suscripción mensual'}
                  </CardDescription>
                </div>
              </div>
              {subscription && getStatusBadge(subscription.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price */}
            <div className="text-3xl font-bold text-foreground">
              {currentPlanPrice === 0 ? (
                'Gratis'
              ) : (
                <>
                  ${currentPlanPrice.toLocaleString('es-CL')}
                  <span className="text-base font-normal text-muted-foreground">/mes</span>
                </>
              )}
            </div>

            {/* Billing info */}
            {subscription && subscription.current_period_end && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Próximo cobro: {format(new Date(subscription.current_period_end), "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="grid gap-2 pt-2">
              {planDetails.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              {currentPlan === 'free' && (
                <Button onClick={() => handleUpgrade('starter')} disabled={checkoutLoading}>
                  <Crown className="h-4 w-4 mr-2" />
                  Elegir plan
                </Button>
              )}

              {isActive && currentPlan !== 'free' && !subscription?.cancel_at_period_end && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-destructive hover:text-destructive">
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar suscripción
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Cancelar tu suscripción?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Mantendrás acceso a las funciones de {planDetails.name} hasta el{' '}
                        {subscription?.current_period_end &&
                          format(new Date(subscription.current_period_end), "d 'de' MMMM, yyyy", { locale: es })}
                        . Después tu cuenta volverá al plan gratuito.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Volver</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => cancelMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sí, cancelar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {subscription?.cancel_at_period_end && (
                <Button
                  variant="default"
                  onClick={() => reactivateMutation.mutate()}
                  disabled={reactivateMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reactivar suscripción
                </Button>
              )}

              <Button variant="outline" asChild>
                <Link to="/pricing">Ver todos los planes</Link>
              </Button>
            </div>

            {/* Cancel warning */}
            {subscription?.cancel_at_period_end && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Suscripción cancelada</p>
                  <p className="text-sm text-muted-foreground">
                    Tu plan seguirá activo hasta {subscription.current_period_end &&
                      format(new Date(subscription.current_period_end), "d 'de' MMMM, yyyy", { locale: es })}
                    . Puedes reactivarla en cualquier momento antes de esa fecha.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Plan */}
        {otherPlans.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Cambiar de plan</CardTitle>
              </div>
              <CardDescription>
                Al confirmar te redirigimos al checkout de Mercado Pago. Tu plan se activará automáticamente cuando el pago sea aprobado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {otherPlans.map((p) => {
                  const target = PLAN_DETAILS[p];
                  return (
                    <div
                      key={p}
                      className="flex items-center justify-between gap-3 p-4 rounded-lg border hover:border-primary/40 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-foreground">{target.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${LATAM_PRICES.CLP[p].toLocaleString('es-CL')} <span className="text-xs">/mes</span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleUpgrade(p)}
                        disabled={checkoutLoading}
                      >
                        Cambiar
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}


        {/* Payment History */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Historial de Pagos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : payments && payments.length > 0 ? (
              <div className="divide-y">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {payment.description || 'Pago de suscripción'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-foreground">
                        ${payment.amount.toLocaleString('es-CL')} {payment.currency}
                      </span>
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No hay pagos registrados
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Subscription;
