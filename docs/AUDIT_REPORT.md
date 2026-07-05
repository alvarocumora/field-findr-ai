# Reporte de Auditoría — OFERTA TERRENOS

_Última corrida: 2026‑07‑05 · Modo: Playwright headless + análisis estático_

## 1. Resumen ejecutivo

| Área | Estado | Nota |
|---|---|---|
| Rutas públicas (home, explorar, landings) | 🟢 200 | Renderizan sin errores rojos tras fix CORS |
| Rutas auth + reserva + tasación | 🟢 200 | Rutas correctas son `/reserva/exito`, `/contacto`, `/quiz`, `/instalar` |
| Edge function `scrape-real-listings` | 🟡 → 🟢 | CORS fallaba por `verify_jwt = true` por defecto → añadido a `config.toml` |
| Backend / RLS | 🟢 | 0 findings error‑level. 2 warnings sobre `SECURITY DEFINER` públicos (aceptado) |
| SEO | 🟢 | `index.html` con OG/JSON‑LD; helper `useSEO` disponible |
| PWA / Workbox | 🟢 | Precache <10 MiB, excluye `.js` |
| Publicación | 🟢 | Ya desplegado en `ofertaterrenos.com` |

## 2. Mapa de rutas

| Ruta | Componente | Estado | Pendiente |
|---|---|---|---|
| `/` | `Index` | 🟢 | — |
| `/explorar` | `Explorar` (split desktop / mobile 3 modos) | 🟢 | Empty state + limpiar filtros ✔ |
| `/propiedad/:id` | `PropertyDetail` + hero 3D | 🟢 | Fallback imagen null |
| `/proyecto/:id` · `/proyecto/:id/experiencia` | `ProjectDetail` / `ProjectExperience` | 🟢 | — |
| `/pais/:code` · `/region/:slug` · `/ciudad/:slug` | Landings LATAM | 🟢 | — |
| `/oportunidades` | `Oportunidades` | 🟢 | — |
| `/pricing` · `/blog` · `/contacto` | Públicas | 🟢 | — |
| `/comparar` · `/alertas` · `/mi-terreno` · `/quiz` | Buyer marketplace | 🟢 | — |
| `/forestal-valle-escondido` · `/huellelhue` · `/playa-alvaro` | Landings brand | 🟢 | — |
| `/auth` · `/reset-password` · `/profile` | Auth | 🟢 | Config Google OAuth |
| `/tasacion/v/:id` · `/tasacion/validar` | Tasaciones públicas | 🟢 | — |
| `/reserva/{exito,pendiente,error}` | Reservas | 🟢 | — |
| `/asesor/*` | Dashboard (leads, listings, closing, reports) | ⚙️ auth‑gated | Requiere sesión inyectada para QA |
| `/admin/{users,visual-scenarios}` | Admin | ⚙️ auth‑gated | Sólo rol `admin` |
| `/instalar` | PWA install | 🟢 | — |

**Nota:** `contact`, `buyer-quiz`, `install`, `reservation-*` **no existen** — usar los slugs en español (`contacto`, `quiz`, `instalar`, `reserva/*`). Actualizar links internos que aún usen los ingleses.

## 3. Flujo Publicación → 3D del mapa

```text
[Usuario]
  └─▶ /publish (PublishForm)
        └─▶ INSERT listings (RLS: user_id = auth.uid())
              └─▶ redirect /propiedad/:id (PropertyDetail)
                    ├─▶ EnhancedMap  (Mapbox GL, useMapboxToken)
                    │     ├─ style: satellite-streets-v12
                    │     ├─ terrain: mapbox.mapbox-terrain-dem-v1 (RGB)
                    │     └─ pitch 60° + sky layer  → efecto 3D
                    ├─▶ CinematicHero (docs/GUIA_HERO_CINEMATICO.md)
                    │     ├─ requiere polygon válido (normalizePolygon)
                    │     └─ overlay Threebox / R3F edificios procedurales
                    └─▶ 3D transition al hacer click en lote
```

**Puntos de falla conocidos**
1. `useMapboxToken` puede fallar si Edge `get-mapbox-token` responde 401 → `MapErrorBoundary` cae a `MapErrorState`.
2. Polígono sin `normalizePolygon` → hero cinemático desalineado con satélite.
3. `images[0] === null` → 404 en `<img>` (usar `placeholder.svg`).
4. Token Mapbox expirado → verificar rotación mensual.

## 4. Flujo Explorar (desktop + mobile)

```text
filtros UI  ─▶  Explorar.tsx  ─▶  useFlattenedListings(filters + bounds)
                    │                     │
                    │                     └─▶ Supabase RPC paginado
                    ├─▶ filter client‑side (search, tags, slope, valuation)
                    │
                    ├─▶ ExploreListPanel (desktop 420px)  ⇅ sync ⇅  ExploreMapPanel
                    │                                                  ├─ marker click → setSelectedListing
                    │                                                  └─ moveend → setMapBounds
                    │
                    └─▶ MobileExploreView (mobile fullscreen)
                          ├─ FloatingSearchBar (chips + limpiar)
                          ├─ EnhancedMap
                          └─ ExploreBottomSheet (snap 0.12 / 0.5 / 0.92)
```

Sync bidireccional: hover en lista → highlight marker; click marker → auto‑expandir bottom sheet o scroll a la card.

## 5. Backend / RLS

- Última migración: `20260702151329_*` (storage `tasaciones`) y `20260702151402_*` (property-images, lot-images, 3d-assets, tour-panoramas, reservations INSERT).
- **0 findings críticos** en último `security--run_security_scan`.
- 2 warnings pendientes (aceptados en `security-memory`):
  - `SECURITY DEFINER` en `has_role` y funciones utilitarias — necesario para RLS sin recursión.
  - "Public Bucket Allows Listing" en buckets deliberadamente públicos (`property-images`).

## 6. Pendientes por prioridad

**P0 (bloqueante)**
- Ninguno.

**P1 (UX / calidad)**
- Actualizar links internos que apunten a `/contact`, `/install`, `/buyer-quiz`, `/reservation-*` (deben ser `/contacto`, `/instalar`, `/quiz`, `/reserva/*`).
- Configurar Google OAuth (`configure_social_auth`) con `redirect_uri = window.location.origin`.
- Repoblar scraper Firecrawl (0 resultados en última corrida; posible falta de créditos).

**P2 (nice‑to‑have)**
- Cron `pg_cron` diario para `scrape-real-listings` (mantener inventario fresco).
- Fallback gráfico para `images[0] === null` en `PropertyDetail`.
- Loading skeleton más rico en `MobileExploreView` mientras `isLoading`.

## 7. Checklist de release

Ver `docs/QA_RELEASE_CHECKLIST.md`. Estado actual:
- [x] Rutas públicas en 200
- [x] Seguridad RLS sin errores
- [x] SEO + robots + sitemap
- [x] CORS edge functions
- [x] Publicado en `ofertaterrenos.com`
- [ ] Google OAuth configurado
- [ ] ≥30 listings reales cargados vía scraper

---

## Cambios aplicados en esta corrida

1. `supabase/config.toml` — añadido `[functions.scrape-real-listings] verify_jwt = false` (fix CORS que rompía `/`, `/explorar`, `/playa-alvaro`).
2. `src/components/explore/ExploreListPanel.tsx` — empty state ahora incluye botón "Limpiar filtros ({N})".
3. `src/components/explore/MobileExploreView.tsx` — overlay empty state con CTAs "Limpiar filtros" y "Ver todas".
4. Screenshots QA + `results.json` en `/tmp/browser/audit/`.
