import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Red anti-links-muertos: extrae todos los href/to/route estáticos de los
 * componentes de navegación y verifica que cada uno resuelva contra una ruta
 * declarada en el router (incluidos redirects legacy). Un botón que apunte a
 * una ruta inexistente (como pasó con /content-creator e /intelligent-links)
 * vuelve a romper este test, no producción.
 */

const SRC = join(__dirname, '..');

const ROUTE_FILES = readdirSync(__dirname)
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => join(__dirname, f));

/** Componentes de navegación cuyo destino debe existir siempre. */
const NAV_FILES = [
  'components/navigation/StickyHeader.tsx',
  'components/LandingQuickActions.tsx',
  'components/dashboard/QuickActions.tsx',
  'components/ModernSidebar.tsx',
  'components/FooterSection.tsx',
  'pages/Publicar.tsx',
].map((f) => join(SRC, f));

function routePaths(): { statics: Set<string>; dynamics: RegExp[] } {
  const statics = new Set<string>();
  const dynamics: RegExp[] = [];
  for (const file of ROUTE_FILES) {
    const src = readFileSync(file, 'utf-8');
    for (const m of src.matchAll(/path="([^"]+)"/g)) {
      const p = m[1];
      if (p.includes(':')) {
        dynamics.push(new RegExp('^' + p.replace(/:[^/]+/g, '[^/]+') + '$'));
      } else {
        statics.add(p);
      }
    }
  }
  return { statics, dynamics };
}

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

describe('links estáticos de navegación', () => {
  const { statics, dynamics } = routePaths();

  it('el router declara rutas (sanity)', () => {
    expect(statics.size).toBeGreaterThan(30);
  });

  for (const file of NAV_FILES) {
    it(`todos los links de ${file.split('/').slice(-1)[0]} resuelven a una ruta`, () => {
      const broken = extractLinks(file)
        // query/hash no afectan el match de ruta
        .map((l) => l.split(/[?#]/)[0])
        .filter((path) => path !== '/')
        .filter((path) => !statics.has(path) && !dynamics.some((re) => re.test(path)));
      expect(broken, `links rotos: ${[...new Set(broken)].join(', ')}`).toEqual([]);
    });
  }
});
