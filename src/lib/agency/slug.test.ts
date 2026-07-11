import { describe, it, expect } from 'vitest';
import { slugifyAgency, isValidSlug } from './slug';

describe('slugifyAgency', () => {
  it('lowercases, strips accents and hyphenates', () => {
    expect(slugifyAgency('Inmobiliaria Ñuñoa Sur')).toBe('inmobiliaria-nunoa-sur');
  });
  it('trims edge separators and collapses symbols', () => {
    expect(slugifyAgency('  ¡Loteos & Campos!  ')).toBe('loteos-campos');
  });
  it('caps length at 40 with no trailing hyphen', () => {
    const s = slugifyAgency('a'.repeat(50));
    expect(s.length).toBeLessThanOrEqual(40);
    expect(s.endsWith('-')).toBe(false);
  });
});

describe('isValidSlug', () => {
  it('accepts valid slugs', () => {
    expect(isValidSlug('sur')).toBe(true);
    expect(isValidSlug('inmobiliaria-sur-2')).toBe(true);
  });
  it('rejects invalid slugs', () => {
    expect(isValidSlug('a')).toBe(false); // too short
    expect(isValidSlug('-sur')).toBe(false); // leading hyphen
    expect(isValidSlug('sur-')).toBe(false); // trailing hyphen
    expect(isValidSlug('Sur')).toBe(false); // uppercase
    expect(isValidSlug('con espacio')).toBe(false);
  });
});
