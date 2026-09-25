import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMyOrganization } from '@/hooks/useMyOrganization';
import { toast } from '@/hooks/use-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Nueva taxonomía orientada al rubro inmobiliario chileno.
// Mantenemos retro-compatibilidad con los ids legacy (starter/growth/scale)
// que aún existen en `subscriptions.plan_type` para clientes previos.
// ─────────────────────────────────────────────────────────────────────────────
export type PlanType =
  | 'free'
  | 'corredor'
  | 'corredora'
  | 'inmobiliaria'
  | 'grupo'
  | 'enterprise'
  // legacy
  | 'starter'
  | 'growth'
  | 'scale';

export type UserRole = 'buyer' | 'agent' | 'admin';

export interface Subscription {
  id: string;
  user_id: string;
  organization_id: string | null;
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
  target: string;
  price: number;         // UF/mes referencial (legacy)
  priceUSD: number;
  currency: string;
  maxUnits: number | null;
  maxProjects: number;
  maxPublications: number;
  includedFeatured: number;       // publicaciones destacadas incluidas / mes
  includedSuperFeatured: number;  // publicaciones super destacadas incluidas / mes
  teamSeats: number | null;
  features: string[];
  highlights: string[];           // 3 diferenciadores para landings
  roleAccess: UserRole[];
  highlighted?: boolean;
  ctaLabel?: string;
}

// Mapeo legacy → nuevo id (para renombrar en UI sin migración de datos)
export const LEGACY_PLAN_MAP: Record<string, PlanType> = {
  starter: 'corredora',
  growth: 'inmobiliaria',
  scale: 'grupo',
};

export const normalizePlanId = (id: string | null | undefined): PlanType => {
  if (!id) return 'free';
  if (id in LEGACY_PLAN_MAP) return LEGACY_PLAN_MAP[id];
  return id as PlanType;
};

