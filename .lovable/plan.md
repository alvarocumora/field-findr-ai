## Objetivo

Verificar que la app funcione end‑to‑end, entregar un **reporte técnico en `docs/AUDIT_REPORT.md`** con estructura, rutas pendientes y flujos críticos (publicación → detalle → 3D del mapa), y mejorar la experiencia de `/explorar`.

---

## Fase 1 — Auditoría automatizada

QA con Playwright headless sobre las rutas clave. Para cada una: status, errores de consola, mapa/token, imágenes, filtros, formularios.

**Rutas auditadas:**

```text
Públicas     /  /explorar  /propiedad/:id  /pais/:code  /region/:slug
             /ciudad/:slug  /oportunidades  /pricing  /blog  /contact
             /publish  /comparar  /alertas  /mi-terreno  /buyer-quiz
Landings     /forestal-valle-escondido  /huellelhue  /playa-alvaro
Auth         /auth  /reset-password  /profile
Tasación     /tasacion/v/:id  /tasacion/validar
Reservas     /reservation-{success,pending,error}
Dashboard    /asesor/*  (leads, listings, reservations, closing, reports)
Admin        /admin/users  /admin/visual-scenarios
```

Sesión Supabase inyectada para dashboard/admin. Screenshots por ruta en `/tmp/browser/audit/`.

## Fase 2 — Reporte `docs/AUDIT_REPORT.md`

Un solo documento con estas secciones:

1. **Resumen ejecutivo** (semáforo verde/amarillo/rojo por área).
2. **Mapa de rutas** — tabla `ruta · componente · estado · pendiente`.
3. **Flujo Publicación → 3D del mapa**:
   ```text
   /publish  →  PublishForm  →  listings (insert)
             →  /propiedad/:id  (PropertyDetail)
             →  Hero cinemático 3D  (EnhancedMap + Terrain-RGB)
             →  Layout overlay (Threebox/R3F)
   ```
   Con puntos de falla conocidos (token Mapbox, polígono normalizado, tags).
4. **Flujo Explorar** — filtros → useInfiniteListings → mapa + lista + swipe, con sync bidireccional.
5. **Backend/RLS** — resumen de findings restantes (warnings).
6. **Pendientes por prioridad** — P0 bloqueantes, P1 UX, P2 nice‑to‑have.
7. **Checklist de release** enlazado a `docs/QA_RELEASE_CHECKLIST.md`.

## Fase 3 — Mejoras a `/explorar`

Focalizadas en presentación y UX (sin tocar lógica de negocio salvo bugs claros):

- **Empty state**: cuando `listings.length === 0`, mostrar tarjeta con CTA "Limpiar filtros" y "Ver todas las propiedades" (arreglar `MobileExploreView` que hoy no lo tiene).
- **Loading skeletons** en la lista y el bottom sheet (evitar salto visual).
- **Sync mapa↔lista mejorado**: al hover en la lista, resaltar marker; al click en marker, hacer scroll al item en la lista.
- **`FloatingSearchBar`**: debounce 300 ms + botón limpiar (X) cuando hay query.
- **Chips activos**: mostrar chips de filtros seleccionados (tipos, regiones, pendiente) con quitar rápido.
- **Botón "Buscar en esta zona"**: verificar que dispare `onBoundsSearch` correctamente en desktop y mobile.
- **Contador de resultados** persistente en header de la lista.
- **Error state del mapa**: fallback claro cuando `useMapboxToken` falla, con retry.

Sin cambios de schema, sin cambios en el scraper, sin publicar en este pase.

---

## Entregables

- `docs/AUDIT_REPORT.md` con las 7 secciones y tabla de rutas.
- `/explorar` con empty state, skeletons, chips activos y sync mapa↔lista.
- Screenshots de QA en `/tmp/browser/audit/` (referenciados en el reporte).

## Fuera de alcance

- Publicación a producción (ya se hizo en el pase anterior).
- Re‑correr scraper Firecrawl (bloqueado por resultados vacíos previos).
- Cambios de RLS o migraciones nuevas.
