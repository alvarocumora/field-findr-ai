import { describe, expect, it } from 'vitest';
import {
  REFERRAL_ATTRIBUTION_STORAGE_KEY,
  REFERRAL_ATTRIBUTION_TTL_MS,
  captureReferralAttribution,
  getReferralCode,
  normalizeReferralCode,
  readReferralAttribution,
  referralKindForCode,
} from './attribution';

const memoryStorage = () => {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => map.set(key, value),
    removeItem: (key: string) => map.delete(key),
  };
};

describe('referral attribution', () => {
  it('normalizes valid codes and rejects arbitrary input', () => {
    expect(normalizeReferralCode(' bk-ab12 ')).toBe('BK-AB12');
    expect(normalizeReferralCode('<script>')).toBeNull();
  });

  it('distinguishes user rewards from broker attribution', () => {
    expect(referralKindForCode('OT-ABC123')).toBe('user');
    expect(referralKindForCode('BK-ABC123')).toBe('broker');
    expect(referralKindForCode('CAMPAIGN1')).toBe('unknown');
  });

  it('captures first landing and applies last-touch when a new ref is explicit', () => {
    const storage = memoryStorage();
    captureReferralAttribution('?ref=BK-ONE', '/p/proyecto-a', storage as Storage, 1000);
    captureReferralAttribution('', '/p/proyecto-b', storage as Storage, 2000);
    expect(readReferralAttribution(storage as Storage, 2000)).toMatchObject({
      code: 'BK-ONE',
      landingPath: '/p/proyecto-a',
      firstSeenAt: 1000,
      lastSeenAt: 1000,
    });

    captureReferralAttribution('?ref=BK-TWO', '/p/proyecto-b', storage as Storage, 3000);
    expect(readReferralAttribution(storage as Storage, 3000)).toMatchObject({
      code: 'BK-TWO',
      landingPath: '/p/proyecto-b',
      firstSeenAt: 3000,
      lastSeenAt: 3000,
    });
  });

  it('expires attribution after 30 days', () => {
    const storage = memoryStorage();
    captureReferralAttribution('?ref=BK-OLD', '/p/x', storage as Storage, 1000);
    expect(getReferralCode(storage as Storage, 1000 + REFERRAL_ATTRIBUTION_TTL_MS + 1)).toBeNull();
    expect(storage.getItem(REFERRAL_ATTRIBUTION_STORAGE_KEY)).toBeNull();
  });
});