// ─────────────────────────────────────────────────────────────────────────────
// PLAN CATALOG (v2 · jul-2026) — precios anclados a UF, competitivos con
// ChilePropiedades, TocToc y EasyBroker.
// ─────────────────────────────────────────────────────────────────────────────
export const PLAN_DETAILS: Record<PlanType, Plan & { id: PlanType }> = {
  free: {
    id: 'free',
    name: 'Explorador',
    target: 'Prueba el marketplace sin costo',
    price: 0,
    priceUSD: 0,
    currency: 'UF',
    maxUnits: 5,
    maxProjects: 1,
    maxPublications: 3,
    includedFeatured: 0,
    includedSuperFeatured: 0,
    teamSeats: 1,
    roleAccess: ['buyer', 'agent'],
    highlights: ['Explora terrenos', 'Publica 3 avisos', 'Alertas de precio'],
    features: [
      'Hasta 5 lotes por proyecto',
      '1 proyecto activo',
      '3 publicaciones en marketplace',
      'Mapa interactivo básico',
      'Alertas por email',
    ],
    ctaLabel: 'Comenzar gratis',
  },
  corredor: {
    id: 'corredor',
    name: 'Corredor',
    target: 'Corredor independiente que recién parte',
    price: 1.0,
    priceUSD: 39,
    currency: 'UF',
    maxUnits: 15,
    maxProjects: 1,
    maxPublications: 15,
    includedFeatured: 1,
    includedSuperFeatured: 0,
    teamSeats: 1,
    roleAccess: ['agent'],
    highlights: [
      '15 publicaciones activas',
      '1 destacada incluida al mes',
      'CRM básico + WhatsApp',
    ],
    features: [
      'Hasta 15 lotes / publicaciones activas',
      '1 destacada incluida al mes',
      'CRM básico de leads',
      'Cotizador público con tu marca',
      'Ficha PDF descargable',
      'Widget WhatsApp directo',
      'Soporte por email',
    ],
    ctaLabel: 'Empezar por 1 UF/mes',
  },
  corredora: {
    id: 'corredora',
    name: 'Corredora',
    target: 'Oficina con 1-3 agentes',
    price: 2.5,
    priceUSD: 95,
    currency: 'UF',
    maxUnits: 60,
    maxProjects: 3,
    maxPublications: 60,
    includedFeatured: 3,
    includedSuperFeatured: 1,
    teamSeats: 3,
    roleAccess: ['agent'],
    highlighted: true,
    highlights: [
      '60 publicaciones + 3 destacadas',
      'CRM completo con lead scoring IA',
      'Reservas online + pasarela de pago',
    ],
    features: [
      'Hasta 60 publicaciones activas',
      '3 destacadas + 1 super destacada / mes',
      '3 agentes en el equipo',
      'CRM completo + lead scoring IA',
      'Importación KMZ/KML',
      'Reservas online con Mercado Pago',
      'Dashboard multi-proyecto',
      'Reportes PDF con tu marca',
      'Soporte prioritario',
    ],
    ctaLabel: 'Empezar prueba',
  },
  inmobiliaria: {
    id: 'inmobiliaria',
    name: 'Inmobiliaria',
    target: 'Desarrollador con 1-3 proyectos activos',
    price: 5.0,
    priceUSD: 189,
    currency: 'UF',
    maxUnits: 200,
    maxProjects: 10,
    maxPublications: 200,
    includedFeatured: 10,
    includedSuperFeatured: 3,
    teamSeats: 8,
    roleAccess: ['agent'],
    highlights: [
      'Mapa 3D + planos interactivos',
      'Financiamiento directo (pie en cuotas)',
      'Tasación IA + BI de mercado',
    ],
    features: [
      'Hasta 200 publicaciones activas',
      '10 destacadas + 3 super destacadas / mes',
      '10 proyectos activos',
      'Equipo hasta 8 agentes',
      'CRM completo + lead scoring IA',
      'Reservas online + pasarela de pago',
      'Financiamiento directo (créditos internos)',
      'Mapa 3D + planos interactivos',
      'Tasación IA + reportes de mercado',
      'Analytics avanzados + BI',
      'Soporte prioritario',
    ],
    ctaLabel: 'Contratar Inmobiliaria',
  },
  grupo: {
    id: 'grupo',
    name: 'Grupo',
    target: 'Multi-proyecto, equipo grande, canje entre oficinas',
    price: 9.0,
    priceUSD: 339,
    currency: 'UF',
    maxUnits: 500,
    maxProjects: 50,
    maxPublications: 500,
    includedFeatured: 30,
    includedSuperFeatured: 10,
    teamSeats: 25,
    roleAccess: ['agent', 'admin'],
    highlights: [
      'Equipo hasta 25 agentes',
      'API REST + webhooks',
      'Cierre legal digital completo',
    ],
    features: [
      'Hasta 500 publicaciones activas',
      '30 destacadas + 10 super destacadas / mes',
      '50 proyectos activos',
      'Equipo hasta 25 agentes con roles',
      'Comisiones y metas por agente',
      'Todo lo de Inmobiliaria +',
      'Cierre legal digital completo',
      'API REST + Webhooks',
      'White-label parcial (subdominio)',
      'Soporte dedicado',
    ],
    ctaLabel: 'Contratar Grupo',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    target: 'Cadenas, holdings, marketplaces con >500 unidades',
    price: 0, // sales-led
    priceUSD: 0,
    currency: 'UF',
    maxUnits: null,
    maxProjects: 999,
    maxPublications: 9999,
    includedFeatured: 9999,
    includedSuperFeatured: 9999,
    teamSeats: null,
    roleAccess: ['agent', 'admin'],
    highlights: [
      'White-label completo + dominio propio',
      'SSO / SAML + SLA 99.9%',
      'Integración ERP + account manager',
    ],
    features: [
      'Publicaciones y proyectos ilimitados',
      'Destacadas ilimitadas',
      'Todo de Grupo +',
      'Multi-organización',
      'API avanzada con scopes custom',
      'White-label completo (dominio propio)',
      'SSO / SAML',
      'SLA 99.9%',
      'Account manager dedicado',
      'Integración ERP personalizada',
    ],
    ctaLabel: 'Contactar ventas',
  },
  // ─── Legacy ids (mostrados con nombre nuevo para clientes antiguos) ───
  starter: null as unknown as Plan & { id: PlanType },
  growth: null as unknown as Plan & { id: PlanType },
  scale: null as unknown as Plan & { id: PlanType },
};
// Alias legacy → nuevo objeto
PLAN_DETAILS.starter = { ...PLAN_DETAILS.corredora, id: 'starter' };
PLAN_DETAILS.growth = { ...PLAN_DETAILS.inmobiliaria, id: 'growth' };
PLAN_DETAILS.scale = { ...PLAN_DETAILS.grupo, id: 'scale' };

// Orden canónico para renderizar tarjetas
export const PLAN_ORDER_CORREDORES: PlanType[] = ['corredor', 'corredora'];
export const PLAN_ORDER_INMOBILIARIAS: PlanType[] = ['inmobiliaria', 'grupo', 'enterprise'];
export const PLAN_ORDER_ALL: PlanType[] = ['free', 'corredor', 'corredora', 'inmobiliaria', 'grupo', 'enterprise'];

// ─────────────────────────────────────────────────────────────────────────────
// Precios multi-moneda — MENSUAL (UF base)
// Anual = 10× mensual (2 meses gratis, estándar del mercado chileno).
// ─────────────────────────────────────────────────────────────────────────────
type PriceMap = Record<PlanType, number>;

