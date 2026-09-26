/**
 * Public share URLs: every link a user copies/shares must point to the
 * canonical domain, even when generated from Preview. Runtime auth URLs
 * (OAuth redirect_uri, reset-password redirectTo) must NOT use this — they
 * keep using window.location.origin.
 */
import { SITE_URL } from '@/lib/landing/paths';

export const normalizeOrigin = (value: string | undefined | null): string | null => {
  if (!value) return null;
  try {
    const u = new URL(value.trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return u.origin;
  } catch {
    return null;
  }
};

export const resolvePublicOrigin = (envValue?: string | null): string =>
  normalizeOrigin(envValue) ?? SITE_URL;

export const PUBLIC_SITE_ORIGIN = resolvePublicOrigin(
  import.meta.env?.VITE_PUBLIC_SITE_URL as string | undefined,
);

/** Converts a path or any absolute URL (e.g. preview) to the canonical host, keeping path/query/hash. */
export const getCanonicalUrl = (pathnameOrUrl = '/', origin: string = PUBLIC_SITE_ORIGIN): string => {
  const raw = (pathnameOrUrl || '/').trim();
  let path: string;
  if (/^https?:\/\//i.test(raw)) {
    const u = new URL(raw);
    path = `${u.pathname}${u.search}${u.hash}`;
  } else {
    path = raw.startsWith('/') ? raw : `/${raw}`;
  }
  path = path.replace(/^\/{2,}/, '/');
  return `${origin}${path}`;
};

/** Builds a canonical share URL with optional query params (empty values dropped). */
export const getShareUrl = (
  pathname: string,
  query?: Record<string, string | number | null | undefined>,
  origin: string = PUBLIC_SITE_ORIGIN,
): string => {
  const url = new URL(getCanonicalUrl(pathname, origin));
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
};
