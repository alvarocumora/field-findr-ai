export type ReferralAttributionKind = 'user' | 'broker' | 'unknown';

export interface ReferralAttribution {
  code: string;
  kind: ReferralAttributionKind;
  firstSeenAt: string;
  lastSeenAt: string;
  landingPath: string;
}

const STORAGE_KEY = 'ot:referral-attribution:v2';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const cleanCode = (value?: string | null) =>
  (value ?? '').trim().slice(0, 80);

export const inferReferralKind = (code: string): ReferralAttributionKind =>
  /^OT-[A-Z0-9]{4,}$/i.test(code) ? 'user' : 'unknown';

export const readReferralAttribution = (): ReferralAttribution | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReferralAttribution;
    const age = Date.now() - new Date(parsed.lastSeenAt).getTime();
    if (!parsed.code || !Number.isFinite(age) || age > MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const captureReferralAttribution = (
  search: string,
  pathname = '/',
): ReferralAttribution | null => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(search);
  const code = cleanCode(params.get('ref'));
  if (!code) return readReferralAttribution();

  const now = new Date().toISOString();
  const existing = readReferralAttribution();

  // First-touch is retained for attribution stability. A repeated visit with
  // the same code refreshes the expiry window; another ref does not overwrite it.
  const next: ReferralAttribution = existing?.code === code
    ? { ...existing, lastSeenAt: now }
    : existing ?? {
        code,
        kind: inferReferralKind(code),
        firstSeenAt: now,
        lastSeenAt: now,
        landingPath: pathname,
      };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const referralCodeForConversion = () => readReferralAttribution()?.code ?? null;

export const clearReferralAttribution = () => {
  if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
};
