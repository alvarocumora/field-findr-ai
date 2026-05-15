# Visual Scenarios Admin Panel — Sprint 5

## Objetivo

Crear un panel admin inicial para auditar escenarios visuales persistidos en Supabase antes de implementar CRUD completo.

## Ruta agregada

- `/admin/visual-scenarios`

## Archivos modificados

- `src/hooks/useVisualScenarios.ts`
- `src/pages/admin/VisualScenariosAdmin.tsx`
- `src/routes/adminRoutes.tsx`
- `docs/VISUAL_SCENARIOS_ADMIN_PANEL.md`

## Funcionalidad incluida

El panel permite:

- listar escenarios visuales desde Supabase;
- ver métricas rápidas de total, conceptuales, borradores y validados;
- ver tipo, estado, tags y descripción;
- ver CAPEX referencial;
- navegar a la ficha de la propiedad relacionada;
- refrescar la consulta manualmente.

## Alcance

Este sprint es solo lectura.

No incluye todavía:

- crear escenario desde UI;
- editar escenario;
- cambiar estado;
- eliminar escenario;
- subir imágenes;
- gestionar GLB;
- generar PDF;
- ejecutar análisis IA real.

## Seguridad

La ruta usa `DashboardLayout requiredRole="admin"`.

La lectura depende de las políticas RLS admin agregadas en Sprint 4.3.

## Hook agregado

`useAdminVisualScenarios(limit)` consulta `visual_scenarios` ordenado por `updated_at` descendente.

Usa el mismo mapper `mapVisualScenarioRow` que el viewer público para mantener consistencia entre frontend y Supabase.

## QA sugerido

- Entrar como admin a `/admin/visual-scenarios`.
- Confirmar que carga listado si existen escenarios.
- Confirmar que aparece estado vacío si no hay registros.
- Confirmar que usuario no admin no puede acceder por layout/roles.
- Confirmar que botón `Ver ficha` abre `/propiedad/:propertyId`.
- Confirmar que botón `Actualizar` refresca la consulta.

## Próximo sprint sugerido

Implementar CRUD mínimo:

1. Crear escenario.
2. Editar título, descripción, tipo y estado.
3. Agregar URLs de imagen base/overlay.
4. Actualizar tags, métricas y supuestos básicos.
5. Eliminar/archivar escenario.
