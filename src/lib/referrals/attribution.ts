export const REFERRAL_ATTRIBUTION_STORAGE_KEY = 'ot:referral-attribution:v1';
export const REFERRAL_ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type ReferralAttributionKind = 'user' | 'broker' | 'unknown';

export interface ReferralAttribution {
  code: string;
  kind: ReferralAttributionKind;
  firstSeenAt: number;
  lastSeenAt: number;
  landingPath: string;
}

const CODE_RE = /^[A-Z0-9_-]{3,80}$/i;

export const normalizeReferralCode = (value?: string | null): string | null => {
  const code = value?.trim();
  if (!code || !CODE_RE.test(code)) return null;
  return code.toUpperCase();
};

export const referralKindForCode = (code: string): ReferralAttributionKind => {
  if (code.startsWith('OT-')) return 'user';
  if (code.startsWith('BK-')) return 'broker';
  return 'unknown';
};

export const readReferralAttribution = (
  storage: Pick<Storage, 'getItem' | 'removeItem'> = window.localStorage,
  now = Date.now(),
): ReferralAttribution | null => {
  try {
    const raw = storage.getItem(REFERRAL_ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ReferralAttribution>;
    const code = normalizeReferralCode(parsed.code);
    if (!code || typeof parsed.firstSeenAt !== 'number' || typeof parsed.lastSeenAt !== 'number') {
      storage.removeItem(REFERRAL_ATTRIBUTION_STORAGE_KEY);
      return null;
    }
    if (now - parsed.lastSeenAt > REFERRAL_ATTRIBUTION_TTL_MS) {
      storage.removeItem(REFERRAL_ATTRIBUTION_STORAGE_KEY);
      return null;
    }
    return {
      code,
      kind: referralKindForCode(code),
      firstSeenAt: parsed.firstSeenAt,
      lastSeenAt: parsed.lastSeenAt,
      landingPath: typeof parsed.landingPath === 'string' ? parsed.landingPath : '/',
    };
  } catch {
    storage.removeItem(REFERRAL_ATTRIBUTION_STORAGE_KEY);
    return null;
  }
};

export const captureReferralAttribution = (
  search: string,
  pathname: string,
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = window.localStorage,
  now = Date.now(),
): ReferralAttribution | null => {
  const code = normalizeReferralCode(new URLSearchParams(search).get('ref'));
  if (!code) return readReferralAttribution(storage, now);

  const current = readReferralAttribution(storage, now);
  const next: ReferralAttribution = {
    code,
    kind: referralKindForCode(code),
    firstSeenAt: current?.code === code ? current.firstSeenAt : now,
    lastSeenAt: now,
    landingPath: current?.code === code ? current.landingPath : pathname || '/',
  };

  storage.setItem(REFERRAL_ATTRIBUTION_STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const clearReferralAttribution = (
  storage: Pick<Storage, 'removeItem'> = window.localStorage,
) => storage.removeItem(REFERRAL_ATTRIBUTION_STORAGE_KEY);

export const getReferralCode = (
  storage: Pick<Storage, 'getItem' | 'removeItem'> = window.localStorage,
  now = Date.now(),
) => readReferralAttribution(storage, now)?.code ?? null;
