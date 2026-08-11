# Routes Map — OfertaTerrenos / Field Findr AI

## Sistema único de rutas

Toda la plataforma se declara en **un solo archivo**: `src/routes/routeManifest.tsx`.
No se declaran rutas en ningún otro lugar.

```
src/routes/
  routeManifest.tsx   ← fuente de verdad (path, área, acceso, layout, nav, SEO)
  RouteGuard.tsx      ← guard único: sesión + rol + layout
  AppRouter.tsx       ← deriva el router del manifiesto (rutas anidadas)
  elements/           ← elementos compuestos (dashboards por plan)
  routeUtils.tsx      ← PageLoader
  navLinks.test.ts    ← red anti-links-muertos contra el manifiesto
```

### Anatomía de una ruta

| Campo | Valores | Uso |
|---|---|---|
| `id` | único | key estable |
| `path` | absoluto | URL |
| `area` | `public` / `buyer` / `agent` / `admin` | agrupación y navegación |
| `access` | `public` / `auth` / `agent` / `admin` | lo aplica `RouteGuard` |
| `layout` | `none` / `public` / `buyer` / `dashboard` | layout padre con `<Outlet />` |
| `nav` | `{ label, group, plans? }` | navegación derivada por plan |
| `indexable` | boolean | SEO / sitemap |

Las rutas se agrupan por `(access, layout)` y cada grupo comparte **un solo**
guard y layout padre. Ninguna página se envuelve individualmente.

### Alias y redirects

`routeAliases` en el manifiesto concentra tanto los redirects legacy como la
normalización al español. Cada alias renderiza `<Navigate replace />`.

| Alias | Canónico |
|---|---|
| `/profile` | `/perfil` |
| `/subscription` | `/suscripcion` |
| `/buyer/home` | `/comprador/inicio` |
| `/favorites` | `/favoritos` |
| `/compare` | `/comparar` |
| `/dashboard` | `/asesor/dashboard` |
| `/inventory` | `/asesor/listings` |
| `/leads` | `/asesor/leads` |
| `/projects` | `/asesor/projects` |
| `/lots` | `/asesor/lots` |
| `/analytics` | `/asesor/analytics` |
| `/crm` | `/asesor/crm` |
| `/sales` | `/asesor/sales` |
| `/urbanization` | `/asesor/projects` |
| `/agents` | `/admin/agents` |
| `/calculators`, `/price-predictor`, `/risk-analysis`, `/ai-recommendations` | `/tools` |

### Áreas

- **public** (`access: public`, layout propio de cada página): home, explorar,
  fichas de propiedad y proyecto, landings de región/país/ciudad, marketing,
  tasaciones públicas, resultados de pago, y las landings de proyecto con URL
  congelada por SEO (`/explora-park`, `/huellelhue`, `/playa-alvaro`,
  `/forestal-valle-escondido`, `/p/:slug`).
- **buyer** (`access: auth`, `BuyerLayout`): `/comprador/inicio`, `/favoritos`,
  `/mi-terreno`, `/perfil`, `/suscripcion`.
- **agent** (`access: agent`, `DashboardLayout`): todo `/asesor/*`.
  `/publicar` y `/publish` usan `layout: none` (flujo enfocado sin sidebar).
- **admin** (`access: admin`, `DashboardLayout`): todo `/admin/*`.

### Navegación

`navFor(area, plan)` devuelve los links del área filtrados por plan
(`nav.plans` limita, por ejemplo, `/asesor/api` a Enterprise). El test
`navLinks.test.ts` valida que ningún componente de navegación apunte a una URL
inexistente y que no haya ids, paths o alias duplicados.

### Añadir una ruta

1. Agregar la entrada en `routeManifest.tsx` con `area`, `access` y `layout`.
2. Si debe aparecer en el menú, agregar `nav`.
3. Si reemplaza una URL antigua, agregar el alias en `routeAliases`.
4. `bunx vitest run src/routes/navLinks.test.ts`.

## QA mínimo después de modificar rutas

- `/`, `/explorar`, `/propiedad/:id`, `/explora-park`.
- `/comprador/inicio`, `/asesor/dashboard`, `/admin/dashboard` sin sesión → `/auth?redirect=…`.
- `/dashboard` → `/asesor/dashboard`; `/favorites` → `/favoritos`; `/profile` → `/perfil`.
- Una URL inexistente → `NotFound`.
