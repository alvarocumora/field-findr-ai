import { parseLandingConfig, summarizeLots } from './config';
import { projectCanonicalUrl, SITE_URL } from './paths';

export interface SocialProject {
  id: string;
  slug?: string | null;
  name: string;
  city?: string | null;
  location?: string | null;
  region?: string | null;
  images?: string[] | null;
  landing_config?: unknown;
}
export interface SocialLot {
  status?: string | null;
  price?: number | null;
  area?: number | null;
}

export function publicImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const url = new URL(value, SITE_URL);
    return url.protocol === 'https:' ? url.href : undefined;
  } catch { return undefined; }
}

/** Missing inventory is not the same as zero available lots. */
export function projectSocial(project: SocialProject, lots?: SocialLot[]) {
  const config = parseLandingConfig(project.landing_config);
  const stats = lots ? summarizeLots(lots) : undefined;
  const location = [project.city || project.location, project.region].filter(Boolean).join(', ');
  const description = [
    location,
    stats ? (stats.available === 1 ? '1 parcela disponible' : `${stats.available} parcelas disponibles`) : 'Consulta disponibilidad',
    stats?.priceFrom ? `Desde $${stats.priceFrom.toLocaleString('es-CL')} CLP` : null,
    'Ver plano y agendar visita.',
  ].filter(Boolean).join(' · ');
  return {
    title: project.name,
    description,
    url: projectCanonicalUrl(project),
    // WhatsApp drops share images over ~300 KB, so curated 1200x630 cards win
    // over unsized originals from the project gallery.
    image: (project.slug && SHARE_IMAGE_BY_SLUG[project.slug])
      || publicImageUrl(config.hero.image)
      || project.images?.map(publicImageUrl).find(Boolean)
      || DEFAULT_SHARE_IMAGE,
  };
}

export const DEFAULT_SHARE_IMAGE = `${SITE_URL}/og-oferta-terrenos.jpg`;
export const SHARE_IMAGE_BY_SLUG: Record<string, string> = {
  'valle-escondido-licanten': `${SITE_URL}/social/valle-escondido-licanten-og.jpg`,
  'valle-hualane': `${SITE_URL}/social/valle-hualane-og.jpg`,
  'parcelas-caone-hualane': `${SITE_URL}/social/valle-hualane-og.jpg`,
  'explora-park': `${SITE_URL}/social/explora-park-og.jpg`,
  'reserva-huellelhue': `${SITE_URL}/social/reserva-huellelhue-og.jpg`,
};

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

/** Replace generic social metadata without touching Vite's hashed assets. */
export function renderProjectHtml(template: string, social: ReturnType<typeof projectSocial>) {
  const clean = template
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|og:[^"']*|twitter:[^"']*)["'][^>]*>/gi, '')
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, '');
  const tags = [
    `<title>${escapeHtml(social.title)} | OfertaTerrenos</title>`,
    `<link rel="canonical" href="${escapeHtml(social.url)}" />`,
    `<meta name="description" content="${escapeHtml(social.description)}" />`,
    ...Object.entries({
      'og:title': social.title, 'og:description': social.description,
      'og:image': social.image, 'og:image:alt': social.title,
      'og:url': social.url, 'og:type': 'website', 'og:locale': 'es_CL',
      'og:site_name': 'OfertaTerrenos',
    }).map(([key, value]) => `<meta property="${key}" content="${escapeHtml(value)}" />`),
    ...Object.entries({
      'twitter:card': 'summary_large_image', 'twitter:title': social.title,
      'twitter:description': social.description, 'twitter:image': social.image,
    }).map(([key, value]) => `<meta name="${key}" content="${escapeHtml(value)}" />`),
  ];
  return clean.replace('</head>', () => `${tags.join('\n')}\n</head>`);
}
