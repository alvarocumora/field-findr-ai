export type AppContext = 'buyer' | 'broker' | 'empresa' | 'plataforma';

export interface AppContextOption {
  id: AppContext;
  label: string;
  shortLabel: string;
  home: string;
  area: 'buyer' | 'agent' | 'admin';
}

export const APP_CONTEXTS: Record<AppContext, AppContextOption> = {
  buyer: {
    id: 'buyer',
    label: 'Comprador',
    shortLabel: 'Comprador',
    home: '/comprador/inicio',
    area: 'buyer',
  },
  broker: {
    id: 'broker',
    label: 'Broker',
    shortLabel: 'Broker',
    home: '/asesor/mi-negocio',
    area: 'agent',
  },
  empresa: {
    id: 'empresa',
    label: 'Empresa',
    shortLabel: 'Empresa',
    home: '/asesor/dashboard',
    area: 'agent',
  },
  plataforma: {
    id: 'plataforma',
    label: 'Administración de plataforma',
    shortLabel: 'Plataforma',
    home: '/admin/dashboard',
    area: 'admin',
  },
};

export interface ContextIdentity {
  isBuyer: boolean;
  isAgent: boolean;
  isAdmin: boolean;
  hasOrganization: boolean;
  isBroker: boolean;
  plan?: string | null;
}

/**
 * Contexts describe what the person is doing now. They are intentionally
 * separate from roles (identity), organization roles (permissions) and plans
 * (product entitlements).
 */
export const resolveAvailableContexts = (identity: ContextIdentity): AppContextOption[] => {
  const result: AppContextOption[] = [];
  const normalizedPlan = identity.plan ?? 'free';

  // A community broker on the free tier should land in the broker workspace,
  // not in the SaaS company workspace. Paid brokers can use both.
  const hasCompanyWorkspace =
    identity.isAgent &&
    (identity.hasOrganization || normalizedPlan !== 'free' || !identity.isBroker);

  if (hasCompanyWorkspace) result.push(APP_CONTEXTS.empresa);
  if (identity.isBroker) result.push(APP_CONTEXTS.broker);
  if (identity.isBuyer) result.push(APP_CONTEXTS.buyer);
  if (identity.isAdmin) result.push(APP_CONTEXTS.plataforma);

  return result;
};

export const normalizeStoredContext = (value?: string | null): AppContext | null => {
  if (!value) return null;
  if (value === 'comercial') return 'empresa'; // v1 compatibility
  return value in APP_CONTEXTS ? value as AppContext : null;
};

export const resolveContextFromPath = (
  pathname: string,
  available: readonly AppContextOption[],
  current?: AppContext | null,
): AppContext | null => {
  const has = (id: AppContext) => available.some((option) => option.id === id);

  if (pathname.startsWith('/admin') && has('plataforma')) return 'plataforma';
  if (
    (pathname.startsWith('/comprador') ||
      pathname.startsWith('/favoritos') ||
      pathname.startsWith('/mi-terreno')) &&
    has('buyer')
  ) return 'buyer';

  if (pathname.startsWith('/asesor')) {
    if ((current === 'broker' || current === 'empresa') && has(current)) return current;

    const brokerFirstRoutes = [
      '/asesor/mi-negocio',
      '/asesor/red',
      '/asesor/proyectos-en-venta',
    ];
    if (brokerFirstRoutes.some((path) => pathname.startsWith(path)) && has('broker')) {
      return 'broker';
    }

    if (has('empresa')) return 'empresa';
    if (has('broker')) return 'broker';
  }

  return null;
};

export const resolvePreferredContext = (
  available: readonly AppContextOption[],
  preferred?: AppContext | null,
): AppContextOption | null => {
  if (preferred) {
    const match = available.find((option) => option.id === preferred);
    if (match) return match;
  }
  return available.length === 1 ? available[0] : null;
};
