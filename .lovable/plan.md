
# Propiedades reales scrapeadas en landings

Traer ~100 terrenos reales desde Portalinmobiliario, Yapo y Mercado Libre Inmuebles (LATAM) vía una edge function que scrapea bajo demanda con caché, y mostrarlos en la home `/`, `/explorar` y `/playa-alvaro`.

## Arquitectura

```text
Browser ──► useRealListings() ──► edge: scrape-real-listings ──► Firecrawl ──► portales
                  │                          │
                  │                          └─► cache 6h en tabla `cached_listings`
                  ▼
          PropertyCard / PropertyGrid / Mapa
```

## Fases

### 1. Backend — edge function `scrape-real-listings`
- Input: `{ country?, region?, type?, limit? }` (default `limit=100`, mix LATAM).
- Estrategia por portal (Firecrawl `/search` + `/scrape` con `formats: ['markdown', { type:'json', schema }]`):
  - **Portalinmobiliario CL**: terrenos Los Ríos, Los Lagos, Araucanía, Metropolitana.
  - **Mercado Libre Inmuebles**: AR, CO, MX (categoría terrenos).
  - **Yapo CL**: complemento clasificados.
- Normaliza a shape `Listing` (title, price, currency, area_m2, lat, lng, region, country, type='terreno', image_url, source_url, source_portal).
- Geocoding fallback con Mapbox cuando el portal no entrega coords.
- Cache: tabla `cached_listings` (TTL 6 h, key = hash(filtros)).
- CORS + Zod validation + rate-limit en memoria.

### 2. DB — tabla cache (migración)
```sql
CREATE TABLE public.cached_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  payload jsonb NOT NULL,
  source_portals text[] NOT NULL,
  fetched_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);
GRANT SELECT ON public.cached_listings TO anon, authenticated;
GRANT ALL ON public.cached_listings TO service_role;
ALTER TABLE public.cached_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read cache" ON public.cached_listings FOR SELECT USING (true);
```
(escritura solo service_role desde la edge function)

### 3. Frontend — hook + integración
- `src/hooks/useRealListings.ts`: React Query → invoca edge function, devuelve `Listing[]` compatible con componentes actuales.
- **Home `/` (Index.tsx)**: nueva sección "Terrenos reales en venta ahora" con `PropertyGrid` (12 destacados + link a explorar).
- **Explorar `/explorar`**: toggle "Incluir terrenos de portales externos" que mergea reales + DB; badge `source_portal` en cada card.
- **Playa Álvaro**: sección `PaComparables` debajo de `PaFicha` mostrando 6 terrenos costeros similares (filtro region=Los Ríos/Los Lagos).

### 4. UI — atribución y badge
- `PropertyCard` muestra badge "Portalinmobiliario" / "Mercado Libre" cuando `source_portal` está presente.
- CTA "Ver en portal original" → abre `source_url` en nueva pestaña (cumplimiento legal de atribución).

## Detalles técnicos

- **Conector Firecrawl**: requiere link via `standard_connectors--connect` (connector_id: `firecrawl`). El `FIRECRAWL_API_KEY` queda disponible para la edge function.
- **No persiste en `listings` real** — se mantiene separación: `listings` = inventario propio OFERTA TERRENOS; `cached_listings` = índice externo informativo.
- **Rate limit**: máx 1 scrape completo cada 6 h por filtro; usuarios subsecuentes leen del cache.
- **Imágenes**: se usan URLs originales del portal (no se re-hostea para evitar copyright).

## Archivos a crear/editar

- `supabase/functions/scrape-real-listings/index.ts` (nuevo)
- `supabase/migrations/<ts>_cached_listings.sql` (nuevo)
- `src/hooks/useRealListings.ts` (nuevo)
- `src/components/RealListingsSection.tsx` (nuevo, reutilizable)
- `src/components/PropertyCard.tsx` (badge `source_portal` + CTA externo)
- `src/pages/Index.tsx` (insertar sección)
- `src/pages/Explorar.tsx` (toggle merge externos)
- `src/pages/playaAlvaro/sections/PaComparables.tsx` (nuevo)
- `src/pages/playaAlvaro/PlayaAlvaroLanding.tsx` (insertar `PaComparables`)

## Prerrequisito

Conectar **Firecrawl** como connector antes de implementar la edge function. Sin esa key, el scrape no funciona.
