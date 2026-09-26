import { describe, expect, it } from 'vitest';
import { hasPlanFeature, planFeaturesFor } from './planEntitlements';

describe('plan entitlements', () => {
  it('keeps roles separate from product features', () => {
    expect(hasPlanFeature('free', 'crm')).toBe(false);
    expect(hasPlanFeature('corredor', 'crm')).toBe(true);
  });

  it('normalizes legacy plans before resolving features', () => {
    expect(planFeaturesFor('growth')).toContain('spatial3d');
    expect(planFeaturesFor('starter')).toContain('reservations');
  });

  it('reserves enterprise capabilities for enterprise', () => {
    expect(hasPlanFeature('grupo', 'sso')).toBe(false);
    expect(hasPlanFeature('enterprise', 'sso')).toBe(true);
    expect(hasPlanFeature('enterprise', 'multi_org')).toBe(true);
  });
});
