import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  captureReferralAttribution,
  clearReferralAttribution,
  inferReferralKind,
  readReferralAttribution,
} from './referralAttribution';

describe('referral attribution', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    });
  });

  afterEach(() => {
    clearReferralAttribution();
    vi.unstubAllGlobals();
  });

  it('classifies user referral codes independently from broker codes', () => {
    expect(inferReferralKind('OT-ABC123')).toBe('user');
    expect(inferReferralKind('BROKER-ALVARO')).toBe('unknown');
  });

  it('captures the first referral code and landing path', () => {
    const result = captureReferralAttribution('?ref=BROKER123', '/p/valle-hualane');
    expect(result?.code).toBe('BROKER123');
    expect(result?.landingPath).toBe('/p/valle-hualane');
  });

  it('keeps first-touch attribution when another ref appears later', () => {
    captureReferralAttribution('?ref=BROKER123', '/p/a');
    captureReferralAttribution('?ref=BROKER999', '/p/b');
    expect(readReferralAttribution()?.code).toBe('BROKER123');
  });

  it('refreshes the same referral without replacing firstSeenAt', () => {
    const first = captureReferralAttribution('?ref=OT-ABC123', '/auth');
    const second = captureReferralAttribution('?ref=OT-ABC123', '/auth');
    expect(second?.code).toBe(first?.code);
    expect(second?.firstSeenAt).toBe(first?.firstSeenAt);
  });
});
