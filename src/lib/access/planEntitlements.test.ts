import { describe, expect, it } from 'vitest';
import { hasPlanFeature, minimumPlanForFeature, planFeaturesFor } from './planEntitlements';

describe('plan entitlements', () => {
  it('keeps roles separate from product features', () => {
    expect(hasPlanFeature('free', 'crm')).toBe(false);
    expect(hasPlanFeature('corredor', 'crm')).toBe(true);
  });

  it('normalizes legacy plans before resolving features', () => {
    expect(planFeaturesFor('growth')).toContain('spatial3d');
    expect(planFeaturesFor('starter')).toContain('reservations');
  });

  it('maps paid modules to the minimum upgrade plan', () => {
    expect(minimumPlanForFeature('reservations')).toBe('corredora');
    expect(minimumPlanForFeature('spatial3d')).toBe('inmobiliaria');
    expect(minimumPlanForFeature('api')).toBe('grupo');
    expect(minimumPlanForFeature('sso')).toBe('enterprise');
  });

  it('reserves enterprise capabilities for enterprise', () => {
    expect(hasPlanFeature('grupo', 'sso')).toBe(false);
    expect(hasPlanFeature('enterprise', 'sso')).toBe(true);
    expect(hasPlanFeature('enterprise', 'multi_org')).toBe(true);
  });
});
