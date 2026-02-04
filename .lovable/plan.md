
# Plan: Experiencia Unificada del Explorador

## Problema Actual

La interfaz actual tiene **3 vistas separadas** (Grid, Split, Map) que crean friccion:

```text
Vista Actual
┌─────────────────────────────────────────────────────────┐
│  [Grid] [Split] [Map]  ← Cambiar pierde contexto        │
├─────────────────────────────────────────────────────────┤
│ Vista Grid:                                             │
│  Solo listado, sin mapa                                 │
│                                                         │
│ Vista Split:                                            │
│  50/50 fijo, desperdicia espacio                        │
│                                                         │
│ Vista Map:                                              │
│  Solo mapa, sin listado                                 │
└─────────────────────────────────────────────────────────┘
```

**Problemas identificados:**
1. Al cambiar de vista se pierde la propiedad seleccionada
2. El panel de filtros ocupa 320px fijos que roban espacio al mapa
3. No hay sincronizacion visual entre hover en lista y marcador en mapa
4. La vista split tiene proporciones fijas (50/50) sin flexibilidad
5. Los filtros estan muy lejos del contexto de resultados

---

## Solucion Propuesta: Vista Mapa-Centrica con Panel Lateral Dinamico

Nueva arquitectura donde el **mapa es el canvas principal** y el listado es un panel colapsable superpuesto:

```text
Nueva Vista Unificada Desktop
┌─────────────────────────────────────────────────────────────────┐
│  [Buscar ubicacion...]  [Filtros v]  [IA]  [...]               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────┐                                             │
│  │ Resultados (24)│  ← Panel colapsable/expandible             │
│  │ ════════════   │                                             │
│  │ ┌────────────┐ │                      MAPA INTERACTIVO       │
│  │ │ Propiedad  │ │          (marcadores sincronizados)        │
│  │ │ $120M      │ │                                             │
│  │ └────────────┘ │                   [+]                       │
│  │ ┌────────────┐ │                   [-]                       │
│  │ │ Propiedad  │ │                   [3D]                      │
│  │ │ $85M       │ │                                             │
│  │ └────────────┘ │                                             │
│  │      ...       │                                             │
│  │ [<] [>]        │  ← Colapsar/expandir panel                 │
│  └────────────────┘                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Panel de Resultados Flotante Redimensionable

### 1.1 Nuevo Componente: `FloatingResultsPanel.tsx`

Panel lateral que flota sobre el mapa con tres estados:
- **Colapsado**: Solo iconos y conteo de resultados
- **Normal**: Lista compacta de propiedades (320px)
- **Expandido**: Lista completa con detalles (480px)

Caracteristicas:
- Arrastrable para redimensionar
- Animaciones suaves de transicion
- Permanece visible mientras el mapa ocupa 100% del fondo
- Scroll infinito para cargar mas propiedades

### 1.2 Nuevo Componente: `QuickPropertyCard.tsx`

Tarjeta ultra-compacta para el panel flotante:
- 80px de altura maxima
- Imagen thumbnail, precio, ubicacion en una linea
- Indicador de hover que sincroniza con mapa
- Click rapido para ver detalles en popup del mapa

```text
┌──────────────────────────────────────┐
│ [IMG] $120M | Las Condes | 5.000m²  →│
└──────────────────────────────────────┘
```

---

## Fase 2: Sincronizacion Bidireccional Lista-Mapa

### 2.1 Estados Sincronizados

| Accion | Resultado Lista | Resultado Mapa |
|--------|-----------------|----------------|
| Hover en tarjeta | Highlight tarjeta | Marcador pulsa + popup |
| Click en tarjeta | Seleccion activa | Centra mapa + zoom + popup |
| Hover en marcador | Scroll a tarjeta | Highlight marcador |
| Click en marcador | Scroll + seleccion | Popup expandido |
| Dibujar area | Filtrar lista | Mostrar solo area |

### 2.2 Animaciones de Conexion

- Linea visual animada conectando tarjeta con marcador al hacer hover
- Efecto "fly-to" suave al seleccionar propiedad
- Marcador con animacion de "bounce" al seleccionarse

---

## Fase 3: Filtros Contextuales Colapsables

### 3.1 Barra de Filtros Inteligente

Reemplazar panel lateral fijo por barra superior expandible:

```text
Estado Colapsado:
┌───────────────────────────────────────────────────────────┐
│ [Tipo ▾] [Region ▾] [Precio ▾] [+3 filtros] [Limpiar x]  │
└───────────────────────────────────────────────────────────┘

Estado Expandido (click en cualquier filtro):
┌───────────────────────────────────────────────────────────┐
│ [Tipo ▾] [Region ▾] [Precio ▾] [+3 filtros] [Limpiar x]  │
├───────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ □ Parcela    │  │ □ RM         │  │ $0 ───●─── $5B │    │
│  │ □ Industrial │  │ □ Valparaiso │  └──────────────┘    │
│  │ □ Agricola   │  │ □ Biobio     │                      │
│  └──────────────┘  └──────────────┘                      │
└───────────────────────────────────────────────────────────┘
```

### 3.2 Filtro "Buscar en esta Area"

Boton que aparece automaticamente al mover el mapa:
- Detecta cuando el usuario hace pan/zoom
- Muestra "Buscar en esta area" flotando sobre el mapa
- Filtra resultados por bounds visibles del mapa

---

## Fase 4: Preview Rapido sin Salir del Mapa

### 4.1 Panel de Preview Deslizable

Al hacer click en marcador o tarjeta, en lugar de navegar a otra pagina:

```text
┌────────────────────────────────────────────────────────────────┐
│ Panel Resultados │              MAPA                           │
│                  │                                             │
│  [Lista...]      │  ┌─────────────────────────────────────┐   │
│                  │  │                                     │   │
│                  │  │     POPUP EXPANDIDO                 │   │
│                  │  │   ┌───────────────────────────┐     │   │
│                  │  │   │ [Galeria de imagenes]     │     │   │
│                  │  │   │ Parcela Premium Las Condes│     │   │
│                  │  │   │ $120.000.000              │     │   │
│                  │  │   │ 5.000 m² | Agua, Luz      │     │   │
│                  │  │   │ [Ver Detalle] [Contactar] │     │   │
│                  │  │   └───────────────────────────┘     │   │
│                  │  │                                     │   │
│                  │  └─────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

