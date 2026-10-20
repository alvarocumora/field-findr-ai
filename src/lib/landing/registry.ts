import { type ComponentType, type LazyExoticComponent } from 'react';

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
/** Landings a medida retiradas: todo proyecto usa la experiencia única. */
export const bespokeLandings: Record<string, LazyExoticComponent<ComponentType>> = {};

/** URL canónica pública de cada landing (las históricas mandan por SEO). */
export { landingCanonicalPath, canonicalPathForSlug } from './paths';
