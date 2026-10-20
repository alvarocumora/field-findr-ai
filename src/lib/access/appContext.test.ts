import { describe, expect, it } from 'vitest';
import {
  resolveAvailableContexts,
  resolveContextFromPath,
  resolvePreferredContext,
} from './appContext';

describe('app contexts', () => {
  it('keeps a free community broker out of the SaaS company context', () => {
    expect(resolveAvailableContexts({
      isBuyer: false,
      isAgent: true,
      isAdmin: false,
      hasOrganization: false,
      isBroker: true,
      plan: 'free',
    }).map((item) => item.id)).toEqual(['broker']);
  });

  it('offers broker and company contexts to a paid broker', () => {
    expect(resolveAvailableContexts({
      isBuyer: true,
      isAgent: true,
      isAdmin: false,
      hasOrganization: false,
      isBroker: true,
      plan: 'corredor',
    }).map((item) => item.id)).toEqual(['empresa', 'broker', 'buyer']);
  });

  it('does not force a multi-context user without a stored preference', () => {
    const available = resolveAvailableContexts({
      isBuyer: true,
      isAgent: true,
      isAdmin: true,
      hasOrganization: true,
      isBroker: false,
      plan: 'inmobiliaria',
    });
    expect(resolvePreferredContext(available, null)).toBeNull();
  });

  it('lets URL context win for platform and buyer areas', () => {
    const available = resolveAvailableContexts({
      isBuyer: true,
      isAgent: true,
      isAdmin: true,
      hasOrganization: true,
      isBroker: true,
      plan: 'grupo',
    });
    expect(resolveContextFromPath('/admin/dashboard', available, 'empresa')).toBe('plataforma');
    expect(resolveContextFromPath('/comprador/inicio', available, 'empresa')).toBe('buyer');
  });

  it('infers broker context from a broker-first deep link', () => {
    const available = resolveAvailableContexts({
      isBuyer: true,
      isAgent: true,
      isAdmin: false,
      hasOrganization: false,
      isBroker: true,
      plan: 'corredor',
    });
    expect(resolveContextFromPath('/asesor/mi-negocio', available, null)).toBe('broker');
  });

  it('does not offer an agent workspace when an active broker profile has no agent role', () => {
    const contexts = resolveAvailableContexts({
      isBuyer: true, isAgent: false, isAdmin: false,
      hasOrganization: false, isBroker: true, plan: 'free',
    });
    expect(contexts.map((item) => item.id)).toEqual(['buyer']);
  });

  it('does not infer privileged contexts from unrelated route prefixes', () => {
    const contexts = resolveAvailableContexts({
      isBuyer: true, isAgent: true, isAdmin: true,
      hasOrganization: true, isBroker: true, plan: 'grupo',
    });
    expect(resolveContextFromPath('/administracion', contexts, null)).toBeNull();
    expect(resolveContextFromPath('/asesores', contexts, null)).toBeNull();
    expect(resolveContextFromPath('/compradores', contexts, null)).toBeNull();
    expect(resolveContextFromPath('/asesor/mi-negocio', contexts, null)).toBe('broker');
    expect(resolveContextFromPath('/admin/dashboard', contexts, null)).toBe('plataforma');
  });

  it('preserves broker context while navigating /asesor routes', () => {
    const available = resolveAvailableContexts({
      isBuyer: false,
      isAgent: true,
      isAdmin: false,
      hasOrganization: false,
      isBroker: true,
      plan: 'free',
    });
    expect(resolveContextFromPath('/asesor/comisiones', available, 'broker')).toBe('broker');
  });
});
