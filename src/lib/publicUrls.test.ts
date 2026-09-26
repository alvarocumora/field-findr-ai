import { describe, it, expect } from 'vitest';
import { getCanonicalUrl, getShareUrl, resolvePublicOrigin } from './publicUrls';

describe('publicUrls', () => {
  it('referral path', () => {
    expect(getCanonicalUrl('/auth?ref=ABC')).toBe('https://ofertaterrenos.com/auth?ref=ABC');
    expect(getShareUrl('/auth', { ref: 'ABC' })).toBe('https://ofertaterrenos.com/auth?ref=ABC');
  });
  it('project slug and missing slash', () => {
    expect(getCanonicalUrl('/p/valle-hualane')).toBe('https://ofertaterrenos.com/p/valle-hualane');
    expect(getCanonicalUrl('p/valle-hualane')).toBe('https://ofertaterrenos.com/p/valle-hualane');
    expect(getCanonicalUrl('//p/x')).toBe('https://ofertaterrenos.com/p/x');
  });
  it('keeps query and hash', () => {
    expect(getCanonicalUrl('/proyecto/1?lote=5#ficha')).toBe('https://ofertaterrenos.com/proyecto/1?lote=5#ficha');
    expect(getShareUrl('/proyecto/1#ficha', { lote: 5 })).toBe('https://ofertaterrenos.com/proyecto/1?lote=5#ficha');
  });
  it('rewrites preview absolute URL to canonical host', () => {
    expect(getCanonicalUrl('https://id-preview--abc.lovable.app/comunidad?ref=OT-1#top'))
      .toBe('https://ofertaterrenos.com/comunidad?ref=OT-1#top');
  });
  it('env override', () => {
    const o = resolvePublicOrigin('https://staging.ofertaterrenos.com/');
    expect(o).toBe('https://staging.ofertaterrenos.com');
    expect(getCanonicalUrl('/auth?ref=ABC', o)).toBe('https://staging.ofertaterrenos.com/auth?ref=ABC');
    expect(resolvePublicOrigin('not a url')).toBe('https://ofertaterrenos.com');
    expect(resolvePublicOrigin(undefined)).toBe('https://ofertaterrenos.com');
  });
});
