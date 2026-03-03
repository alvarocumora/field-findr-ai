
# Plan: Mejoras para ser el Mejor Portal de Terrenos y Loteos

## Estado Actual

La plataforma ya cuenta con una base solida: explorador split-view estilo Airbnb, mapa interactivo con capas GIS, sistema transaccional completo (reservas, cierre legal, creditos), IA integrada, SEO dinamico y soporte multi-pais LATAM. Sin embargo, hay areas criticas donde puede mejorar para diferenciarse como lider absoluto del mercado.

---

## Mejoras Propuestas (por prioridad)

### 1. Busqueda Full-Text con Autocompletado Inteligente

**Problema**: La busqueda actual es un filtro basico por `includes()` en el cliente. No soporta busqueda fuzzy, sugerencias ni historial.

**Solucion**:
- Crear una Edge Function `search-autocomplete` que use Postgres `ts_vector` + `ts_query` para busqueda full-text en listings (titulo, ubicacion, region, tags)
- Agregar un componente `SearchAutocomplete` con debounce de 300ms que muestre sugerencias agrupadas por tipo (ubicaciones, propiedades, proyectos)
- Integrar historial de busquedas recientes (localStorage)

### 2. Vista de Galeria Mejorada en PropertyDetail

**Problema**: La galeria actual es basica. Los portales lideres usan galerías inmersivas con lightbox, thumbnails y navegacion por teclado.

**Solucion**:
- Redisenar `ImageGallery` con layout estilo Airbnb: imagen principal grande + grid de 4 thumbnails
- Agregar lightbox fullscreen con navegacion por flechas del teclado y gestos swipe en movil
- Incluir contador de imagenes y boton "Ver todas las fotos"

### 3. Pagina de Comparacion Dedicada

**Problema**: El comparador actual usa un Sheet (panel lateral). No permite comparacion detallada lado a lado.

**Solucion**:
- Crear ruta `/comparar` con vista de tabla comparativa full-page
- Columnas lado a lado (max 4 propiedades) con metricas: precio, area, precio/m2, servicios, legal status, investment score, datos GIS
- Boton "Agregar al comparador" visible en ListingCard y PropertyDetail
- Exportar comparacion a PDF

### 4. Alertas de Precio y Busquedas Guardadas Mejoradas

**Problema**: Existe `saved_searches` en la DB pero no hay UI para que el usuario configure alertas de nuevas propiedades que coincidan con sus criterios.

**Solucion**:
- Agregar boton "Guardar busqueda" en el explorador con los filtros activos
- Crear pagina `/alertas` donde el usuario vea sus busquedas guardadas y active/desactive notificaciones
- Mejorar la Edge Function `check-saved-searches` existente para enviar notificaciones in-app cuando hay nuevos matches

### 5. Reviews y Ratings en Listings (no solo en Proyectos)

**Problema**: El sistema de reviews solo funciona para proyectos. Los compradores no pueden calificar propiedades individuales.

**Solucion**:
- Extender la tabla `reviews` para soportar `listing_id` (nullable) ademas de `project_id`
- Agregar seccion de resenas en PropertyDetail con rating promedio, distribucion de estrellas y formulario de resena
- Mostrar rating promedio en ListingCard como badge

### 6. Historial de Precios y Market Insights

**Problema**: No hay tracking de cambios de precio en las propiedades. Los compradores no saben si un precio bajo o subio.

**Solucion**:
- Crear tabla `price_history` (listing_id, price, currency, recorded_at) con trigger que inserte un registro cada vez que se actualiza el precio en listings
- Mostrar grafico de historial de precios (Recharts) en PropertyDetail
- Badge "Precio reducido" en ListingCard cuando el precio actual es menor que el anterior

### 7. Optimizacion de Performance y UX

**Problemas identificados**:
- Las listings no usan paginacion real (limit 1000 de Supabase)
- No hay skeleton loading en el panel lateral del explorador
- El mapa re-renderiza marcadores innecesariamente al filtrar

**Soluciones**:
- Implementar paginacion con cursor en `useListings` (limit 50, load more)
- Agregar skeleton cards en `ExploreListPanel` durante carga
- Virtualizar la lista con scroll infinito para manejar cientos de resultados

---

## Detalle Tecnico de Implementacion

### Archivos a Crear
| Archivo | Descripcion |
|---------|-------------|
| `supabase/functions/search-autocomplete/index.ts` | Edge function para busqueda full-text |
| `src/components/search/SearchAutocomplete.tsx` | Componente de autocompletado |
| `src/pages/Comparar.tsx` | Pagina de comparacion dedicada |
| `src/pages/Alertas.tsx` | Gestion de busquedas guardadas |
| `src/components/property/PriceHistoryChart.tsx` | Grafico de historial de precios |

### Archivos a Modificar
| Archivo | Cambio |
|---------|--------|
| `src/hooks/useListings.ts` | Agregar paginacion con cursor |
| `src/pages/PropertyDetail.tsx` | Integrar galeria mejorada, historial de precios, reviews |
| `src/components/listings/ListingCard.tsx` | Badge de precio reducido, rating |
| `src/components/property/ImageGallery.tsx` | Rediseno con lightbox y grid |
| `src/pages/Explorar.tsx` | Integrar SearchAutocomplete |
| `src/components/explore/ExploreListPanel.tsx` | Skeleton loading, scroll infinito |
| `src/App.tsx` | Agregar rutas /comparar y /alertas |

### Migraciones SQL
1. Tabla `price_history` con trigger en listings UPDATE
2. Agregar columna `listing_id` (nullable) a `reviews`
3. Indice GIN para busqueda full-text en listings

---

## Orden de Implementacion Sugerido

1. Busqueda full-text con autocompletado (impacto alto en UX de descubrimiento)
2. Galeria mejorada (impacto visual inmediato)
3. Historial de precios + badge "precio reducido" (diferenciador competitivo)
4. Paginacion y scroll infinito (estabilidad con volumen de datos)
5. Pagina de comparacion dedicada
6. Alertas de busquedas guardadas
7. Reviews en listings individuales