const buildPriceMap = (values: Record<Exclude<PlanType, 'starter'|'growth'|'scale'>, number>): PriceMap => ({
  ...values,
  starter: values.corredora,
  growth: values.inmobiliaria,
  scale: values.grupo,
});

export const LATAM_PRICES: Record<string, PriceMap> = {
  UF:  buildPriceMap({ free: 0, corredor: 1.0,   corredora: 2.5,   inmobiliaria: 5.0,   grupo: 9.0,   enterprise: 0 }),
  CLP: buildPriceMap({ free: 0, corredor: 38000, corredora: 94000, inmobiliaria: 188000, grupo: 338000, enterprise: 0 }),
  USD: buildPriceMap({ free: 0, corredor: 39,    corredora: 95,    inmobiliaria: 189,    grupo: 339,    enterprise: 0 }),
  ARS: buildPriceMap({ free: 0, corredor: 35000, corredora: 84000, inmobiliaria: 168000, grupo: 302000, enterprise: 0 }),
  COP: buildPriceMap({ free: 0, corredor: 155000, corredora: 379000, inmobiliaria: 749000, grupo: 1349000, enterprise: 0 }),
  MXN: buildPriceMap({ free: 0, corredor: 690,   corredora: 1690,  inmobiliaria: 3390,   grupo: 5990,   enterprise: 0 }),
};

// Anual (por mes equivalente) — 2 meses gratis => 10/12 del mensual
export const LATAM_PRICES_ANNUAL: Record<string, PriceMap> = Object.fromEntries(
  Object.entries(LATAM_PRICES).map(([curr, map]) => [
    curr,
    Object.fromEntries(
      Object.entries(map).map(([plan, price]) => [plan, Math.round(price * 10 / 12)])
    ) as PriceMap,
  ])
);

export const ANNUAL_DISCOUNT_MONTHS = 2;

// ─────────────────────────────────────────────────────────────────────────────
// Add-ons de visibilidad (compatibles con cualquier plan)
// ─────────────────────────────────────────────────────────────────────────────
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
    multiplier: '3× visibilidad',
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
    multiplier: '10× visibilidad',
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

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────
export const useSubscription = () => {
  const { user } = useAuth();
  const { data: team, isLoading: organizationLoading } = useMyOrganization();
  const organizationId = team?.organization?.id ?? null;

  return useQuery({
    queryKey: ['subscription', user?.id, organizationId],
    queryFn: async () => {
      if (!user) return null;

      if (organizationId) {
        const { data: organizationSubscription, error: organizationError } = await (supabase as any)
          .from('subscriptions')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (organizationError) throw organizationError;
        if (organizationSubscription) return organizationSubscription as Subscription;
      }

      // Compatibilidad durante la migración de suscripciones personales.
      const { data, error } = await (supabase as any)
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user && !organizationLoading,
  });
};

export type BillingCycle = 'monthly' | 'annual';

export interface CheckoutParams {
  planType: PlanType;
  billingCycle?: BillingCycle;
  firstMonthDiscount?: boolean;
}

export const useCreateCheckout = () => {
  const { user } = useAuth();
  const { data: team } = useMyOrganization();
  const organization = team?.organization ?? null;
  const organizationRole = team?.organizationRole ?? null;

  return useMutation({
    mutationFn: async (params: PlanType | CheckoutParams) => {
      if (!user) throw new Error('User not authenticated');
      if (organization && !['owner', 'admin', 'org_admin'].includes(organizationRole ?? '')) {
        throw new Error('Solo el propietario o un administrador puede cambiar el plan');
      }

      const normalized: CheckoutParams =
        typeof params === 'string' ? { planType: params } : params;
      const { planType, billingCycle = 'monthly', firstMonthDiscount = true } = normalized;

      if (planType === 'enterprise') {
        window.location.href = '/contacto?plan=enterprise';
        return { redirected: true } as const;
      }
      if (planType === 'free') throw new Error('El plan Free no requiere pago');

      const response = await supabase.functions.invoke('mercadopago/create-preference', {
        body: {
          plan_type: planType,
          organization_id: organization?.id ?? null,
          billing_cycle: billingCycle,
          first_month_discount: firstMonthDiscount,
          success_url: `${window.location.origin}/subscription/success`,
          failure_url: `${window.location.origin}/subscription/failure`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: (data) => {
      if (data && 'init_point' in data && data.init_point) {
        window.location.href = data.init_point as string;
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

  const planType = normalizePlanId(subscription?.plan_type);

  return {
    plan: planType,
    isLoading,
    isPremium: planType !== 'free',
    isEnterprise: planType === 'enterprise',
    isScale: planType === 'grupo' || planType === 'enterprise' || planType === 'scale',
    subscription,
    planDetails: PLAN_DETAILS[planType] || PLAN_DETAILS.free,
  };
};
