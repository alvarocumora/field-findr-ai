/** Campaign hints only; never persist arbitrary query strings or personal data. */
export function shareAttribution(search: string): string | undefined {
  const params = new URLSearchParams(search);
  const pairs = ['utm_source', 'utm_medium', 'utm_campaign'].flatMap(key => {
    const value = params.get(key);
    return value && /^[a-zA-Z0-9_-]{1,80}$/.test(value) ? [`${key}=${value}`] : [];
  });
  return pairs.length ? `[Campaña declarada por enlace] ${pairs.join(' ')}` : undefined;
}
