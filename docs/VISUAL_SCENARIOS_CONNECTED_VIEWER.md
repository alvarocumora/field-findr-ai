# Connected Visual Scenario Viewer — Sprint 4.1

## Objetivo

Conectar el viewer de escenarios visuales con `useVisualScenarios(propertyId)` sin reescribir `PropertyDetail` ni romper el fallback mock existente.

## Archivos modificados

- `src/components/visual-scenarios/ConnectedVisualScenarioViewer.tsx`
- `src/components/visual-scenarios/index.ts`
- `docs/VISUAL_SCENARIOS_CONNECTED_VIEWER.md`

## Estrategia

`PropertyDetail` ya importa `VisualScenarioViewer` desde el barrel export:

```ts
import { VisualScenarioViewer } from '@/components/visual-scenarios';
```

Este sprint cambia el export para que `VisualScenarioViewer` apunte al wrapper conectado:

```ts
export { default as VisualScenarioViewer } from './ConnectedVisualScenarioViewer';
export { default as VisualScenarioViewerBase } from './VisualScenarioViewer';
```

Así, `PropertyDetail` queda conectado indirectamente sin editar el archivo completo.

## Comportamiento

El wrapper:

1. Lee `propertyId` desde la ruta `/propiedad/:id` usando `useParams`.
2. Ejecuta `useVisualScenarios(propertyId)`.
3. Si Supabase devuelve escenarios, usa esos datos.
4. Si Supabase no devuelve escenarios, mantiene los scenarios recibidos como fallback.

Esto permite:

- usar datos reales cuando existan;
- mantener mock data temporal para Teno;
- no mostrar nada si no hay escenarios ni fallback;
- reducir riesgo en `PropertyDetail`.

## Export adicional

Se mantiene `VisualScenarioViewerBase` para demos, tests o usos futuros donde se quiera evitar consulta Supabase.

## QA sugerido

- Abrir `/demo/visual-scenarios` y confirmar que sigue mostrando mock data.
- Abrir ficha Teno y confirmar que sigue mostrando escenarios.
- Aplicar migración Supabase y cargar escenarios reales para una propiedad.
- Confirmar que los datos reales reemplazan el fallback.
- Abrir una propiedad sin escenarios y confirmar que no aparece el módulo.

## Próximo paso

Crear seed SQL opcional para insertar escenarios reales de Teno en `visual_scenarios`, y luego retirar gradualmente el fallback mock.
