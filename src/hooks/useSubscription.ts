import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export type PlanType = 'free' | 'professional' | 'enterprise';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  status: string;
  mercadopago_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  name: string;
  price: number;
  currency: string;
  features: string[];
}

export const PLAN_DETAILS: Record<PlanType, Plan & { id: PlanType }> = {
  free: {
    id: 'free',
    name: 'Plan Gratuito',
    price: 0,
    currency: 'CLP',
    features: [
      'Hasta 3 publicaciones',
      'Búsqueda básica',
      'Mapa interactivo',
      'Alertas por email'
    ]
  },
  professional: {
    id: 'professional',
    name: 'Plan Profesional',
    price: 49990,
    currency: 'CLP',
    features: [
      'Hasta 50 publicaciones activas',
      'LandScore AI completo',
      'CRM integrado',
      'Alertas en tiempo real',
      'Soporte prioritario'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Plan Empresa',
    price: 149990,
    currency: 'CLP',
    features: [
      'Publicaciones ilimitadas',
      'BuildCheck AI',
      'API de datos',
      'White-label',
      'Soporte dedicado 24/7'
    ]
  }
};

export const useSubscription = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as Subscription | null;
    },
    enabled: !!user,
  });
};

export const useCreateCheckout = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planType: PlanType) => {
      if (!user) throw new Error('User not authenticated');

      const response = await supabase.functions.invoke('mercadopago/create-preference', {
        body: {
          plan_type: planType,
          user_id: user.id,
          user_email: user.email,
          success_url: `${window.location.origin}/subscription/success`,
          failure_url: `${window.location.origin}/subscription/failure`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to MercadoPago checkout
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo iniciar el pago',
        variant: 'destructive'
      });
    }
  });
};

export const useCurrentPlan = () => {
  const { data: subscription, isLoading } = useSubscription();
  
  return {
    plan: subscription?.plan_type || 'free',
    isLoading,
    isPremium: subscription?.plan_type === 'professional' || subscription?.plan_type === 'enterprise',
    isEnterprise: subscription?.plan_type === 'enterprise',
    subscription
  };
};
