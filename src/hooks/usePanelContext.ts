import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSmartRedirect } from '@/hooks/useSmartRedirect';
import { useCurrentPlan } from '@/hooks/useSubscription';
import { useMyOrganization } from '@/hooks/useMyOrganization';
import { useMyBrokerProfile } from '@/hooks/useBrokers';
import {
  normalizeStoredContext,
  resolveAvailableContexts,
  resolveContextFromPath,
  resolvePreferredContext,
  type AppContext,
  type AppContextOption,
} from '@/lib/access/appContext';

const STORAGE_KEY = 'ot:app-context:v2';
const LEGACY_STORAGE_KEY = 'ot:panel-context';

export type PanelContext = AppContext;
export type PanelContextOption = AppContextOption;

const readStoredContext = (): AppContext | null => {
  if (typeof window === 'undefined') return null;
  return normalizeStoredContext(
    window.localStorage.getItem(STORAGE_KEY)
      ?? window.localStorage.getItem(LEGACY_STORAGE_KEY),
  );
};

/**
 * Contexto activo del usuario.
 *
 * Context != role:
 * - role answers who the user is (buyer/agent/admin),
 * - organization role answers what the user may do inside a company,
 * - plan answers which product features are enabled,
 * - context answers what workspace the user is using right now.
 */
export const usePanelContext = () => {
  const { isAdmin, isAgent, isBuyer, isLoading: rolesLoading } = useSmartRedirect();
  const { plan, isLoading: planLoading } = useCurrentPlan();
  const { data: team, isLoading: organizationLoading } = useMyOrganization();
  const { data: brokerProfile, isLoading: brokerLoading } = useMyBrokerProfile();
  const { pathname } = useLocation();

  const planIsAgency = plan === 'inmobiliaria' || plan === 'grupo' || plan === 'enterprise';

  const options = useMemo(
    () => resolveAvailableContexts({
      isBuyer,
      isAgent,
      isAdmin,
      hasOrganization: Boolean(team?.organization),
      isBroker: Boolean(brokerProfile?.is_active),
      plan,
    }),
    [brokerProfile?.is_active, isAdmin, isAgent, isBuyer, plan, team?.organization],
  );

  const [context, setContextState] = useState<AppContext | null>(() => readStoredContext());
  const [hasStoredContext, setHasStoredContext] = useState(() => Boolean(readStoredContext()));

  useEffect(() => {
    if (options.length === 0) return;

    const routeContext = resolveContextFromPath(pathname, options, context);
    if (routeContext && routeContext !== context) {
      setContextState(routeContext);
      window.localStorage.setItem(STORAGE_KEY, routeContext);
      setHasStoredContext(true);
      return;
    }

    if (context && !options.some((option) => option.id === context)) {
      setContextState(null);
      setHasStoredContext(false);
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [context, options, pathname]);

  const setContext = useCallback((next: AppContext) => {
    if (!options.some((option) => option.id === next)) return;
    setContextState(next);
    setHasStoredContext(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }, [options]);

  const active =
    options.find((option) => option.id === context)
    ?? resolvePreferredContext(options, hasStoredContext ? readStoredContext() : null);

  return {
    context: active?.id ?? null,
    active,
    options,
    setContext,
    hasStoredContext,
    needsChoice: !hasStoredContext && options.length > 1,
    planIsAgency,
    plan,
    organizationRole: team?.organizationRole ?? null,
    organization: team?.organization ?? null,
    brokerProfile: brokerProfile ?? null,
    isLoading: rolesLoading || planLoading || organizationLoading || brokerLoading,
  };
};
