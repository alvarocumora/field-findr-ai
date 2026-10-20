/** Preserve query and fragment through legacy route aliases (search/filter/share links). */
export const resolveAliasDestination = (target: string, search: string, hash: string): string => {
  const url = new URL(target, 'https://ofertaterrenos.com');
  const inherited = new URLSearchParams(search);
  const own = new URLSearchParams(url.search);
  own.forEach((value, key) => inherited.set(key, value));
  const query = inherited.toString();
  return `${url.pathname}${query ? `?${query}` : ''}${url.hash || hash}`;
};
