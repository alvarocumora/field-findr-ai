import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PublicLayout from '@/components/layouts/PublicLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * MercadoPago back_url for payments that stay in_process/pending (bank
 * transfer, cash points). Polls the subscription until the webhook activates
 * it, then moves the user to the success page.
 */
const SubscriptionPending = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
      query.state.data?.status === 'active' ? false : 5000,
  });

  useEffect(() => {
    if (subscription?.status === 'active') {
      navigate('/subscription/success', { replace: true });
    }
  }, [subscription?.status, navigate]);

  return (
    <PublicLayout>
      <div className="container py-16 px-4 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl">Pago Pendiente</CardTitle>
            <CardDescription>
              Tu pago está siendo procesado por MercadoPago
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Apenas se acredite el pago activaremos tu plan automáticamente.
                Esta página se actualiza sola, y también te avisaremos por email.
              </p>
            </div>

            <div className="rounded-lg border-2 border-dashed border-yellow-500/30 p-4 space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Tiempos de acreditación
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><strong>Tarjeta de crédito/débito:</strong> Instantáneo</li>
                <li><strong>Transferencia bancaria:</strong> 1-2 días hábiles</li>
                <li><strong>Efectivo en puntos de pago:</strong> 1-3 horas</li>
              </ul>
            </div>

            <Button asChild variant="outline" className="w-full">
              <a href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default SubscriptionPending;
