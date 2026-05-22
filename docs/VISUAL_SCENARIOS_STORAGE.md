# Visual Scenarios Storage — Sprint 5.2

## Objetivo

Agregar soporte incremental para subir imágenes base, overlays y thumbnails de escenarios visuales a Supabase Storage desde el panel admin.

## Archivos modificados

- `src/lib/visualScenarios/storage.ts`
- `src/lib/visualScenarios/index.ts`
- `src/components/visual-scenarios/VisualScenarioFormDialog.tsx`
- `supabase/migrations/20260516132000_create_visual_scenarios_storage.sql`
- `docs/VISUAL_SCENARIOS_STORAGE.md`

## Bucket

Nombre del bucket:

```txt
visual-scenarios
```

## Estructura de archivos

Los uploads se guardan con esta estructura:

```txt
<Property ID>/<folder>/<timestamp>-<safe-file-name>
```

Folders soportados:

- `base`
- `overlay`
- `thumbnail`

## Formulario admin

El formulario de Visual Scenarios mantiene los campos de URL manual y agrega inputs de archivo para:

- imagen base;
- overlay;
- thumbnail.

Cuando la subida termina correctamente, el formulario completa automáticamente la URL pública del archivo en el campo correspondiente.

## QA sugerido

- Aplicar la migración de Storage.
- Entrar como admin a `/admin/visual-scenarios`.
- Crear o editar un escenario.
- Cargar imagen base.
- Confirmar que el campo URL se completa automáticamente.
- Cargar overlay.
- Confirmar que el viewer muestra la imagen subida.
- Confirmar que URL manual sigue funcionando.

## Próximo sprint sugerido

Agregar archivado suave usando `status = archived` y mejorar reglas de Storage por rol o ruta.
