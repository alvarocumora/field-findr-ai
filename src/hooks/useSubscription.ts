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

// Multi-currency pricing for LATAM — aligned to Chilean market benchmark (UF base)
export const LATAM_PRICES: Record<string, Record<PlanType, number>> = {
  UF:  { free: 0, starter: 2.0, growth: 4.5, scale: 8.0, enterprise: 15.0 },
  CLP: { free: 0, starter: 75000, growth: 168750, scale: 300000, enterprise: 562500 },
  USD: { free: 0, starter: 75, growth: 165, scale: 295, enterprise: 599 },
  ARS: { free: 0, starter: 67500, growth: 148500, scale: 265500, enterprise: 539100 },
  COP: { free: 0, starter: 299900, growth: 659900, scale: 1179900, enterprise: 2399900 },
  MXN: { free: 0, starter: 1299, growth: 2899, scale: 4999, enterprise: 9999 },
};

// Featured listing add-on pricing (per listing, per month)
export type AddOnType = 'basic' | 'featured' | 'super_featured';

export interface ListingAddOn {
  id: AddOnType;
  name: string;
  description: string;
  multiplier: string;
  features: string[];
}

export const LISTING_ADDONS: ListingAddOn[] = [
  {
    id: 'basic',
    name: 'Publicación Básica',
    description: 'Listado estándar en el marketplace',
    multiplier: 'Incluido en plan',
    features: ['Ficha estándar', 'Fotos (hasta 5)', 'Mapa de ubicación'],
  },
  {
    id: 'featured',
    name: 'Publicación Destacada',
    description: 'Mayor visibilidad y posicionamiento premium',
    multiplier: '3x visibilidad',
    features: [
      'Badge "Destacado" visible',
      'Prioridad en resultados de búsqueda',
      'Fotos ilimitadas + galería HD',
      'Estadísticas de visitas detalladas',
      'Aparece en sección "Destacados"',
    ],
  },
  {
    id: 'super_featured',
    name: 'Super Destacada',
    description: 'Máxima exposición + herramientas de conversión',
    multiplier: '10x visibilidad',
    features: [
      'Todo de Destacada +',
      'Banner premium en landing y explorar',
      'Video/tour 360° integrado',
      'Botón WhatsApp directo',
      'Reporte semanal de rendimiento',
      'Posición fija top en resultados',
    ],
  },
];

export const ADDON_PRICES: Record<string, Record<AddOnType, number>> = {
  UF:  { basic: 0, featured: 0.5, super_featured: 1.5 },
  CLP: { basic: 0, featured: 18750, super_featured: 56250 },
  USD: { basic: 0, featured: 19, super_featured: 55 },
  MXN: { basic: 0, featured: 329, super_featured: 949 },
  COP: { basic: 0, featured: 75900, super_featured: 219900 },
  ARS: { basic: 0, featured: 17100, super_featured: 49500 },
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
