

# Plan: Sistema Profesional de Master Planning y Diseño 3D — Evolución por Fases

## Contexto actual

La plataforma ya cuenta con:
- Diseñador 3D de parcelas con 32+ objetos procedimentales (Three.js/R3F)
- Sistema de mapas GIS con capas WMS chilenas (IDE Chile), KMZ parser, draw tools
- CRM, pipeline de ventas, créditos directos, firma digital, MercadoPago
- Mapa interactivo de ventas con estados en tiempo real

Lo que falta para ser el **portal #1 de LATAM** se divide en 3 capas de innovación.

---

## Fase 1 — MVP Mejorado (implementación inmediata)

### 1A. Mejoras al Diseñador 3D existente

**Archivos a modificar:**
- `src/components/parcela/ParcelaDesigner3D.tsx` — Agregar terreno con relieve simulado, iluminación solar por coordenadas GPS, drag-and-drop real de objetos (TransformControls de drei), mediciones en tiempo real
- `src/components/parcela/ParcelaObjects.tsx` — Agregar materiales PBR mejorados, sombras realistas, LOD (Level of Detail)
- `src/components/parcela/ParcelaToolbar.tsx` — Agregar controles de: hora del día (sol), vista aérea/peatón, medición de distancias, undo/redo
- `src/components/parcela/useParcelaState.ts` — Implementar undo/redo stack, snap-to-grid, collision detection básica

**Funcionalidades nuevas:**
- **Simulación solar**: Rotación de luz direccional según hora del día y coordenadas GPS del lote
- **TransformControls**: Drag real de objetos con gizmo (mover/rotar/escalar) en vez de click-to-place
- **Medición en vivo**: Líneas de cota entre objetos mostrando distancias en metros
- **Vista peatón**: Cámara first-person para "caminar" por el diseño (gemelo digital lite)
- **Exportar PDF**: Captura cenital + datos del lote generados como PDF profesional con escala

### 1B. Motor de Autocorte de Parcelas (Subdivisión Inteligente)

**Archivos nuevos:**
- `src/components/masterplan/SubdivisionEngine.tsx` — UI para configurar subdivisión
- `src/lib/subdivision/autoSubdivide.ts` — Algoritmo de corte en grilla adaptativa
- `src/lib/subdivision/areaCalculations.ts` — Cálculo automático de vialidad (15-20%), áreas verdes (10%), servidumbres

**Lógica del algoritmo:**
1. Recibe polígono del terreno total + parámetros (área mínima por lote, % vialidad, % áreas verdes)
2. Genera eje vial principal siguiendo el lado más largo del polígono
3. Subdivide perpendicular al eje en franjas del ancho deseado
4. Aplica restricciones normativas (5,000 m² mínimo, frente mínimo 20m)
5. Calcula y descuenta automáticamente áreas comunes
6. Output: array de polígonos GeoJSON listos para importar como lotes

### 1C. Exportación profesional

**Archivos nuevos:**
- `src/lib/exporters/dxfExporter.ts` — Generador de archivos DXF (AutoCAD) desde polígonos GeoJSON
- `src/lib/exporters/scaledPdfExporter.ts` — PDF con escala 1:1000 y norte geográfico

---

## Fase 2 — Escalado (siguiente iteración)

### 2A. Terreno 3D con elevación real

**Archivos nuevos:**
- `supabase/functions/elevation-grid/index.ts` — Edge Function que consulta Open-Elevation API en grilla (ej: 20x20 puntos dentro del polígono) y retorna heightmap
- `src/components/parcela/TerrainMesh.tsx` — Genera PlaneGeometry con vertices desplazados según heightmap real
- `src/hooks/useElevationGrid.ts` — Hook para fetch y cache del heightmap

**Resultado:** El terreno en el diseñador 3D muestra el relieve real del lote (pendientes, cerros, quebradas).

### 2B. IA para Master Plan

**Archivos nuevos:**
- `supabase/functions/ai-masterplan-generator/index.ts` — Edge Function que recibe polígono + parámetros ("20 lotes de 5000m² con acceso al río") y genera 3 propuestas de trazado usando Gemini
- `src/components/masterplan/AILayoutGenerator.tsx` — UI con prompt en lenguaje natural y visualización de propuestas

**Flujo:**
1. Usuario escribe: "Quiero 20 lotes de 5,000 m² con acceso al río"
2. Edge Function envía polígono + instrucciones a Gemini (usando LOVABLE_API_KEY)
3. IA retorna 3 propuestas como arrays de coordenadas
4. Frontend renderiza las 3 opciones en mapa side-by-side
5. Usuario elige una y la aplica como loteo

### 2C. Importación de fotogrametría (nubes de puntos)

**Archivos nuevos:**
- `src/lib/pointCloud/lasParser.ts` — Parser básico de archivos .LAS/.LAZ (formato estándar de drones)
- `src/components/parcela/PointCloudViewer.tsx` — Visualización de nube de puntos con Three.js Points geometry

---

## Fase 3 — Innovación (diferenciación competitiva)

### 3A. Gemelo Digital completo
- Navegación first-person en el lote con física básica (cannon.js)
- Vegetación procedural basada en zona climática (datos de geo-enrichment existente)
- Sombras proyectadas según fecha/hora real

### 3B. Marketplace de modelos 3D
- Permitir a arquitectos subir modelos .glb de casas reales
- Storage en bucket `3d-models` de Supabase
- Catálogo comunitario de diseños

### 3C. Análisis regulatorio automatizado
- Cruce automático con normativas urbanísticas por comuna
- Validación de constructibilidad, rasantes, distanciamientos
- Integración con SII para verificar subdivisión permitida

---

## Resumen de implementación inmediata (Fase 1)

| Archivo | Cambio |
|---------|--------|
| `src/components/parcela/ParcelaDesigner3D.tsx` | TransformControls, simulación solar, vista peatón, mediciones |
| `src/components/parcela/ParcelaObjects.tsx` | Materiales PBR mejorados, sombras |
| `src/components/parcela/ParcelaToolbar.tsx` | Controles de hora/sol, undo/redo, modo medición, export |
| `src/components/parcela/useParcelaState.ts` | Undo/redo stack, snap-to-grid, collision detection |
| `src/components/masterplan/SubdivisionEngine.tsx` | **Nuevo** — UI de autocorte de parcelas |
| `src/lib/subdivision/autoSubdivide.ts` | **Nuevo** — Algoritmo de subdivisión inteligente |
| `src/lib/subdivision/areaCalculations.ts` | **Nuevo** — Cálculos de áreas comunes |
| `src/lib/exporters/dxfExporter.ts` | **Nuevo** — Exportador DXF |
| `src/lib/exporters/scaledPdfExporter.ts` | **Nuevo** — PDF con escala profesional |

**Dependencias adicionales:** `dxf-writer` (para exportación DXF)

**Sin cambios de base de datos requeridos para Fase 1** — usa las estructuras existentes (lots, projects, reservations.parcel_design).

