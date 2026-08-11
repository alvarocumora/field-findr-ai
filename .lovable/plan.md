# Ordenar la plataforma bajo un único sistema de rutas

## Situación actual

Hay 115 rutas repartidas en 5 archivos (`publicRoutes`, `buyerRoutes`, `agentRoutes`, `adminRoutes`, `legacyRedirects`), cada uno exportando un **array de `<Route>` sueltos**. Consecuencias:

- El layout se repite ruta por ruta (`agentElement(...)` / `adminElement(...)` en cada línea) y en el lado público cada página importa `PublicLayout` por su cuenta (17 páginas lo hacen, otras no) → cabeceras/footers inconsistentes.
- Convenciones mezcladas: `/publish` y `/publicar`, `/favoritos` vs `/favorites`, `/proyecto/:id` vs `/p/:slug` vs landings hardcodeadas (`/explora-park`, `/huellelhue`, `/playa-alvaro`, `/forestal-valle-escondido`).
- No existe una fuente única de verdad: menús, sitemap, SEO y tests de links leen las rutas por regex sobre los archivos `.tsx`.
- La protección de acceso vive en dos mecanismos distintos (`DashboardLayout requiredRole` y `ProtectedRoute requireRole`) sin criterio único.

## Objetivo

Un único sistema estructurado: **un manifiesto de rutas tipado** + **rutas anidadas con layouts padre** + **redirects legacy centralizados**, sin cambiar ninguna URL pública ya indexada.

## Qué se va a construir

### 1. Manifiesto único de rutas
`src/routes/routeManifest.ts`: lista tipada de todas las rutas con metadatos:

```text
{ id, path, area: 'public'|'buyer'|'agent'|'admin', element, access: 'public'|'auth'|'agent'|'admin',
  nav?: { label, icon, group, plans? }, seo?: { indexable, changefreq } }
```

De este manifiesto se derivan: el router, los menús (sidebar/header/bottom-nav), el sitemap y el test anti-links-muertos.

### 2. Router con rutas anidadas
`AppRouter` pasa a usar layouts como rutas padre con `<Outlet />`, eliminando la repetición por ruta:

```text
/                 → PublicLayout      (todas las públicas)
/  (buyer)        → BuyerLayout       (auth requerida)
/asesor           → DashboardLayout role=agent
/admin            → DashboardLayout role=admin
```

Los layouts se adaptan para renderizar `<Outlet />`; las páginas públicas que hoy importan `PublicLayout` internamente se limpian para no duplicar header/footer.

### 3. Un solo guard de acceso
`RouteGuard` unificado (basado en el `ProtectedRoute` existente) aplicado a nivel de layout padre: sesión + rol + plan. `DashboardLayout` deja de decidir acceso y vuelve a ser solo presentación.

### 4. Normalización de nombres de URL (con redirects 301-equivalentes)
Canónico en español, un patrón por concepto:

| Canónico | Alias que redirige |
|---|---|
| `/publicar` | `/publish` |
| `/favoritos` | `/favorites` |
| `/perfil` | `/profile` |
| `/suscripcion` | `/subscription` |
| `/comprador/inicio` | `/buyer/home` |
| `/proyecto/:slug` | `/p/:slug`, `/proyecto/:id` |

Las landings de proyecto hardcodeadas (`/explora-park`, `/huellelhue`, `/playa-alvaro`, `/forestal-valle-escondido`) se mantienen como están (SEO vivo) pero se registran en el manifiesto en un grupo `projectLandings` para que dejen de ser casos sueltos.

Todos los alias viven en un único `legacyRedirects` generado desde el manifiesto.

### 5. Navegación derivada del manifiesto
`StickyHeader`, `ModernSidebar`, `MobileBottomNav` y `FooterSection` dejan de tener listas propias de links: consumen `getNavFor(area, role, plan)`. Un link imposible de escribir si la ruta no existe.

### 6. Tests
- El test existente `navLinks.test.ts` se reescribe para validar contra el manifiesto (no por regex).
- Nuevo test: ninguna ruta duplicada, todo alias apunta a una ruta existente, toda ruta protegida declara `access`.

### 7. Documentación
`docs/ROUTES_MAP.md` se regenera desde el manifiesto y pasa a ser la referencia única.

## Orden de ejecución

1. Crear manifiesto + tipos, sin conectar nada (cero riesgo).
2. Migrar `AppRouter` a rutas anidadas por área, área por área: admin → asesor → comprador → público.
3. Limpiar `PublicLayout` duplicado en páginas.
4. Unificar guard de acceso.
5. Alias/redirects normalizados.
6. Conectar navegación al manifiesto.
7. Tests + doc.

## Nota

No se toca lógica de negocio, datos ni backend: es reorganización de enrutado, layouts y navegación. Todas las URLs actuales seguirán funcionando.
