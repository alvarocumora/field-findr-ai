# Visual Scenarios Foundation — Sprint 2

## Objetivo

Crear la base tipada y reutilizable para el futuro módulo de escenarios visuales, sin integrar todavía UI productiva ni persistencia Supabase.

## Archivos agregados

- `src/types/visualScenario.ts`
- `src/config/visualScenarios.ts`
- `src/lib/visualScenarios/formatters.ts`
- `src/lib/visualScenarios/modelRegistry.ts`
- `src/lib/visualScenarios/index.ts`
- `src/data/mockVisualScenarios.ts`

## Alcance

Este sprint agrega:

- tipos de escenarios visuales;
- estados de escenario;
- configuración comercial por tipo;
- configuración de estado;
- disclaimer estándar;
- helpers de formato;
- registry inicial de modelos GLB;
- mock data controlada.

No agrega todavía:

- viewer visual;
- integración en ficha de propiedad;
- persistencia Supabase;
- Edge Functions;
- carga real de GLB con Threebox;
- generación de PDF.

## Tipos de escenario

- `industrial_packing`
- `warehouse_logistics`
- `residential_subdivision`
- `rural_lots`
- `agricultural_productive`
- `solar_energy`
- `tourism_lodge`
- `mixed_use`

## Estados

- `draft`
- `concept`
- `review`
- `approved`
- `archived`

## Reglas importantes

1. `concept` puede mostrarse públicamente, pero siempre con disclaimer.
2. `approved` significa validado internamente, no aprobación estatal.
3. `draft`, `review` y `archived` no deberían usarse como material público final.
4. La IA futura debe separar evidencia, supuestos y riesgos.
5. Los modelos GLB son opcionales; siempre debe existir fallback visual o procedural.

## Registry GLB

El archivo `src/lib/visualScenarios/modelRegistry.ts` define un registry inicial para assets 3D.

Keys iniciales:

- `house_a`
- `house_b`
- `warehouse`
- `tree_pine`
- `tree_oak`
- `street_lamp`

Rutas esperadas:

- `/models/quaternius/house_a.glb`
- `/models/quaternius/house_b.glb`
- `/models/quaternius/warehouse.glb`
- `/models/quaternius/tree_pine.glb`
- `/models/quaternius/tree_oak.glb`
- `/models/quaternius/street_lamp.glb`

Los assets deben ser CC0 o con licencia compatible. Quaternius se mantiene como fuente recomendada.

## Relación con Threebox / GLTF

El snippet técnico compartido sobre GLTF cache, preload paralelo, normalización Y-up a Z-up, escalado a footprint y fallback procedural queda reservado para un PR posterior.

Sprint 2 solo deja lista la estructura de registry y keys para no mezclar foundation con render 3D.

## QA sugerido

- `npm run build`
- Confirmar que los imports desde `@/types/visualScenario` compilan.
- Confirmar que los imports desde `@/config/visualScenarios` compilan.
- Confirmar que `src/lib/visualScenarios` exporta helpers sin dependencia de UI.
- Confirmar que mock data está marcada con tags `Mock data` y no se usa en UI productiva todavía.
