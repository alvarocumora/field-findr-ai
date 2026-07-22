## Objetivo

Publicar **Parque Mirador** en Hualañé, Región del Maule, replicando el patrón de Brisas de Caone: registro en `projects`, `lots` con polígonos, `listings` sincronizadas para las fichas públicas por lote y activación como destacado en la home.

## Fuente de datos

- `user-uploads://doc.kml` — 225 polylines dentro de carpetas `Polyline [XXXX]`. No hay `<Polygon>`, por lo que hay que **reconstruir** los cierres.
- Ubicación confirmada: **Hualañé, Región del Maule**.

## Fases

### 1. Script de ingesta del KML → `scripts/generateParqueMiradorLots.ts`
Similar en espíritu a `generateHuellelhueLots.ts` / `generatePlayaAlvaroLots.ts`.

- Parsear el KML y agrupar `LineString`s por carpeta padre (`Polyline [ID]` = un lote candidato).
- Concatenar segmentos por continuidad de vértices (snap tolerancia ~1.5 m según `mem://features/compactacion-poligonos-con-restriccion-vial`) y cerrar el anillo cuando el primer y último punto coinciden (dentro de tolerancia).
- Filtrar polylines de calles/servicios (color rojo `ff0000fe` en el KML se ve usado para caminos vs `fffefefe` blanco para bordes de lote) para no confundir viales con lotes.
- Pasar cada polígono por `normalizePolygon` (`src/lib/polygonUtils.ts`) para respetar la Core rule de geometría 2D/3D.
- Calcular área (Shoelace en metros) y centroide para latitude/longitude.
- Exportar `src/pages/parqueMirador/data/lots.ts` con la lista tipada `{ lotNumber, polygon, area, centroid }`.

Salida esperada: N lotes (se determina al parsear; probablemente ~40–80). Reportar en consola los polylines descartados por no cerrar para revisión manual.

### 2. Migración de datos (usando insert tool, no schema)
- Crear registro en `projects`:
  - `name: "Parque Mirador"`, `slug: "parque-mirador"`, `city: "Hualañé"`, `region: "Maule"`, `country_code: "CL"`, `status: 'active'`, `featured: true`, `featured_until: now() + 90 días`.
  - `description`, `total_area`, `boundary` (envelope de todos los lotes), imágenes placeholder.
- Insertar lotes en `lots` (owner = usuario admin del proyecto, mismo dueño que Brisas):
  - `lot_number`, `area`, `polygon` (jsonb normalizado), `latitude/longitude`, `price` y `price_per_sqm` con valores base (usar promedio de Brisas como referencia inicial, editable luego).
  - `status: 'available'`.
- Para cada lote crear `listings` correspondiente (aprovecha trigger `sync_listing_from_lot` una vez seteado `listing_id`): crear listing con `status='active'`, `tags: ['loteo','parque-mirador']`, price idéntico al lote, luego `UPDATE lots SET listing_id=…` para linkear.
- Registrar entrada en `featured_history` (`action='activated'`) para dejar auditoría.

### 3. Ficha pública y visibilidad
- Reutilizar la ruta genérica existente `/proyecto/:id` (misma que usa Brisas) — no se crea landing dedicada según tu selección de alcance.
- Verificar que `get_public_lots(project_id)` devuelve los lotes (RPC ya existente).
- Confirmar que aparecen tarjetas por lote en `/proyecto/:id` y que el master plan renderiza polígonos.
- Al estar `featured=true` con imágenes, aparecerá en `FeaturedListings` de la home.

### 4. QA
- Playwright:
  - `/` — Parque Mirador visible en la sección destacados.
  - `/proyecto/<id>` — hero, master plan con polígonos, listado de lotes.
  - `/proyecto/<id>/experiencia` — scrollytelling funcional.
  - Filtro `/explorar` con `region=Maule` → excluye lotes individuales (tag `loteo`) y muestra Parque Mirador como proyecto en `ProjectsRail`.
- Ejecutar `supabase--linter` post-migración.

## Detalles técnicos

- **NO** se modifica schema: se usan tablas existentes (`projects`, `lots`, `listings`, `featured_history`).
- Se usa `supabase--insert` para poblar datos (no migration).
- Owner del proyecto: mismo `user_id` que Brisas de Caone (`e0d83d66-c7be-4c94-a017-3ad331d74699`.user_id) para heredar permisos y evitar RLS mismatches.
- Precios iniciales: `price_per_sqm` = mediana de Brisas de Caone (se calcula en el script y se aplica área × ppsqm). Editable después vía `adjust_lot_prices` RPC.
- Imágenes: usar 3 placeholders genéricos de campo/mirador desde `src/assets` existentes o `unsplash` público (no se generan nuevas con imagegen salvo que lo pidas).
- **Tour virtual y landing dedicada quedan fuera** de este alcance según tu selección (podemos hacerlas en un turno posterior cuando tengas panorámicas 360).

## Riesgos conocidos

- Si muchos polylines no cierran (por gaps del KML), reportaré la lista y podrás decidir: (a) aceptar N lotes válidos ahora, (b) ajustar tolerancia, o (c) descartar los rotos.
- Diferenciar caminos vs bordes de lote se hace por color de línea; si el KML mezcla estilos, algunos polígonos podrían necesitar corrección manual posterior.

## Entregable de este turno

Con tu aprobación, entrego: script de ingesta ejecutado, archivo `lots.ts` generado, proyecto + lotes + listings creados en la BD, destacado activo, y reporte de QA con screenshots de la home y ficha del proyecto.
