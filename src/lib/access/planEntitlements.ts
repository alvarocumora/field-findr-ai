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
