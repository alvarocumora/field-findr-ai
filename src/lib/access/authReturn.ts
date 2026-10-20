/**
 * Preserve the exact internal destination across authentication without
 * allowing an untrusted redirect query to navigate to an external origin.
 */
export const resolveSafeAuthDestination = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  // Only root-relative routes are valid. Reject protocol-relative paths,
  // backslashes (including encoded backslashes once decoded by URLSearchParams),
  // control characters and a return loop to /auth.
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return null;
  const path = raw.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  if (path === '/auth') return null;
  return raw;
};

export const buildAuthRedirect = (
  pathname: string,
  search = '',
  hash = '',
): string => {
  const next = resolveSafeAuthDestination(`${pathname}${search}${hash}`) ?? '/panel';
  return `/auth?redirect=${encodeURIComponent(next)}`;
};
