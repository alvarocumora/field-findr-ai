

# Plan: Sistema de Gestión de Terrenos con PostGIS + Visualizador 3D Cinematográfico

## Resumen

Evolucionar la plataforma existente integrando tres capacidades principales: filtros avanzados de plusvalía/topografía, simulación 3D sobre relieve real, y sincronización en tiempo real del inventario con transiciones cinematográficas dark-mode.

---

## Alcance

La plataforma ya cuenta con:
- **Mapa Mapbox** con marcadores, capas GIS, y clustering (`EnhancedMap`, `useMapInstance`)
- **Diseñador 3D de parcelas** con React Three Fiber (`ParcelaDesigner3D`)
- **Sistema de lotes** con estados (available/reserved/sold) y Realtime
- **Dark mode** via ThemeProvider

Lo que falta construir se divide en 3 módulos:

---

## Módulo 1: Filtros de Plusvalía y Topografía

**Archivo:** `src/components/explore/ValuationFilters.tsx`

- Agregar filtros de plusvalía estimada (bajo/medio/alto) basados en precio/m2 relativo a la zona
- Agregar filtro de topografía (plano/pendiente suave/pendiente fuerte) — dato calculado desde elevación Mapbox Terrain DEM
- Integrar estos filtros en `ExploreListPanel` y `Explorar.tsx`

**Archivo:** `src/hooks/useTerrainElevation.ts`

- Hook que consulta Mapbox Terrain-DEM v1 para obtener elevación promedio y pendiente de un lote dado su polígono
- Cache de resultados por lot_id

**Base de datos:** Agregar columnas `elevation_avg` y `slope_category` a tabla `lots` via migración, para persistir datos calculados.

---

## Módulo 2: Simulación 3D sobre Relieve Real

**Archivo:** `src/components/parcela/RealisticTerrain.tsx`

- Reemplazar el terreno plano actual (`Terrain` component) con un mesh generado desde datos de elevación Mapbox Terrain RGB tiles
- Descargar tile de elevación para las coordenadas del lote, convertir a heightmap, y generar `PlaneGeometry` con desplazamiento vertical por vértice
- Textura satelital del mismo tile para el material

**Archivo:** `src/components/parcela/HouseSimulator.tsx`

- Componente que permite al usuario colocar modelos de casa (los existentes en `ParcelaObjects`) sobre el terreno real
- Snap automático a la altura del terreno en cada punto
- Indicador visual de pendiente bajo la casa

**Modificar:** `src/components/parcela/ParcelaDesigner3D.tsx`
- Integrar `RealisticTerrain` como opción (toggle entre terreno plano y relieve real)
- Agregar botón "Vista Relieve Real" en la toolbar

---

## Módulo 3: Panel Admin con Inventario en Tiempo Real + Transiciones Cinematográficas

**Archivo:** `src/components/lots/RealtimeInventoryPanel.tsx`

- Panel que muestra grid de lotes con estado visual (verde/amarillo/rojo)
- Suscripción a Supabase Realtime en tabla `lots` para reflejar cambios instantáneos
- Botones de cambio rápido de estado (Disponible → Reservado → Vendido)

**Migración:** Habilitar Realtime en tabla `lots`:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.lots;
```

**Archivo:** `src/components/map/CinematicTransition.tsx`

- Componente wrapper que ejecuta transiciones cinematográficas entre vista global del mapa y vista individual de parcela
- Usa `map.flyTo()` con pitch progresivo (0° → 60°), bearing rotativo, y zoom de 6 → 18
- Al llegar al lote, fade-out del mapa 2D y fade-in del canvas 3D (`ParcelaDesigner3D`)
- Animación de salida inversa al volver al mapa global

**Modificar:** `src/pages/Explorar.tsx` y/o `ProjectDetail.tsx`
- Integrar `CinematicTransition` cuando el usuario selecciona un lote
- Dark mode enforced en estas vistas con clase `dark` en el container

**Estética Dark Mode:**
- Forzar Mapbox style `dark-v11` en contexto de exploración de terrenos
- Ajustar colores de marcadores: verde neon (#22C55E) para disponible, amber para reservado, rojo para vendido
- Glassmorphism oscuro en paneles flotantes con `backdrop-blur-xl` y bordes `border-white/5`

---

## Archivos a Crear
1. `src/components/explore/ValuationFilters.tsx` — Filtros plusvalía/topografía
2. `src/hooks/useTerrainElevation.ts` — Elevación desde Mapbox DEM
3. `src/components/parcela/RealisticTerrain.tsx` — Terreno 3D con heightmap real
4. `src/components/parcela/HouseSimulator.tsx` — Snap de casa al terreno
5. `src/components/lots/RealtimeInventoryPanel.tsx` — Panel admin realtime
6. `src/components/map/CinematicTransition.tsx` — Transiciones cinematográficas

## Archivos a Modificar
1. `src/components/parcela/ParcelaDesigner3D.tsx` — Toggle terreno real
2. `src/pages/Explorar.tsx` — Integrar filtros y transición cinematográfica
3. `src/components/explore/ExploreListPanel.tsx` — Agregar filtros de plusvalía

## Migración de Base de Datos
1. Agregar `elevation_avg NUMERIC`, `slope_category TEXT` a tabla `lots`
2. `ALTER PUBLICATION supabase_realtime ADD TABLE public.lots;`

---

## Detalle Técnico

### Terrain Elevation Pipeline
```text
Mapbox Terrain RGB Tile → Decode (R*256² + G*256 + B) * 0.1 - 10000
→ PlaneGeometry vertices.y = elevation
→ Satellite tile as texture
```

### Cinematic Transition Flow
```text
[Map Global z=6] 
  → flyTo(lot, z=18, pitch=60°, bearing=-30°, duration=3s)
  → opacity crossfade (map → 3D canvas)
  → [ParcelaDesigner3D with RealisticTerrain]
  → Back: reverse animation
```

### Realtime Subscription
```typescript
supabase.channel('lots-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'lots' }, handler)
  .subscribe()
```

