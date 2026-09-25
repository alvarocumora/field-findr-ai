/** Pure URL helpers shared by React and the static social-preview build. */
export const SITE_URL = 'https://ofertaterrenos.com';

export const landingCanonicalPath: Record<string, string> = {
  'explora-park': '/explora-park',
  huellelhue: '/huellelhue',
  'playa-alvaro': '/playa-alvaro',
  'forestal-valle-escondido': '/forestal-valle-escondido',
  'parcelas-caone-hualane': '/valle-hualane',
};

export const isPublicSlug = (slug: unknown): slug is string =>
  typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

export const canonicalPathForSlug = (slug: string) =>
  Object.prototype.hasOwnProperty.call(landingCanonicalPath, slug)
    ? landingCanonicalPath[slug]
    : `/p/${encodeURIComponent(slug)}`;

export const projectCanonicalUrl = (project: { id: string; slug?: string | null }) =>
  SITE_URL + (isPublicSlug(project.slug)
    ? canonicalPathForSlug(project.slug)
    : `/proyecto/${encodeURIComponent(project.id)}`);
