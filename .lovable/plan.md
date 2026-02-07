
# Plan: Sistema Mejorado de Visualizacion de Mapa 3D con Poligonos Reales

## Diagnostico del Problema Actual

**Problema Identificado:**
El mapa 3D muestra poligonos distorsionados (formas tipo "abanico" o "estrella") porque:
1. El archivo KMZ actual (`brisas-original.kmz`) contiene datos catastrales oficiales (158 puntos + 86 segmentos de lineas) pero NO los poligonos cerrados de los lotes del proyecto
2. Los algoritmos actuales intentan "reconstruir" poligonos conectando estos segmentos, pero el resultado no coincide con la distribucion real de lotes
3. Algunos lotes tienen 500+ vertices (formas complejas incorrectas) y otros solo 5 vertices

**Datos Actuales en BD:**
- Lotes con poligonos de 5 a 987 puntos
- Areas calculadas desde 23 m2 hasta 125,746 m2 (claramente erroneas)
- Los poligonos no corresponden a la forma rectangular/trapezoidal de los lotes reales del master plan

---

## Solucion Propuesta: Sistema Completo de Gestion de Poligonos

### Parte 1: Herramienta de Dibujo Manual de Poligonos

Agregar una herramienta de dibujo interactivo usando Mapbox Draw que permita:

- Trazar poligonos directamente sobre el mapa satelital
- Superponer el master plan como referencia visual (ya existe)
- Asignar cada poligono dibujado a un lote especifico
- Calcular el area automaticamente al cerrar el poligono
- Guardar las coordenadas en la base de datos

**Flujo de uso:**
1. Usuario activa modo "Dibujar Lotes"
2. Se muestra el master plan superpuesto con opacidad ajustable
3. Usuario dibuja el poligono siguiendo los limites del lote en el master plan
4. Al cerrar, se muestra el area calculada
5. Usuario selecciona el numero de lote de un dropdown
6. Se guarda automaticamente

### Parte 2: Mejora del Parser KMZ para Poligonos Reales

Optimizar el sistema para que si el KMZ contiene poligonos cerrados reales (exportados correctamente desde Google Earth Pro), se usen directamente sin transformacion:

- Detectar geometrias `<Polygon>` con `<outerBoundaryIs>` validos
- Validar que los poligonos tienen forma razonable (4-50 vertices)
- Calcular area y centroide correctamente
- Matchear por nombre o numero de lote

### Parte 3: Generador de Poligonos desde PDF de Planos

Agregar capacidad de extraer coordenadas de planos PDF georeferenciados:

- Subir PDF del plano catastral
- Detectar coordenadas UTM o geograficas en el documento
- Convertir a formato compatible con Mapbox
- Generar poligonos aproximados basados en el analisis del plano

---

## Estructura de Archivos

```text
src/
├── components/
│   ├── lots/
│   │   ├── LotMapView.tsx         (MODIFICAR - agregar modo dibujo)
│   │   ├── LotDrawingTool.tsx     (NUEVO - herramienta de dibujo)
│   │   ├── LotPolygonEditor.tsx   (NUEVO - editor de poligonos)
│   │   └── MasterPlanOverlay.tsx  (existente)
│   └── map/
│       └── DrawingToolbar.tsx     (existente - extender)
├── lib/
│   └── kmz/
│       ├── kmlParser.ts           (MODIFICAR - mejorar extraccion)
│       └── polygonValidator.ts    (NUEVO - validar formas)
└── hooks/
    └── usePolygonDrawing.ts       (NUEVO - logica de dibujo)
```

---

## Detalles Tecnicos

### Componente LotDrawingTool.tsx

```text
Funcionalidades:
- Integrar @mapbox/mapbox-gl-draw (ya instalado)
- Modo poligono para dibujar lotes
- Snapping a vertices cercanos
- Calculo de area en tiempo real
- Selector de lote para asignar
- Guardar en tabla lots.polygon
```

### Mejora de LotMapView.tsx

```text
Cambios:
- Agregar boton "Modo Edicion" para activar dibujo
- Mostrar toolbar de dibujo cuando esta activo
- Permitir editar poligonos existentes
- Boton "Limpiar y Redibujar" por lote
```

### Nuevo Hook usePolygonDrawing.ts

```text
Responsabilidades:
- Inicializar MapboxDraw
- Manejar eventos de dibujo
- Calcular area con formula Shoelace
- Guardar/actualizar poligonos en Supabase
- Validar que el poligono este cerrado
```

### Validador de Poligonos polygonValidator.ts

```text
Funciones:
- validatePolygonShape() - verificar forma valida
- calculatePolygonArea() - area en m2
- simplifyPolygon() - reducir vertices innecesarios
- isReasonableLotShape() - detectar formas anormales
```

---

## Flujo de Usuario Mejorado

```text
Usuario en ProjectDetail > Mapa 3D
         │
         ├─► Ver poligonos existentes
         │        │
         │        └─► Si incorrectos ──► "Modo Edicion"
         │                                    │
         │                                    ├─► Superponer Master Plan
         │                                    │
         │                                    ├─► Dibujar nuevo poligono
         │                                    │
         │                                    ├─► Seleccionar lote
         │                                    │
         │                                    └─► Guardar
         │
         ├─► Importar KMZ correcto
         │        │
         │        └─► Detectar poligonos reales ──► Asignar a lotes
         │
         └─► Subir PDF de plano (futuro)
                  │
                  └─► Extraer georeferencias ──► Generar poligonos
```

---

## Interfaz de Modo Edicion

Cuando el usuario active "Modo Edicion":

1. **Toolbar de Dibujo** (esquina superior izquierda):
   - Boton "Dibujar Poligono"
   - Boton "Editar Existente"  
   - Boton "Eliminar Poligono"
   - Selector de lote activo

2. **Panel de Informacion** (lateral):
   - Area del poligono actual
   - Numero de vertices
   - Lote asignado
   - Boton "Guardar Cambios"

3. **Indicadores Visuales**:
   - Vertices arrastrables
   - Area en tiempo real mientras dibuja
   - Color diferente para poligonos sin asignar

---

## Migracion de Datos Existentes

Antes de implementar, limpiar los poligonos incorrectos:

```sql
-- Resetear poligonos con formas anomalas (>100 vertices o area <100m2)
UPDATE lots 
SET polygon = NULL, latitude = NULL, longitude = NULL
WHERE project_id = 'e0d83d66-c7be-4c94-a017-3ad331d74699'
  AND (
    jsonb_array_length(polygon::jsonb) > 100
    OR area < 100
  );
```

---

## Orden de Implementacion

1. **usePolygonDrawing.ts** - Hook para manejar logica de dibujo
2. **LotDrawingTool.tsx** - Componente de herramienta de dibujo
3. **polygonValidator.ts** - Validador de formas
4. **LotMapView.tsx** - Integrar modo edicion
5. **Limpiar datos** - Resetear poligonos incorrectos
6. **Testing** - Probar flujo completo de dibujo

---

## Consideraciones Tecnicas

- MapboxDraw ya esta instalado (`@mapbox/mapbox-gl-draw`)
- El master plan overlay ya funciona para usarlo como referencia
- Formula de area: Shoelace (ya implementada en geometry.ts)
- Conversion de coordenadas: lat/lng a metros para calculos de area
- Guardado optimista con rollback si falla

