import { describe, expect, it } from 'vitest';
import { resolveAliasDestination } from './aliasDestination';
import { canonicalPathForSlug, projectLandingPath } from '@/lib/landing/paths';

describe('global navigation integrity', () => {
  it('keeps query and hash on a legacy route redirect', () => {
    expect(resolveAliasDestination('/comparar', '?listing=abc&campaign=octubre', '#detalles'))
      .toBe('/comparar?listing=abc&campaign=octubre#detalles');
  });

  it('allows canonical alias params to override stale incoming params', () => {
    expect(resolveAliasDestination('/explorar?type=parcela_rural', '?type=industrial&q=Licant%C3%A9n', '#mapa'))
      .toBe('/explorar?type=parcela_rural&q=Licant%C3%A9n#mapa');
  });

  it('routes bespoke projects through their commercial landing', () => {
    expect(projectLandingPath({ id: '1', slug: 'parcelas-caone-hualane' })).toBe('/valle-hualane');
    expect(projectLandingPath({ id: '2', slug: 'valle-escondido-licanten' })).toBe('/p/valle-escondido-licanten');
    expect(canonicalPathForSlug('explora-park')).toBe('/explora-park');
  });

  it('falls back to detail when slug is unavailable', () => {
    expect(projectLandingPath({ id: 'id-123', slug: null })).toBe('/proyecto/id-123');
    expect(projectLandingPath({ id: 'id-123', slug: 'INVALID SLUG' })).toBe('/proyecto/id-123');
  });
});
