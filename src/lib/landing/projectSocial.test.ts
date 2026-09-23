import { describe, it, expect } from 'vitest';
import { projectSocial, renderProjectHtml, publicImageUrl } from './projectSocial';
import { projectCanonicalUrl, isPublicSlug } from './paths';
import { shareAttribution } from './shareAttribution';

const project = { id: 'a', slug: 'valle-escondido-licanten', name: 'Valle Escondido', city: 'Licantén', images: ['/projects/paisaje.jpg'] };

describe('project sharing', () => {
  it('uses readable URLs and keeps historical canonical paths', () => {
    expect(projectCanonicalUrl(project)).toBe('https://ofertaterrenos.com/p/valle-escondido-licanten');
    expect(projectCanonicalUrl({ ...project, slug: 'explora-park' })).toBe('https://ofertaterrenos.com/explora-park');
    expect(projectCanonicalUrl({ id: 'a', slug: null })).toBe('https://ofertaterrenos.com/proyecto/a');
    expect(isPublicSlug('../../admin')).toBe(false);
    expect(isPublicSlug('constructor')).toBe(true);
    expect(projectCanonicalUrl({ ...project, slug: 'constructor' })).toBe('https://ofertaterrenos.com/p/constructor');
  });
  it('never advertises sold, reserved or unknown lots as available or cheapest', () => {
    const social = projectSocial(project, [
      { status: 'sold', price: 1 }, { status: 'reserved', price: 2 },
      { status: null, price: 3 }, { status: 'available', price: 19990000 },
      { status: 'available', price: Infinity },
    ]);
    expect(social.description).toContain('2 parcelas disponibles');
    expect(social.description).toContain('19.990.000');
    expect(social.image).toBe('https://ofertaterrenos.com/projects/paisaje.jpg');
    expect(projectSocial(project, []).description).not.toContain('Desde');
    expect(projectSocial(project).description).toContain('Consulta disponibilidad');
  });
  it('rejects non-HTTPS images and escapes database strings in initial HTML', () => {
    expect(publicImageUrl('javascript:alert(1)')).toBeUndefined();
    const template = '<head><title>Generic</title><meta property="og:title" content="Generic" /><meta name="twitter:title" content="Generic" /><link rel="canonical" href="/" /></head><body><script src="/assets/hash.js"></script></body>';
    const html = renderProjectHtml(template, projectSocial({ ...project, name: '\"><script>alert(1)</script>' }, []));
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
    expect(html.match(/property="og:title"/g)).toHaveLength(1);
    expect(html.match(/name="twitter:title"/g)).toHaveLength(1);
    expect(html.match(/rel="canonical"/g)).toHaveLength(1);
    expect(html).toContain('/assets/hash.js');
  });
  it('retains only bounded campaign codes for the existing CRM', () => {
    expect(shareAttribution('?utm_source=whatsapp&utm_medium=share&email=private@example.com')).toBe('[Campaña declarada por enlace] utm_source=whatsapp utm_medium=share');
    expect(shareAttribution('?utm_source=<script>&token=secret')).toBeUndefined();
  });
});