### 4.2 Componente: `PropertyPreviewSheet.tsx`

Sheet lateral que se desliza desde la derecha:
- Galeria de imagenes deslizable
- Informacion clave (precio, area, ubicacion)
- Mapa mini con la ubicacion exacta
- Botones de accion (Ver Detalle Completo, Contactar, Favorito)
- Cerrar con swipe o click fuera

---

## Fase 5: Mejoras de Rendimiento

### 5.1 Virtualizacion del Listado

- Implementar scroll virtual para listas largas (>50 items)
- Solo renderizar items visibles en viewport
- Precarga de imagenes mientras se hace scroll

### 5.2 Clustering Inteligente

- Agrupar marcadores cercanos automaticamente
- Mostrar conteo en clusters
- Expandir cluster al hacer zoom
- Color de cluster segun precio promedio

### 5.3 Lazy Loading Mejorado

- Intersection Observer para cargar imagenes
- Paginacion infinita con skeleton loaders
- Cache de resultados por viewport del mapa

---

## Detalles Tecnicos

### Archivos a Crear

| Archivo | Proposito |
|---------|-----------|
| `src/components/explore/FloatingResultsPanel.tsx` | Panel lateral flotante redimensionable |
| `src/components/explore/QuickPropertyCard.tsx` | Tarjeta compacta para lista |
| `src/components/explore/PropertyPreviewSheet.tsx` | Preview deslizable de propiedad |
| `src/components/explore/FilterBar.tsx` | Barra de filtros colapsable |
| `src/components/explore/SearchAreaButton.tsx` | Boton "Buscar en esta area" |
| `src/hooks/useMapViewport.ts` | Hook para detectar bounds del mapa |
| `src/hooks/useVirtualizedList.ts` | Hook para scroll virtual |

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Explorar.tsx` | Reemplazar layout por vista unificada |
| `src/components/map/EnhancedMap.tsx` | Agregar callbacks de viewport, mejorar sincronizacion |
| `src/components/listings/ListingCard.tsx` | Agregar variante compacta |
| `src/hooks/useListings.ts` | Agregar filtro por bounds geograficos |

### Dependencias

Ya instaladas:
- `react-resizable-panels` - Para el panel redimensionable
- `vaul` - Para sheets deslizables
- Mapbox GL JS - Para bounds y viewport

---

## Orden de Implementacion

1. ✅ **FloatingResultsPanel** - Panel flotante base con 3 estados (colapsado/normal/expandido)
2. ✅ **QuickPropertyCard** - Tarjetas compactas con sync hover bidireccional
3. ✅ **Sincronizacion Lista-Mapa** - flyTo + popup al hover (con/sin clusters)
4. ✅ **FilterBar** - Barra de filtros colapsable en header
5. ✅ **PropertyPreviewSheet** - Side drawer para preview sin navegar
6. ⏳ **SearchAreaButton** - Filtrar por viewport (creado, pendiente integración)
7. ⏳ **Virtualizacion** - react-virtual para >100 items
8. ⏳ **Clustering inteligente** - Auto-activar a zoom bajo

---

## Archivos Creados/Modificados

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `FloatingResultsPanel.tsx` | ✅ | Panel con 3 estados, infinite scroll |
| `QuickPropertyCard.tsx` | ✅ | Tarjeta compacta con favoritos |
| `PropertyPreviewSheet.tsx` | ✅ | Side sheet con galería |
| `FilterBar.tsx` | ✅ | Dropdowns colapsables |
| `SearchAreaButton.tsx` | ✅ | Botón bounds-based |
| `useMapViewport.ts` | ✅ | Hook flyTo/fitBounds |
| `Explorar.tsx` | ✅ | Nueva arquitectura unificada |
| `EnhancedMap.tsx` | ✅ | Sync hover con/sin clusters |

---

## Mejoras Mapbox Aplicadas

### Best Practices Implementadas

- ✅ `isStyleLoaded()` guards en todas las operaciones de layers
- ✅ `essential: true` en flyTo para animaciones prioritarias
- ✅ Cleanup adecuado de markers, popups y MapboxDraw
- ✅ Clusters desactivados por defecto para mejor hover sync
- ✅ Hover sync funciona tanto con markers como con clusters
- ✅ Popup positioning con offset para evitar overlap

### Performance

- ✅ Lazy loading de imágenes en cards
- ✅ Intersection Observer para infinite scroll
- ✅ Debounced viewport changes
- ⏳ Virtualización (react-virtual) pendiente

---

## Resultado Final

- ✅ **Mapa siempre visible** como canvas principal (100% width)
- ✅ **Contexto preservado** - panel flotante mantiene estado
- ✅ **Sincronización bidireccional** - hover/click entre lista y mapa
- ✅ **Preview sin navegación** - PropertyPreviewSheet lateral
- ✅ **Filtros no invasivos** - barra superior colapsable
- ✅ **Mobile-first** - MobileExploreView con bottom sheet
