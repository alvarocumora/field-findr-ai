import { describe, expect, it } from 'vitest';
import {
  adminRouteEntries, agentRouteEntries, buyerRouteEntries,
  routeManifest, routeAliases,
} from './routeManifest';
import { evaluateRoutePolicy } from '@/lib/access/routePolicy';

describe('cross-role navigation contract', () => {
  it('keeps private entry and buyer workspace behind authentication', () => {
    for (const route of buyerRouteEntries) {
      expect(route.access, route.path).toBe('auth');
      expect(route.area, route.path).toBe('buyer');
    }
    const panel = routeManifest.find((route) => route.path === '/panel');
    expect(panel?.access).toBe('auth');
    expect(panel?.layout).toBe('none');
    expect(routeManifest.find((route) => route.path === '/comprador/inicio')?.layout).toBe('buyer');
  });

  it('requires agent privileges on broker and company tools', () => {
    for (const route of agentRouteEntries) {
      expect(route.access, route.path).toBe('agent');
      expect(route.area, route.path).toBe('agent');
    }
    for (const path of ['/asesor/mi-negocio', '/asesor/dashboard', '/asesor/projects', '/asesor/leads', '/publicar']) {
      expect(routeManifest.find((route) => route.path === path)?.access, path).toBe('agent');
    }
  });

  it('requires admin privileges on platform-wide operations', () => {
    for (const route of adminRouteEntries) {
      expect(route.access, route.path).toBe('admin');
      expect(route.area, route.path).toBe('admin');
    }
    expect(routeManifest.find((route) => route.path === '/admin/dashboard')?.access).toBe('admin');
    expect(routeManifest.find((route) => route.path === '/admin/users')?.access).toBe('admin');
  });

  it('keeps public discovery and consultation accessible without a session', () => {
    for (const path of ['/', '/explorar', '/comparar', '/proyecto/:id', '/p/:slug', '/agendar', '/contacto']) {
      expect(routeManifest.find((route) => route.path === path)?.access, path).toBe('public');
    }
  });

  it('preserves capability and plan checks for CRM and private workspace features', () => {
    const crm = routeManifest.find((route) => route.path === '/asesor/leads');
    expect(crm?.policy?.capability).toBe('crm.read');
    expect(crm?.policy?.feature).toBe('crm');
    expect(evaluateRoutePolicy(crm!.policy, { can: () => false, hasFeature: () => true }))
      .toEqual({ allowed: false, reason: 'capability', capability: 'crm.read' });
    expect(evaluateRoutePolicy(crm!.policy, { can: () => true, hasFeature: () => false }))
      .toEqual({ allowed: false, reason: 'feature', feature: 'crm' });
  });

  it('does not weaken alias targets for admin or adviser links', () => {
    for (const alias of routeAliases.filter((a) => a.from.startsWith('/panel/') || a.from.startsWith('/admin'))) {
      const target = routeManifest.find((route) => route.path === alias.to);
      expect(target, alias.from).toBeDefined();
      expect(target!.access, `${alias.from} → ${alias.to}`).not.toBe('public');
    }
  });
});
