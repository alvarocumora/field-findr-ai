

# Rediseño Completo: Explorar + Mapa Satellite Hybrid

## Visión
Transformar `/explorar` en una experiencia tipo **Redfin/Zillow premium** con mapa satellite-streets como base, clusters animados, transiciones suaves, y un panel de lista rediseñado con glassmorphism.

## Cambios Principales

### 1. Nuevo estilo base del mapa — Satellite Hybrid
**Archivos:** `useMapInstance.ts`, `PropertyMap.tsx`

- Cambiar estilo por defecto de `light-v11` → `satellite-streets-v12`
- Actualizar `changeMapMode` con 4 opciones: `satellite` (default), `streets` (light-v11), `dark` (dark-v11), `3d` (outdoors + terrain)
- Actualizar `MapModeSelector.tsx` con los 4 modos y nuevos iconos

### 2. Marcadores rediseñados para satellite
**Archivo:** `useMapMarkers.ts`

- Píldoras de precio con fondo oscuro semi-transparente (glass) para contraste sobre satélite
- Hover: glow animado con sombra coloreada por tipo
- Selected: anillo pulsante + popup mejorado
- Popup rediseñado con glass dark background, bordes sutiles, mejor legibilidad sobre satélite

### 3. Clustering de propiedades
**Archivo:** `useMapMarkers.ts`

- Implementar clustering nativo de Mapbox con GeoJSON source + circle/symbol layers
- Clusters muestran conteo con escala de tamaño (small/medium/large)
- Click en cluster → zoom animado al extent del cluster
- Transición suave entre clusters y marcadores individuales

### 4. Controles rediseñados
**Archivos:** `CompactMapControls.tsx`, `TouchMapControls.tsx`

- Estilo glassmorphism oscuro para visibilidad sobre satélite
- Añadir botón de toggle clusters on/off
- 4 modos de mapa en selector visual con thumbnails

### 5. Panel de lista rediseñado
**Archivo:** `ExploreListPanel.tsx`

- Header con resumen de resultados más visual (mini-mapa, stats)
- Cards con efecto hover que destaca el marcador correspondiente en mapa
- Animación de entrada con framer-motion (staggered fade-in)
- Badge de "mejor oportunidad" en la card con menor precio/m²

### 6. Transiciones y animaciones
**Archivos:** `ExploreMapPanel.tsx`, `Explorar.tsx`

- Transición suave al cambiar entre estilos de mapa (fade)
- Animación easeTo mejorada al seleccionar propiedad (zoom + pitch ligero)
- SearchAreaButton con animación de entrada/salida (scale + fade)

### 7. Mobile: Bottom sheet + mapa satellite
**Archivo:** `MobileExploreView.tsx`

- Mapa satellite como fondo
- Bottom sheet con glassmorphism
- Carrusel horizontal de cards en snap colapsado
- Swipe up para lista completa

### 8. Street View preview
**Archivo:** Nuevo `StreetViewPreview.tsx`

- Botón en popup que abre un mini iframe de Google Street View
- Se muestra en el PropertyPreviewSheet

## Archivos a Modificar
| Archivo | Cambio |
|---------|--------|
| `useMapInstance.ts` | Estilo default satellite, 4 modos |
| `useMapMarkers.ts` | Marcadores glass, clustering, popups dark |
| `MapModeSelector.tsx` | 4 modos con dark option |
| `CompactMapControls.tsx` | Glass dark, toggle clusters |
| `TouchMapControls.tsx` | Glass dark mobile |
| `ExploreMapPanel.tsx` | Transiciones, clustering toggle |
| `ExploreListPanel.tsx` | Cards animadas, staggered entry |
| `MobileExploreView.tsx` | Glass bottom sheet |
| `SearchAreaButton.tsx` | Animación mejorada |
| `PropertyMap.tsx` | Satellite default |
| `Explorar.tsx` | Integración nuevas props |
| Nuevo: `StreetViewPreview.tsx` | Mini street view |

## Resultado Esperado
```text
┌──────────────────────────────────────────────────────┐
│  StickyHeader                                         │
├──────────────┬───────────────────────────────────────┤
│ 🔍 Search    │                                       │
│ Filters bar  │   🛰️ SATELLITE MAP                   │
│──────────────│                                       │
│ ┌──────────┐ │   [Clustered markers]                 │
│ │ Card 1 ▸ │ │      ●15    ●8                       │
│ └──────────┘ │           $45M  $120M                 │
│ ┌──────────┐ │                                       │
│ │ Card 2 ▸ │ │   [🔍 Buscar en esta área]           │
│ └──────────┘ │                                       │
│ ┌──────────┐ │            [Satellite│Dark│3D│Streets]│
│ │ Card 3 ▸ │ │                      [+][-][📍]      │
│ └──────────┘ │                                       │
└──────────────┴───────────────────────────────────────┘
```

