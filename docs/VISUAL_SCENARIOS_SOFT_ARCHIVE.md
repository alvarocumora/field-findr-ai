# Visual Scenarios Soft Archive — Sprint 5.3

## Objetivo

Reemplazar la eliminación física desde el panel admin por archivado suave usando `status = archived`.

## Archivos modificados

- `src/hooks/useVisualScenarios.ts`
- `src/pages/admin/VisualScenariosAdmin.tsx`
- `docs/VISUAL_SCENARIOS_SOFT_ARCHIVE.md`

## Cambios principales

### Hook nuevo

```ts
useArchiveVisualScenario()
```

Actualiza el escenario a:

```txt
status = archived
```

Luego invalida las queries de Visual Scenarios.

### Panel admin

El botón `Eliminar` fue reemplazado por `Archivar`.

Si un escenario ya está archivado:

- el botón queda deshabilitado;
- muestra texto `Archivado`.

## Razón de diseño

Los escenarios visuales pueden contener trabajo comercial, supuestos, imágenes y decisiones de diseño. La eliminación física puede provocar pérdida accidental de información. El archivado suave permite mantener historial y trazabilidad.

## Alcance

Este sprint no elimina todavía el hook `useDeleteVisualScenario`, pero lo saca del flujo normal del panel admin.

## QA sugerido

- Entrar como admin a `/admin/visual-scenarios`.
- Crear un escenario de prueba.
- Presionar `Archivar`.
- Confirmar que el estado cambia a `Archivado`.
- Confirmar que el botón queda deshabilitado.
- Confirmar que el escenario sigue visible en admin.
- Confirmar que no aparece públicamente si la RLS pública excluye `archived`.

## Próximo sprint sugerido

Agregar filtros en el panel admin:

- todos;
- concept;
- draft;
- approved;
- archived.

También se recomienda agregar una acción `Restaurar` para volver de `archived` a `draft` o `review`.
