# VisualScenarioViewer — Sprint 3

## Objetivo

Crear un componente visual reutilizable para mostrar escenarios conceptuales de desarrollo sin conectar todavía Supabase ni tocar la ficha productiva.

## Archivos agregados

- `src/components/visual-scenarios/VisualScenarioViewer.tsx`
- `src/components/visual-scenarios/ScenarioMetricGrid.tsx`
- `src/components/visual-scenarios/ScenarioStatusBadge.tsx`
- `src/components/visual-scenarios/ScenarioTypeBadge.tsx`
- `src/components/visual-scenarios/index.ts`

## Funcionalidad

El viewer permite:

- mostrar imagen base;
- mostrar overlay si existe;
- mostrar tipo de escenario;
- mostrar estado;
- mostrar métricas principales;
- mostrar CAPEX o ingresos referenciales cuando existan;
- mostrar supuestos;
- mostrar riesgos;
- mostrar disclaimer;
- navegar entre múltiples escenarios;
- exponer callbacks opcionales para análisis IA y PDF.

## Props principales

```ts
interface VisualScenarioViewerProps {
  scenarios: VisualScenario[];
  className?: string;
  title?: string;
  onAnalyze?: (scenario: VisualScenario) => void;
  onExportPdf?: (scenario: VisualScenario) => void;
}
```

## Reglas de comportamiento

- Si no hay escenarios, muestra estado vacío controlado.
- Si hay un escenario, muestra viewer principal sin carrusel inferior.
- Si hay múltiples escenarios, muestra navegación lateral y selector horizontal.
- Los botones de IA/PDF aparecen deshabilitados si no se entregan callbacks.
- Los escenarios `concept`, `draft`, `review` y `approved` usan disclaimer según configuración.
- `approved` significa validación interna, no aprobación estatal.

## Integración futura

Sprint siguiente recomendado:

1. Crear una ruta o sección demo interna para ver mock data.
2. Integrar opcionalmente en `PropertyDetail` cuando exista data.
3. Conectar con Supabase mediante `useVisualScenarios`.
4. Agregar viewer avanzado con Mapbox/Threebox/GLB.

## Relación con GLB/Threebox

Este componente usa imágenes base/overlay. No carga GLB ni Threebox todavía.

El código compartido sobre registry GLB, cache GLTF, preload paralelo, normalización Y-up a Z-up, escalado por footprint y fallback procedural se mantiene como criterio para el futuro viewer 3D.

## QA sugerido

- Renderizar con array vacío.
- Renderizar con un escenario.
- Renderizar con múltiples escenarios.
- Revisar mobile.
- Revisar que botones IA/PDF queden disabled si no hay callbacks.
- Revisar que el disclaimer se muestre cuando corresponde.
