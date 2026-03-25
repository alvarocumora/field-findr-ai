

# Plan: Modulo Tour Virtual 360 con Integración Geoespacial

## Contexto

El proyecto ya cuenta con Three.js, Mapbox, y parsing de KMZ. Se necesita un visor de panorámicas 360 estilo 3DVista/Krpano con hotspots navegables y superposición de polígonos del KMZ. Las referencias (lanube360, latitud360) usan Krpano para tours de loteos con planos superpuestos.

## Alcance Realista

Construir un tour 360 completo tipo Krpano requeriría meses de desarrollo nativo. Este plan implementa las funcionalidades viables en React usando `react-photo-sphere-viewer` (wrapper de PhotoSphereViewer) con plugins de marcadores y polígonos.

**Lo que SÍ se puede lograr:**
- Visor 360 con panorámicas equirrectangulares
- Hotspots para navegar entre escenas
- Polígonos SVG superpuestos sobre la esfera (marcadores tipo polygon del MarkersPlugin)
- Minimapa sincronizado con Mapbox mostrando posición de la cámara
- Gestión de escenas/panorámicas por proyecto (CRUD en BD)

**Lo que NO es viable en esta iteración:**
- Calibración automática GPS-a-esfera (requiere correspondencia de puntos manual compleja)
- Dibujo libre sobre coordenadas esféricas en tiempo real

## Implementación por Fases

### Fase 1: Infraestructura (BD + Storage)

**Migración SQL:**
```sql
CREATE TABLE public.tour_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  panorama_url text NOT NULL,
  thumbnail_url text,
  position_index integer DEFAULT 0,
  yaw_default numeric DEFAULT 0,
  pitch_default numeric DEFAULT 0,
  hotspots jsonb DEFAULT '[]',
  polygon_overlays jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tour_scenes ENABLE ROW LEVEL SECURITY;
-- RLS: owner full access, public read for active projects
```

- `hotspots`: array de `{id, yaw, pitch, target_scene_id, tooltip, icon}`
- `polygon_overlays`: array de `{id, name, points: [{yaw, pitch}], color, opacity}`
- Storage bucket: `tour-panoramas` (public, max 50MB per file for 8K images)

### Fase 2: Visor 360 con PhotoSphereViewer

**Nuevas dependencias:**
```
react-photo-sphere-viewer
@photo-sphere-viewer/core
@photo-sphere-viewer/markers-plugin
@photo-sphere-viewer/compass-plugin
```

**Nuevo archivo:** `src/components/tour/TourViewer360.tsx`

Componente principal que:
- Renderiza `ReactPhotoSphereViewer` con la panorámica seleccionada
- Usa `MarkersPlugin` para hotspots (iconos clicables que cambian de escena)
- Usa `MarkersPlugin` con tipo `polygon_px` / `polygon` para superponer polígonos de lotes sobre la esfera
- Controles: zoom, autorotate, fullscreen, compass
- Barra inferior con thumbnails de escenas para navegación rápida

### Fase 3: Panel Admin de Tour (solo owner)

**Nuevo archivo:** `src/components/tour/TourEditor.tsx`

- Upload de panorámicas 360 (drag & drop, validación de aspect ratio 2:1)
- Reordenar escenas
- Editor de hotspots: click en la panorámica para colocar un hotspot, seleccionar escena destino
- Editor de polígonos: seleccionar lote de la BD, definir puntos sobre la esfera para posicionar el polígono overlay del lote

**Nuevo archivo:** `src/components/tour/TourSceneManager.tsx`

- CRUD de escenas con preview thumbnail
- Solo visible para `showAdminControls`

### Fase 4: Minimapa Sincronizado

**Nuevo archivo:** `src/components/tour/TourMinimap.tsx`

- Mapbox mini-mapa (esquina inferior izquierda del visor)
- Muestra polígonos de lotes del proyecto
- Marcador de posición actual de la cámara 360
- Click en un lote del minimapa selecciona el lote y muestra info
- Rotación del indicador de dirección sincronizada con el yaw del visor 360

### Fase 5: Integración en ProjectDetail

**Modificar:** `src/pages/ProjectDetail.tsx`

- Nueva tab "Tour 360" con icono `Camera` / `Eye`
- Si el proyecto tiene escenas, muestra el `TourViewer360`
- Si es owner y no hay escenas, muestra CTA para subir panorámicas
- Botón "Tour 360" prominente en el header del proyecto

**Nueva ruta opcional:** `/proyecto/:id/tour` para vista fullscreen del tour

## Archivos a Crear/Modificar

| Archivo | Accion |
|---------|--------|
| `src/components/tour/TourViewer360.tsx` | Crear - Visor principal 360 |
| `src/components/tour/TourEditor.tsx` | Crear - Admin editor de hotspots/polígonos |
| `src/components/tour/TourSceneManager.tsx` | Crear - CRUD de escenas |
| `src/components/tour/TourMinimap.tsx` | Crear - Minimapa Mapbox sincronizado |
| `src/hooks/useTourScenes.ts` | Crear - Hook para CRUD de escenas |
| `src/pages/ProjectDetail.tsx` | Modificar - Agregar tab Tour 360 |
| `src/App.tsx` | Modificar - Ruta fullscreen tour |
| Migración SQL | Tabla `tour_scenes` + bucket storage |

## Flujo de Usuario

```text
ADMIN:
  Proyecto → Tab "Tour 360" → "Crear Tour"
    → Sube 3 panorámicas de drone (8K equirrectangulares)
    → Reordena escenas
    → En cada escena, coloca hotspots apuntando a otras escenas
    → Opcionalmente, superpone polígonos de lotes sobre la esfera
    → Guarda → Tour publicado

VISITANTE:
  Proyecto → Tab "Tour 360"
    → Ve panorámica inicial a pantalla completa
    → Navega girando con mouse/touch
    → Hace click en hotspot → transición suave a siguiente escena
    → Minimapa muestra su posición y lotes
    → Click en lote → popup con info y botón "Reservar"
```

## Detalle Tecnico: Polígonos sobre la Esfera

PhotoSphereViewer MarkersPlugin soporta marcadores tipo `polygon` con coordenadas `[yaw, pitch]`. Para superponer un lote:

1. Admin posiciona 3+ puntos sobre la panorámica haciendo click
2. Cada click captura `{yaw, pitch}` en radianes
3. Se guarda como `polygon_overlays` en la escena
4. Al renderizar, se crea un marker de tipo `polygon` con esos puntos
5. El polígono se mueve correctamente con la cámara (resuelto por la librería)

Esto NO es calibración GPS automática, sino posicionamiento manual visual -- pero es el enfoque que usan la mayoría de tours profesionales.

