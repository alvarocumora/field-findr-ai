## Objetivo

Dejar OFERTA TERRENOS lista para producción en **ofertaterrenos.com**: QA funcional end‑to‑end de todas las rutas, importar propiedades reales vía scraper, auditoría de seguridad, SEO/sitemap actualizados, y publicación final.

---

## Fase 1 — QA funcional completo

Recorro con Playwright cada ruta clave y arreglo lo que falle. Cuento con red viva de dev; capturo screenshot + consola en cada paso.

**Rutas a validar:**

```text
Públicas         /  /explorar  /propiedad/:id  /pais/:code  /region/:slug
                 /ciudad/:slug  /oportunidades  /pricing  /blog  /contact
Marketplace      /comparar  /alertas  /referrals  /mi-terreno  /buyer-quiz
Landing brand    /forestal-valle-escondido  /huellelhue  /playa-alvaro
Auth             /auth  /reset-password  /profile
Tasación         /tasacion/v/:id  /tasacion/validar
Reservas         /reservation-{success,pending,error}
Dashboard        /asesor/* (leads, listings, reservations, closing, reports)
Admin            /admin/users  /admin/visual-scenarios
```

**Checks por vista:** carga sin error rojo en consola, mapa con token válido, filtros aplican a lista + mapa + swipe, imágenes cargan, PDFs se generan, formularios envían.

## Fase 2 — Datos reales vía scraper

- Ejecutar `scrape-real-listings` (Firecrawl v2, ya fue endurecido) apuntando a Portalinmobiliario / MercadoLibre / Yapo para terrenos LATAM.
- Insertar como `is_demo=false`, `status='active'`, `source='external'`.
- Meta: ≥30 propiedades reales cargadas antes de publicar.
- Programar cron `pg_cron` diario para mantener el inventario fresco.

## Fase 3 — Correcciones frontales previsibles

Basado en los últimos reportes:

- `EnhancedMap` — fallback claro con `MapErrorState` cuando `useMapboxToken` falla; retry manual.
- `MobileExploreView` — empty state con CTA "Ver todas" cuando `listings.length===0`.
- `FloatingSearchBar` — debounce 300ms + botón limpiar.
- `PropertyDetail` — placeholder gráfico si `images[0]` es nulo, evitando 404 en `<img>`.
- `Explorar` — asegurar que slope/valuación siga filtrando en swipe (ya integrado en lista/mapa).
- `Auth` — configurar Google OAuth (`configure_social_auth`) con `redirect_uri = window.location.origin`.

## Fase 4 — SEO, sitemap y metadata

- `index.html`: title/description reales de OFERTA TERRENOS, `og:*`, `twitter:card`, JSON‑LD `Organization`.
- Per‑route con `react-helmet-async` en `/propiedad/:id`, `/ciudad/:slug`, `/region/:slug`, `/pais/:code`, landings brand.
- `public/robots.txt` con `Sitemap: https://ofertaterrenos.com/sitemap.xml`.
- Sitemap: verificar que la edge `sitemap` incluya listings reales + landings.
- Correr `seo--trigger_scan` + `security--run_security_scan` antes de publicar.

## Fase 5 — Seguridad

- `supabase--linter` + `security--run_security_scan`.
- Cerrar findings críticos (RLS, `USING(true)` en tablas sensibles, funciones sin `search_path`).
- Activar HIBP password check en auth.
- Confirmar buckets storage con RLS coherente.

## Fase 6 — Publicación

1. `publish_settings--get_publish_settings` → confirmar visibility `public`.
2. `security--get_scan_results` → 0 findings críticos.
3. `preview_ui--publish` con `website_info_status: added_or_updated`.
4. Confirmar propagación en `ofertaterrenos.com` (custom domain ya conectado).

---

## Detalles técnicos

**Playwright QA:** scripts en `/tmp/browser/qa-<ruta>/` con sesión Supabase inyectada (agente + comprador). Screenshots + consola por paso. Un solo script por rol.

**Scraper:** invocar `scrape-real-listings` con `{ countries: ['CL','AR','MX','CO'], limit: 40, tags: ['terreno','parcela','campo'] }`. Validar `lat/lng` presentes antes de insertar (descartar filas sin geocoding).

**Cron scraper:**
```sql
select cron.schedule('scrape-real-listings-daily','0 6 * * *', $$
  select net.http_post(url:='.../functions/v1/scrape-real-listings',
    headers:='{"apikey":"<anon>"}'::jsonb) $$);
```

**SEO helper:** crear `src/components/seo/PageSEO.tsx` reutilizable (title/desc/canonical/JSON‑LD).

**Findings de seguridad esperados:** revisar `payments`, `credit_payments`, `transaction_documents`, `api_keys`, `webhook_deliveries` — deben negar acceso a `anon`.

---

## Entregables

- Reporte QA por ruta (pasa / falla / arreglado).
- ≥30 listings reales cargados.
- 0 findings críticos de seguridad.
- Sitio publicado y accesible en https://ofertaterrenos.com.

## Riesgos

- **Firecrawl sin créditos** → si `402`, aviso al usuario para top‑up (conector managed).
- **Rutas dashboard requieren rol** → uso sesión inyectada `LOVABLE_BROWSER_SUPABASE_*`.
- **Publicación cachea metadata social** → aviso al usuario que previews sociales tardan en refrescar.
