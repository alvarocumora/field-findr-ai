# Playa Álvaro — Plataforma inmobiliaria premium

KMZ analizado: **286 placemarks, ~87 lotes** (LOTE-71…78 confirmados con superficies 5/10/20 ha), 1.171 LineStrings (sin polígonos explícitos), 176 puntos. Hay que reconstruir polígonos con el parser KMZ existente (4 estrategias en `src/lib/kmz/`), igual que Forestal/Huellelhue.

Estética: **clon visual de Huellelhue** (dark + verde bosque, Swiss typography, glassmorphism). Tour 3D: **R3F procedural + Mapbox DEM**. Datos: **estáticos en landing + seed en DB**.

Por el tamaño, lo divido en 5 fases entregables. Cada fase deja la app funcional y se aprueba por separado.

## Fase 1 — Ingesta KMZ + datos canónicos (esta iteración)

1. Script `scripts/generatePlayaAlvaroLots.ts` que:
   - Lee `/tmp/playa_alvaro.kmz` con `kmzParser` (extrae LineStrings, ensambla polígonos cerrados por LOTE-XX, calcula área por Shoelace, normaliza con `normalizePolygon`).
   - Empareja cada polígono con su nombre `LOTE-XX` y su superficie (`9.47HA`, etc.) usando el orden de placemarks adyacentes.
   - Detecta los **POIs** (Points) → playa, miradores, accesos, áreas comunes.
   - Genera `src/pages/playaAlvaro/data/lots.ts` y `pois.ts` (estáticos, versionados).
2. QA: imprime conteo de lotes, área total, lotes huérfanos.

## Fase 2 — Landing comercial (estilo Huellelhue)

Ruta `/playa-alvaro` con secciones clonadas:
- `PaHero` (video drone placeholder + CTA)
- `PaEcosystem` / `PaConservation` (narrativa)
- `PaMasterplan` ⇐ **núcleo**: Mapbox satélite + 87 polígonos coloreados por estado (Emerald/Amber/Slate), numeración, hover ficha lateral, filtros por superficie y precio, leyenda, donut de distribución, barra de escala, panel "Etapa 1 / macrolotes".
- `PaFicha` (tabla técnica del predio matriz)
- `PaContact` + `PaFooter`
Reusa `huellelhue.css` con tokens propios.

## Fase 3 — Tour Virtual 3D (R3F + DEM)

- Componente `PaTour3D` con `@react-three/fiber@^8.18` + `@react-three/drei@^9.122` + `three@>=0.133`.
- Terreno: tile Mapbox Terrain-RGB del bounding box, UV 1:1 sobre PlaneGeometry segmentado.
- Overlay: polígonos de lotes extruidos por estado (Threebox-style, MeshStandardMaterial).
- POIs: playa, miradores, accesos como sprites navegables; cámara orbital + recorrido scripted ("flyTo POI").
- Modo VR: WebXR (`<XR>` de drei) opcional para Meta Quest.
- Cross-fade desde el mapa 2D (patrón ya documentado en mem `cinematic-geospatial-navigation`).

## Fase 4 — IA Comercial + Reserva online

- Edge function `pa-assistant` (Lovable AI Gateway, `google/gemini-2.5-flash`) entrenada con `lots.ts + pois.ts + FAQ` como system prompt.
- Chat flotante en la landing con `react-markdown`, historial completo por mensaje.
- Cotización automática: precio/m² por estado y superficie.
- Reserva online: reusa flujo existente `create-reservation-payment` (Mercado Pago) — botón "Reservar" en la ficha de lote.

## Fase 5 — Seed DB + CRM

- Migración: crea `project` "Playa Álvaro" + 87 `lots` con polígonos/precios/estado desde `lots.ts` (script de seed con `supabase--insert`).
- Activa CRM existente: leads del chat IA y formularios entran a `leads`, scoring automático (trigger ya existe), pipeline Kanban (`/asesor/leads`), reservas → `reservations` → `closing_steps` → firma electrónica → dashboard de ventas (todo ya implementado en el SaaS).

## Detalles técnicos

- **Parser KMZ**: extraer LineStrings sin Polygons obliga a usar la "Strategy 3" del parser (cerrar anillos por proximidad). El KMZ tiene placemarks emparejados `AECC_PARCEL_SEGMENT → LOTE-XX → 9.47HA`; mapear nombre+área por índice de aparición.
- **Memoria**: actualizar `mem://index.md` con `mem://features/playa-alvaro-project` (estructura, datos, polígonos).
- **Sin nuevos secretos**: Mapbox y Lovable AI ya configurados.

## Qué hago en el siguiente turno (al aprobar)

Solo la **Fase 1**: parser, `lots.ts`, `pois.ts` y un smoke test que confirma los 87 lotes. Sin tocar UI todavía. Después seguimos fase por fase para que puedas revisar cada entregable.
