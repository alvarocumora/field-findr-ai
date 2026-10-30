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
  const { isAdmin, isAgent, isBuyer, isLoading: rolesLoading, isError: rolesError, refetchRoles } = useSmartRedirect();
  const planState = useCurrentPlan();
  const { plan, planDetails, isLoading: planLoading, isError: planError, refetch: refetchPlan } = planState;
  const { data: team, isLoading: organizationLoading, isError: organizationError, refetch: refetchOrganization } = useMyOrganization();
  const { data: brokerProfile, isLoading: brokerLoading, isError: brokerError, refetch: refetchBroker } = useMyBrokerProfile();
  const { pathname } = useLocation();

  const planIsAgency =
    plan === 'corredora' || plan === 'inmobiliaria' || plan === 'grupo' || plan === 'enterprise';

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
    planDetails,
    organizationRole: team?.organizationRole ?? null,
    organization: team?.organization ?? null,
    brokerProfile: brokerProfile ?? null,
    isLoading: rolesLoading || planLoading || organizationLoading || brokerLoading,
    // Un rol/organización ausente por fallo de consulta no es lo mismo que una
    // cuenta sin organización: lo primero debe bloquear decisiones de acceso
    // (useAccess), no degradarlas en silencio a "sin organización".
    isError: rolesError || planError || organizationError || brokerError,
    organizationError,
    retry: () => {
      if (rolesError) void refetchRoles();
      if (planError) void refetchPlan();
      if (organizationError) void refetchOrganization();
      if (brokerError) void refetchBroker();
    },
  };
};
