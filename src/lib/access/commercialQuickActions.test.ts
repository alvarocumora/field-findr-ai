import { describe, expect, it } from 'vitest';
import { visibleCommercialActions } from './commercialQuickActions';
import { routeManifest } from '@/routes/routeManifest';

const actions = ['/asesor/projects', '/asesor/leads', '/asesor/analytics', '/admin/users', '/explorar']
  .map(route => ({ route }));
const makeAccess = (context: 'broker' | 'empresa' | 'plataforma', can = true, hasFeature = true) => ({
  context,
  isAgent: true,
  isAdmin: context === 'plataforma',
  plan: 'corredora',
  can: () => can,
  hasFeature: () => hasFeature,
});

describe('quick actions for commercial workspaces', () => {
  it('never offers company-only modules inside broker context', () => {
    const result = visibleCommercialActions(actions, routeManifest, makeAccess('broker'));
    expect(result.map(x => x.route)).toEqual(['/asesor/leads', '/explorar']);
  });

  it('never offers admin routes inside a company workspace', () => {
    const result = visibleCommercialActions(actions, routeManifest, makeAccess('empresa'));
    expect(result.map(x => x.route)).toEqual(['/asesor/projects', '/asesor/leads', '/asesor/analytics', '/explorar']);
  });

  it('respects capability and feature gates and keeps public exploration', () => {
    const lackingCapability = visibleCommercialActions(actions, routeManifest, makeAccess('empresa', false, true));
    expect(lackingCapability.map(x => x.route)).toEqual(['/explorar']);
    const lackingFeature = visibleCommercialActions(actions, routeManifest, makeAccess('empresa', true, false));
    expect(lackingFeature.map(x => x.route)).toEqual(['/asesor/projects', '/explorar']);
  });

  it('only platform context exposes administrator shortcuts', () => {
    expect(visibleCommercialActions(actions, routeManifest, makeAccess('plataforma')).map(x => x.route))
      .toEqual(['/admin/users', '/explorar']);
  });
});
