import { describe, expect, it } from 'vitest';
import { buildAuthRedirect, resolveSafeAuthDestination } from './authReturn';

describe('return after authentication', () => {
  it('preserves nested project, lot, filters and fragment after a protected route', () => {
    const redirect = buildAuthRedirect('/asesor/project/p123', '?tab=lotes&lote=75', '#mapa');
    expect(new URL(redirect, 'https://example.cl').searchParams.get('redirect'))
      .toBe('/asesor/project/p123?tab=lotes&lote=75#mapa');
  });

  it('preserves internal destinations for buyer, broker, company, admin and panel', () => {
    for (const path of ['/panel', '/comprador/inicio', '/asesor/mi-negocio', '/asesor/projects', '/admin/dashboard']) {
      expect(resolveSafeAuthDestination(path)).toBe(path);
    }
  });

  it('rejects absolute, protocol-relative, backslash and control-char external redirects', () => {
    for (const path of [
      'https://example.com', 'javascript:alert(1)', '//example.com/steal',
      '/\\example.com', '/foo\\bar', '/foo\nbar', '/auth?redirect=/admin/dashboard',
      '',
    ]) {
      expect(resolveSafeAuthDestination(path)).toBeNull();
    }
  });

  it('falls back to a safe context entry point', () => {
    expect(buildAuthRedirect('//evil.test', '?q=1')).toBe('/auth?redirect=%2Fpanel');
    expect(resolveSafeAuthDestination('/perfil?tab=seguridad#cuenta'))
      .toBe('/perfil?tab=seguridad#cuenta');
  });
});
