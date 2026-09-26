import { describe, expect, it } from 'vitest';
import { evaluateRoutePolicy } from './routePolicy';

describe('route policy', () => {
  it('allows a route without a policy', () => {
    expect(evaluateRoutePolicy(undefined, { can: () => false, hasFeature: () => false }))
      .toEqual({ allowed: true });
  });

  it('checks capabilities before product entitlements', () => {
    expect(evaluateRoutePolicy(
      { capability: 'team.read', feature: 'team' },
      { can: () => false, hasFeature: () => false },
    )).toEqual({ allowed: false, reason: 'capability', capability: 'team.read' });
  });

  it('returns an upgrade decision when permission exists but the plan lacks the feature', () => {
    expect(evaluateRoutePolicy(
      { capability: 'inventory.read', feature: 'spatial3d' },
      { can: () => true, hasFeature: () => false },
    )).toEqual({ allowed: false, reason: 'feature', feature: 'spatial3d' });
  });

  it('allows when both checks pass', () => {
    expect(evaluateRoutePolicy(
      { capability: 'crm.read', feature: 'crm' },
      { can: () => true, hasFeature: () => true },
    )).toEqual({ allowed: true });
  });
});
