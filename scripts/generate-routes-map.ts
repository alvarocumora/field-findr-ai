/**
 * Genera `docs/ROUTES_MAP.md` desde el manifiesto único de rutas.
 * Uso: `bun run scripts/generate-routes-map.ts`
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  routeManifest,
  routeAliases,
  navGroupOrder,
  type RouteArea,
} from '../src/routes/routeManifest';

const AREAS: { area: RouteArea; title: string }[] = [
  { area: 'public', title: 'Público' },
  { area: 'buyer', title: 'Comprador' },
  { area: 'agent', title: 'Asesor / Inmobiliaria' },
  { area: 'admin', title: 'Administración' },
];

const rows = (area: RouteArea) =>
  routeManifest
    .filter((r) => r.area === area)
    .sort((a, b) => {
      const order = navGroupOrder[area] ?? [];
      const ga = a.nav ? (order.indexOf(a.nav.group) + 1 || 99) : 100;
      const gb = b.nav ? (order.indexOf(b.nav.group) + 1 || 99) : 100;
      return ga - gb || a.path.localeCompare(b.path);
    })
    .map(
      (r) =>
        `| \`${r.path}\` | ${r.nav?.label ?? '—'} | ${r.nav?.group ?? '—'} | ${r.access} | ${r.layout} | ${r.nav?.plans?.join(', ') ?? 'todos'} |`,
    )
    .join('\n');

const doc = `# Mapa de rutas

> Archivo generado automáticamente por \`scripts/generate-routes-map.ts\`.
> Fuente de verdad: \`src/routes/routeManifest.tsx\`. No editar a mano.

Total de rutas: **${routeManifest.length}** · alias/redirects: **${routeAliases.length}**

${AREAS.map(
  ({ area, title }) => `## ${title}

| Ruta | Label | Grupo | Acceso | Layout | Planes |
| --- | --- | --- | --- | --- | --- |
${rows(area)}
`,
).join('\n')}
## Alias y redirects

| Desde | Hacia |
| --- | --- |
${routeAliases.map((a) => `| \`${a.from}\` | \`${a.to}\` |`).join('\n')}
`;

writeFileSync(join(import.meta.dir, '..', 'docs', 'ROUTES_MAP.md'), doc);
console.log(`ROUTES_MAP.md generado (${routeManifest.length} rutas).`);
