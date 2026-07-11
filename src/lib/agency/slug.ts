/**
 * Slug helpers for the public agency showcase (/inmobiliaria/:slug).
 * A slug is lowercase [a-z0-9-], 2–40 chars, no leading/trailing/edge hyphen.
 */

export function slugifyAgency(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])$/.test(slug);
}
