import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export type PlanType = 'free' | 'starter' | 'growth' | 'scale' | 'enterprise';
export type UserRole = 'buyer' | 'agent' | 'admin';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: string;
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
  priceUSD: number;
  currency: string;
  maxUnits: number | null;
  maxProjects: number;
  maxPublications: number;
  features: string[];
  roleAccess: UserRole[];
  highlighted?: boolean;
}

// LATAM-ready pricing tiers based on units managed
export const PLAN_DETAILS: Record<PlanType, Plan & { id: PlanType }> = {
  free: {
    id: 'free',
    name: 'Explorador',
    price: 0,
    priceUSD: 0,
    currency: 'CLP',
    maxUnits: 5,
    maxProjects: 1,
    maxPublications: 3,
    roleAccess: ['buyer', 'agent'],
    features: [
      'Hasta 5 lotes por proyecto',
      '1 proyecto activo',
      '3 publicaciones en marketplace',
      'Mapa interactivo básico',
      'Alertas por email',
      'Búsqueda y exploración',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 29990,
    priceUSD: 35,
    currency: 'CLP',
    maxUnits: 30,
    maxProjects: 3,
    maxPublications: 20,
    roleAccess: ['agent'],
    highlighted: false,
    features: [
      'Hasta 30 lotes totales',
      '3 proyectos activos',
      '20 publicaciones en marketplace',
      'CRM de leads básico',
      'Importación KMZ/KML',
      'Cotizador público por proyecto',
      'Reportes PDF con tu marca',
      'Soporte por email',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 79990,
    priceUSD: 95,
    currency: 'CLP',
    maxUnits: 150,
    maxProjects: 10,
    maxPublications: 100,
    roleAccess: ['agent'],
    highlighted: true,
    features: [
      'Hasta 150 lotes totales',
      '10 proyectos activos',
      '100 publicaciones en marketplace',
      'CRM completo + lead scoring AI',
      'Reservas online con pasarela de pago',
      'Financiamiento directo (créditos)',
      'Dashboard multi-proyecto',
      'Analytics avanzados + BI',
      'Mapa 3D + planos interactivos',
      'Soporte prioritario',
    ],
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    price: 199990,
    priceUSD: 240,
    currency: 'CLP',
    maxUnits: 500,
    maxProjects: 50,
    maxPublications: 500,
    roleAccess: ['agent', 'admin'],
    features: [
      'Hasta 500 lotes totales',
      '50 proyectos activos',
      '500 publicaciones en marketplace',
      'Todo de Growth +',
      'Equipo multi-agente (hasta 10)',
      'Comisiones y metas por agente',
      'Cierre legal digital completo',
      'Webhooks + API REST',
      'White-label parcial',
      'Soporte dedicado',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499990,
    priceUSD: 599,
    currency: 'CLP',
    maxUnits: null,
    maxProjects: 999,
    maxPublications: 9999,
    roleAccess: ['agent', 'admin'],
    features: [
      'Lotes y proyectos ilimitados',
      'Publicaciones ilimitadas',
      'Todo de Scale +',
      'Multi-organización',
      'API avanzada con scopes custom',
      'White-label completo',
      'SSO / SAML',
      'SLA 99.9%',
      'Account manager dedicado',
      'Integración ERP personalizada',
    ],
  },
};

// Multi-currency pricing for LATAM
export const LATAM_PRICES: Record<string, Record<PlanType, number>> = {
  CLP: { free: 0, starter: 29990, growth: 79990, scale: 199990, enterprise: 499990 },
  USD: { free: 0, starter: 35, growth: 95, scale: 240, enterprise: 599 },
  ARS: { free: 0, starter: 29900, growth: 79900, scale: 199900, enterprise: 499900 },
  COP: { free: 0, starter: 139900, growth: 379900, scale: 959900, enterprise: 2399900 },
  MXN: { free: 0, starter: 599, growth: 1599, scale: 3999, enterprise: 9999 },
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
          failure_url: `${window.location.origin}/subscription/failure`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (data) => {
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo iniciar el pago',
        variant: 'destructive',
      });
    },
  });
};

export const useCurrentPlan = () => {
  const { data: subscription, isLoading } = useSubscription();

  const planType = (subscription?.plan_type as PlanType) || 'free';

  return {
    plan: planType,
    isLoading,
    isPremium: planType !== 'free',
    isEnterprise: planType === 'enterprise',
    isScale: planType === 'scale' || planType === 'enterprise',
    subscription,
    planDetails: PLAN_DETAILS[planType] || PLAN_DETAILS.free,
  };
};
