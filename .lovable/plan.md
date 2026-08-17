# Auditoría + Plan: portal líder de loteos y terrenos

## 1. Resultado de la auditoría (hoy)

Verificado con navegador headless sobre 18 rutas públicas, tests (232 ✓) y consultas a la base.

**Funciona bien**
- Sistema único de rutas (manifest + guard) sin rutas muertas; 232 tests pasan.
- Landings de proyecto (Explora Park, Huellelhue, Forestal, Playa Álvaro) renderizan completas.
- Datos: 552 listings (168 activos), 3 proyectos, 576 lotes.

**Problemas detectados**
| # | Severidad | Hallazgo |
|---|---|---|
| 1 | Alta | `scrape-real-listings` falla por CORS en `/` y `/playa-alvaro` → bloques de terrenos vacíos en el home |
| 2 | Alta | `/pricing-loteos` devuelve 404 (la página existe pero no está en el manifiesto o el path cambió); hay CTAs apuntando ahí |
| 3 | Alta | `/explorar` carga con contenido casi vacío (958 chars): el feed no muestra resultados en la primera pintura |
| 4 | Media | 54 listings sin imágenes → tarjetas rotas/placeholder en el marketplace |
| 5 | Media | Mapbox lanza `Failed to fetch` en `/oportunidades` (token o cuota) sin estado de error visible |
| 6 | Media | 0 leads registrados: ningún formulario está convirtiendo (o no se está guardando) |
| 7 | Media | SEO nunca escaneado; sin scan base no hay medición de indexación |
| 8 | Baja | `/quiz`, `/comparar`, `/alertas`, `/auth` con contenido mínimo: sin estado vacío ni copy de valor |

## 2. Plan por fases

### Fase 1 — Estabilidad (bloqueantes)
1. Arreglar CORS de `scrape-real-listings` (headers + `verify_jwt=false` en `config.toml`) y añadir fallback: si la función falla, el home muestra listings reales de la base en lugar de un bloque vacío.
2. Restaurar `/pricing-loteos` en el manifiesto (o alias al path canónico) y auditar todos los CTAs que apunten a rutas inexistentes con el test anti-links-muertos.
3. `/explorar`: render inicial con datos del servidor + skeletons reales, y estado de error del mapa cuando Mapbox falla (hoy queda en blanco).
4. Sanear los 54 listings sin imagen: imagen derivada del mapa estático del polígono como portada automática.

### Fase 2 — Conversión (el portal debe vender)
5. Instrumentar y verificar de punta a punta los formularios de lead (landing, ficha de lote, contacto): guardar en `leads` con origen, motivo y presupuesto; panel de leads por proyecto.
6. Ficha de lote como pieza comercial: precio, superficie, estado, mapa, PDF descargable, WhatsApp directo y lote siguiente/anterior.
7. CTA persistente por proyecto ("Agendar visita" / "Reservar") con seguimiento de conversión por estado de lote.

### Fase 3 — Producto diferenciador
8. Buscador unificado: proyectos + lotes en un solo índice, filtros por superficie, precio/m², estado y distancia, con URL compartible.
9. Comparador y alertas con contenido real (hoy vacíos): guardado por usuario y aviso por email al bajar precio o liberarse un lote.
10. Panel de inmobiliaria: inventario del loteo en Kanban, disponibilidad en tiempo real y reporte de embudo por lote.

### Fase 4 — Crecimiento / SEO
11. Escaneo SEO base y corrección de metadatos por ficha y por proyecto; sitemap dinámico incluyendo lotes indexables.
12. Páginas de mercado por ciudad/región con precios reales agregados (contenido único que atrae búsquedas de "terrenos en X").
13. Rendimiento móvil: presupuesto de carga para mapas 3D, carga diferida de Mapbox fuera del viewport.

## 3. Notas técnicas
- Los arreglos de la Fase 1 son de front + edge function; no requieren migraciones.
- La portada automática usa Mapbox Static Images con el polígono ya normalizado (`normalizePolygon`).
- Las alertas de precio se apoyan en `price_history` y en el cron ya existente.

## 4. Orden sugerido
Empezar por la Fase 1 completa en una sola tanda (es lo que hoy hace ver la plataforma rota), luego Fase 2.
