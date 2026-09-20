import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSmartRedirect } from '@/hooks/useSmartRedirect';
import { useCurrentPlan } from '@/hooks/useSubscription';

/**
 * Contexto activo del panel privado.
 *
 * Un usuario puede tener varios roles (p.ej. admin de plataforma que además
 * opera como corredor). En vez de apilar todos los menús en la barra lateral,
 * el panel muestra UN contexto a la vez y ofrece un selector para cambiarlo.
 */
export type PanelContext = 'comercial' | 'plataforma';

const STORAGE_KEY = 'ot:panel-context';

export interface PanelContextOption {
  id: PanelContext;
  label: string;
  /** Área del manifiesto de rutas de la que sale la navegación. */
  area: 'agent' | 'admin';
  home: string;
}

export const usePanelContext = () => {
  const { isAdmin, isAgent } = useSmartRedirect();
  const { plan } = useCurrentPlan();
  const { pathname } = useLocation();

  const planIsAgency = plan === 'inmobiliaria' || plan === 'grupo' || plan === 'enterprise';

  const options = useMemo<PanelContextOption[]>(() => {
    const list: PanelContextOption[] = [];
    if (isAgent || isAdmin) {
      list.push({
        id: 'comercial',
        label: planIsAgency ? 'Inmobiliaria' : 'Corredor',
        area: 'agent',
        home: '/asesor/dashboard',
      });
    }
    if (isAdmin) {
      list.push({
        id: 'plataforma',
        label: 'Administración de plataforma',
        area: 'admin',
        home: '/admin/dashboard',
      });
    }
    return list;
  }, [isAdmin, isAgent, planIsAgency]);

  const [context, setContextState] = useState<PanelContext>(() => {
    if (typeof window === 'undefined') return 'comercial';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'plataforma' ? 'plataforma' : 'comercial';
  });

  // Si el contexto guardado ya no está disponible para este usuario, cae al primero.
  useEffect(() => {
    if (options.length === 0) return;
    if (!options.some((o) => o.id === context)) {
      setContextState(options[0].id);
    }
  }, [options, context]);

  // La URL manda: entrar a /admin/... cambia el menú al contexto de plataforma
  // y volver a /asesor/... lo devuelve al comercial.
  useEffect(() => {
    const byPath: PanelContext | null = pathname.startsWith('/admin')
      ? 'plataforma'
      : pathname.startsWith('/asesor') || pathname.startsWith('/panel')
        ? 'comercial'
        : null;
    if (byPath && byPath !== context && options.some((o) => o.id === byPath)) {
      setContextState(byPath);
    }
  }, [pathname, context, options]);

  const setContext = useCallback((next: PanelContext) => {
    setContextState(next);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const active = options.find((o) => o.id === context) ?? options[0] ?? null;

  return { context: active?.id ?? 'comercial', active, options, setContext, planIsAgency, plan };
};
