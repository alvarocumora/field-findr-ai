
## Objetivo

1. Eliminar todos los datos seed/demo del explorador (BD + frontend).
2. En `/explorar` móvil, **Swipe** pasa a ser la vista por defecto.
3. Arreglar los fallos del mapa/explorar (carga en blanco, sin resultados, errores JS).

---

## 1. Eliminar seed / dejar solo propiedades reales

**Base de datos (Supabase)**
- Estado actual: `listings` tiene 21 filas — **20 con `is_demo=true`** y solo 1 real.
- Migración: `DELETE FROM public.listings WHERE is_demo = true;` (borra en cascada `favorites`, `price_history`, etc. gracias a FKs existentes).
- Además: `DELETE FROM public.lots WHERE project_id IN (SELECT id FROM projects WHERE name ILIKE '%demo%' OR name ILIKE '%mock%');` (revisar antes; si no hay match no borra nada).

**Frontend — filtrar demo siempre**
- `src/hooks/useListings.ts` y `src/hooks/useInfiniteListings.ts`: añadir por defecto `.eq('is_demo', false)` en toda query de listings.
- `src/pages/Explorar.tsx`: fusionar los resultados de `useRealListings` (scraper `scrape-real-listings`) con los reales de Supabase. Cuando la BD quede vacía tras el DELETE, el explorador mostrará únicamente los del scraper.
- Arreglar edge function `scrape-real-listings`: los logs muestran `TypeError: results.map is not a function` — el parser de Firecrawl asume `results` array pero a veces viene `{ data: [...] }` o error. Añadir guard `Array.isArray(results) ? results : results?.data ?? []` y manejo de `Bad Gateway`.

## 2. Swipe como opción principal en móvil

- `src/pages/Explorar.tsx` línea 25: cambiar `useState<'list' | 'swipe'>('list')` → `useState<'list' | 'swipe' | 'map'>('swipe')`.
- Añadir botón `Mapa` al toggle (además de Lista y Swipe) — hoy solo hay list/swipe en móvil, el mapa fullscreen queda dentro de `MobileExploreView` (list mode).
- Orden visual del segmented control móvil: **Swipe · Lista · Mapa**.
- En SwipeExplorer, asegurar que consume `filteredListings` (reales) y no fuentes mock.

## 3. Arreglos mapa / explorar

Reproducir con Playwright en `/explorar` móvil (440×799) y capturar consola. Fallos conocidos a corregir:

- **Mapa pantalla en blanco:** validar en `EnhancedMap` que `useMapboxToken` resuelva antes de `new mapboxgl.Map(...)`; si `token` falta, mostrar `MapErrorState` con retry (hoy ya existe pero no se dispara si `container` no está montado por el bottom-sheet). Forzar `map.resize()` cuando cambia el snap del bottom sheet.
- **Sin marcadores:** tras eliminar demos + filtro `is_demo=false`, verificar que los listings reales tienen `lat`/`lng` no nulos; los que no, ocultarlos del mapa (ya se hace) pero contarlos en el badge "Sin geolocalización".
- **Crashes JS:** el `import mapboxgl` en `PropertyMap.tsx` está bien; revisar `MobileExploreView` que no crashee cuando `listings=[]` (mostrar empty state con CTA "Ver todo Chile").
- **Búsqueda mejorada:**
  - Debounce 300 ms en `searchQuery`.
  - Autocomplete usando la edge function `search-autocomplete` que ya existe (chips de sugerencias).
  - Buscar también en `city`, `address`, `tags`.
  - Botón "Limpiar" visible cuando hay query.

## Archivos afectados

- **Migración**: nuevo archivo Supabase migration (DELETE demos).
- **Hooks**: `src/hooks/useListings.ts`, `src/hooks/useInfiniteListings.ts`.
- **Pages**: `src/pages/Explorar.tsx`.
- **Componentes**: `src/components/explore/MobileExploreView.tsx`, `SwipeExplorer.tsx`, `FloatingSearchBar.tsx`, `ExploreMapPanel.tsx`.
- **Edge function**: `supabase/functions/scrape-real-listings/index.ts` (fix parser Firecrawl).

## Validación

- Playwright en `/explorar` móvil: al cargar debe abrir Swipe con propiedades reales; toggle a Mapa muestra marcadores sin errores; toggle a Lista muestra tarjetas.
- `psql -c "SELECT COUNT(*) FROM listings"` → debe reflejar solo reales tras la migración.
- Consola sin errores rojos.
