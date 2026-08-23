import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Registro único de landings de proyecto.
 *
 * Toda landing vive bajo el mismo motor (`/p/:slug`, `ProjectLanding`):
 *  - si el slug está en este registro, se renderiza su experiencia
 *    cinematográfica a medida (secciones propias, paleta, masterplan 3D),
 *  - si no, se genera la landing premium por configuración desde
 *    `projects.landing_config`.
 *
 * Las URLs históricas (`/explora-park`, `/huellelhue`, …) se mantienen
 * congeladas por SEO, pero ya no declaran páginas sueltas: entran por el
 * mismo motor con el slug fijado.
 */
export const bespokeLandings: Record<string, LazyExoticComponent<ComponentType>> = {
  'explora-park': lazy(() => import('@/pages/exploraPark/ExploraParkLanding')),
  huellelhue: lazy(() => import('@/pages/huellelhue/HuellelhueLanding')),
  'playa-alvaro': lazy(() => import('@/pages/playaAlvaro/PlayaAlvaroLanding')),
  'forestal-valle-escondido': lazy(() => import('@/pages/forestal/ForestalLanding')),
};

/** URL canónica pública de cada landing (las históricas mandan por SEO). */
export const landingCanonicalPath: Record<string, string> = {
  'explora-park': '/explora-park',
  huellelhue: '/huellelhue',
  'playa-alvaro': '/playa-alvaro',
  'forestal-valle-escondido': '/forestal-valle-escondido',
};

export const canonicalPathForSlug = (slug: string) =>
  landingCanonicalPath[slug] ?? `/p/${slug}`;
