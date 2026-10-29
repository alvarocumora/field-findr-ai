import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { routeExists, routeManifest, routeAliases, navFor } from './routeManifest';

/**
 * Red anti-links-muertos: extrae todos los href/to/route estáticos de los
 * componentes de navegación y verifica que cada uno resuelva contra el
 * manifiesto único de rutas (incluidos alias/redirects legacy).
 */

const SRC = join(__dirname, '..');

/** Componentes de navegación cuyo destino debe existir siempre. */
const NAV_FILES = [
  'components/navigation/StickyHeader.tsx',
  'components/navigation/MobileBottomNav.tsx',
  'components/LandingQuickActions.tsx',
  'components/dashboard/QuickActions.tsx',
  'components/ModernSidebar.tsx',
  'components/FooterSection.tsx',
  'components/layouts/BuyerLayout.tsx',
  'pages/Publicar.tsx',
].map((f) => join(SRC, f));

function extractLinks(file: string): string[] {
  const src = readFileSync(file, 'utf-8');
  const links: string[] = [];
  const patterns = [
    /\bhref:\s*'(\/[^']*)'/g,
    /\bhref="(\/[^"]*)"/g,
    /\broute:\s*'(\/[^']*)'/g,
    /\bto="(\/[^"]*)"/g,
    /\bto=\{'(\/[^']*)'\}/g,
  ];
  for (const re of patterns) {
    for (const m of src.matchAll(re)) links.push(m[1]);
  }
  return links;
}

describe('manifiesto de rutas', () => {
  it('declara rutas (sanity)', () => {
    expect(routeManifest.length).toBeGreaterThan(30);
  });

  it('no tiene ids ni paths duplicados', () => {
    const ids = routeManifest.map((r) => r.id);
    const paths = routeManifest.map((r) => r.path);
    expect(new Set(ids).size, 'ids duplicados').toBe(ids.length);
    expect(new Set(paths).size, 'paths duplicados').toBe(paths.length);
  });

  it('todos los alias apuntan a una ruta real y no colisionan', () => {
    const paths = new Set(routeManifest.map((r) => r.path));
    const bad = routeAliases.filter((a) => !paths.has(a.to) || paths.has(a.from));
    expect(bad.map((b) => b.from)).toEqual([]);
  });
});

describe('links estáticos de navegación', () => {
  for (const file of NAV_FILES) {
    it(`todos los links de ${file.split('/').slice(-1)[0]} resuelven a una ruta`, () => {
      const broken = extractLinks(file)
        .map((l) => l.split(/[?#]/)[0])
        .filter((path) => path !== '/')
        .filter((path) => !routeExists(path));
      expect(broken, `links rotos: ${[...new Set(broken)].join(', ')}`).toEqual([]);
    });
  }
});

/** Barrido global: ningún archivo de `src` puede apuntar a una ruta inexistente. */
describe('links estáticos en todo src', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = join(dir, e.name);
      if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(full);
      return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [full] : [];
    });

  it('no hay destinos internos rotos', () => {
    const broken = new Map<string, Set<string>>();
    for (const file of walk(SRC)) {
      const src = readFileSync(file, 'utf-8');
      const patterns = [
        /\bto="(\/[^"]*)"/g,
        /\bto=\{'(\/[^']*)'\}/g,
        /navigate\('(\/[^']*)'/g,
        /\bhref="(\/[^"]*)"/g,
        /\bhref:\s*'(\/[^']*)'/g,
        /\broute:\s*'(\/[^']*)'/g,
      ];
      for (const re of patterns) {
        for (const m of src.matchAll(re)) {
          const path = m[1].split(/[?#]/)[0];
          if (path === '/' || path.startsWith('//')) continue;
          if (routeExists(path)) continue;
          const entry = broken.get(path) ?? new Set<string>();
          entry.add(file.replace(SRC, 'src'));
          broken.set(path, entry);
        }
      }
    }
    const report = [...broken].map(([p, files]) => `${p} (${[...files].join(', ')})`);
    expect(report, `links rotos:\n${report.join('\n')}`).toEqual([]);
  });
});



describe('workspace menu structure', () => {
  it('offers one primary home per commercial context', () => {
    expect(navFor('agent', 'corredor', 'empresa').filter(item => item.primary).map(item => item.path)).toEqual(['/asesor/dashboard']);
    expect(navFor('agent', 'free', 'broker').filter(item => item.primary).map(item => item.path)).toEqual(['/asesor/mi-negocio']);
  });
  it('keeps personal profile destinations inside their workspace', () => {
    expect(navFor('admin').find(item => item.label === 'Mi perfil')?.path).toBe('/admin/profile');
    expect(navFor('agent', 'corredor', 'empresa').find(item => item.label === 'Mi perfil')?.path).toBe('/asesor/profile');
  });
});
