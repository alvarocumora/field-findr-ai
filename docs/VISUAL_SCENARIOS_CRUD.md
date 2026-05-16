# Visual Scenarios CRUD — Sprint 5.1

## Objetivo

Agregar CRUD mínimo para escenarios visuales desde el panel admin, manteniendo el alcance controlado a campos básicos.

## Archivos modificados

- `src/hooks/useVisualScenarios.ts`
- `src/components/visual-scenarios/VisualScenarioFormDialog.tsx`
- `src/pages/admin/VisualScenariosAdmin.tsx`
- `docs/VISUAL_SCENARIOS_CRUD.md`

## Funcionalidad incluida

### Crear escenario

Desde `/admin/visual-scenarios`, el admin puede crear un escenario con:

- Property ID
- Tipo
- Estado
- Título
- Subtítulo
- Descripción
- URL de imagen base
- URL de overlay
- URL de thumbnail
- CAPEX referencial
- Revenue referencial
- Tags separados por coma

### Editar escenario

El admin puede editar los mismos campos básicos.

### Eliminar escenario

El admin puede eliminar un escenario después de confirmar con `window.confirm`.

## Hooks agregados

- `useCreateVisualScenario()`
- `useUpdateVisualScenario()`
- `useDeleteVisualScenario()`

Los hooks invalidan queries `visual-scenarios` después de una mutación exitosa.

## Alcance fuera de este sprint

No incluye todavía:

- edición de métricas JSON avanzadas;
- edición de supuestos/riesgos estructurados;
- gestión de geometrías GeoJSON;
- carga de imágenes a storage;
- gestión de GLB;
- control de versiones;
- análisis IA real;
- PDF real por escenario;
- archivado suave en lugar de delete real.

## Seguridad

La página sigue protegida por `DashboardLayout requiredRole="admin"`.

Las mutaciones dependen de las políticas RLS admin agregadas en Sprint 4.3.

## QA sugerido

- Entrar como admin a `/admin/visual-scenarios`.
- Crear un escenario con datos mínimos.
- Confirmar que aparece en el listado.
- Editar título, estado y tags.
- Confirmar que los cambios se reflejan.
- Abrir `Ver ficha` y confirmar que apunta a la propiedad correcta.
- Eliminar un escenario de prueba.
- Confirmar que desaparece del listado.
- Intentar crear sin título o property ID y confirmar que el botón está bloqueado.

## Riesgos

### Delete físico

Este sprint implementa eliminación real. En un sprint posterior conviene cambiar a archivado suave usando `status = archived`.

### JSON avanzado pendiente

Las métricas, supuestos y riesgos todavía requieren edición manual vía Supabase o seeds.

### Storage pendiente

Las imágenes se ingresan como URL. La subida a storage debe implementarse en otro sprint.

## Próximo sprint sugerido

Implementar archivado suave y carga de imágenes base/overlay a Supabase Storage.
