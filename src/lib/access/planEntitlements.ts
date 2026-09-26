import { normalizePlanId, type PlanType } from '@/hooks/useSubscription';

export type PlanFeature =
  | 'marketplace'
  | 'crm'
  | 'quotes'
  | 'reservations'
  | 'payments'
  | 'kmz'
  | 'spatial3d'
  | 'financing'
  | 'analytics'
  | 'team'
  | 'commissions'
  | 'api'
  | 'white_label'
  | 'sso'
  | 'multi_org';

const FEATURES: Record<Exclude<PlanType, 'starter' | 'growth' | 'scale'>, readonly PlanFeature[]> = {
  free: ['marketplace'],
  corredor: ['marketplace', 'crm', 'quotes'],
  corredora: ['marketplace', 'crm', 'quotes', 'reservations', 'payments', 'kmz'],
  inmobiliaria: [
    'marketplace', 'crm', 'quotes', 'reservations', 'payments', 'kmz',
    'spatial3d', 'financing', 'analytics', 'team', 'commissions',
  ],
  grupo: [
    'marketplace', 'crm', 'quotes', 'reservations', 'payments', 'kmz',
    'spatial3d', 'financing', 'analytics', 'team', 'commissions', 'api',
    'white_label',
  ],
  enterprise: [
    'marketplace', 'crm', 'quotes', 'reservations', 'payments', 'kmz',
    'spatial3d', 'financing', 'analytics', 'team', 'commissions', 'api',
    'white_label', 'sso', 'multi_org',
  ],
};

export const planFeaturesFor = (plan?: string | null): readonly PlanFeature[] => {
  const normalized = normalizePlanId(plan) as Exclude<PlanType, 'starter' | 'growth' | 'scale'>;
  return FEATURES[normalized] ?? FEATURES.free;
};

export const hasPlanFeature = (plan: string | null | undefined, feature: PlanFeature) =>
  planFeaturesFor(plan).includes(feature);


export const FEATURE_LABELS: Record<PlanFeature, string> = {
  marketplace: 'Marketplace',
  crm: 'CRM',
  quotes: 'Cotizaciones',
  reservations: 'Reservas online',
  payments: 'Pagos online',
  kmz: 'Importación KMZ/KML',
  spatial3d: 'Spatial 3D',
  financing: 'Financiamiento',
  analytics: 'Analytics',
  team: 'Gestión de equipo',
  commissions: 'Comisiones',
  api: 'API',
  white_label: 'White-label',
  sso: 'SSO / SAML',
  multi_org: 'Multi-organización',
};

const FEATURE_MIN_PLAN: Record<PlanFeature, Exclude<PlanType, 'starter' | 'growth' | 'scale'>> = {
  marketplace: 'free',
  crm: 'corredor',
  quotes: 'corredor',
  reservations: 'corredora',
  payments: 'corredora',
  kmz: 'corredora',
  spatial3d: 'inmobiliaria',
  financing: 'inmobiliaria',
  analytics: 'inmobiliaria',
  team: 'inmobiliaria',
  commissions: 'inmobiliaria',
  api: 'grupo',
  white_label: 'grupo',
  sso: 'enterprise',
  multi_org: 'enterprise',
};

export const minimumPlanForFeature = (feature: PlanFeature) => FEATURE_MIN_PLAN[feature];
