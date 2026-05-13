# Supabase Visual Scenarios Schema — Sprint 4

## Objetivo

Agregar una base de persistencia para escenarios visuales asociados a propiedades, manteniendo el frontend preparado para reemplazar mock data por datos reales de Supabase.

## Archivos agregados

- `supabase/migrations/20260512205000_create_visual_scenarios.sql`
- `src/hooks/useVisualScenarios.ts`
- `docs/SUPABASE_VISUAL_SCENARIOS_SCHEMA.md`

## Tabla principal

### `public.visual_scenarios`

Representa escenarios conceptuales o validados asociados a una propiedad/listing.

Campos principales:

- `id`
- `property_id`
- `scenario_type`
- `status`
- `title`
- `subtitle`
- `description`
- `base_image_url`
- `overlay_image_url`
- `thumbnail_url`
- `model_registry_keys`
- `property_geojson`
- `scenario_geojson`
- `map_center_lng`
- `map_center_lat`
- `map_bearing`
- `map_pitch`
- `map_zoom`
- `metrics`
- `assumptions`
- `risks`
- `tags`
- `estimated_capex`
- `estimated_revenue`
- `created_by`
- `created_at`
- `updated_at`

## Tipos permitidos

- `industrial_packing`
- `warehouse_logistics`
- `residential_subdivision`
- `rural_lots`
- `agricultural_productive`
- `solar_energy`
- `tourism_lodge`
- `mixed_use`

## Estados permitidos

- `draft`
- `concept`
- `review`
- `approved`
- `archived`

## RLS definida

### Lectura pública

Usuarios públicos pueden leer escenarios `concept` o `approved` asociados a listings activos.

### Owner read

El dueño de un listing puede leer todos sus escenarios, incluidos `draft`, `review` y `archived`.

### Owner insert/update/delete

El dueño de un listing puede crear, actualizar y eliminar escenarios asociados a sus propiedades.

## Hook frontend

### `useVisualScenarios(propertyId)`

Ubicación:

```ts
src/hooks/useVisualScenarios.ts
```

Responsabilidades:

- consultar `visual_scenarios` por `property_id`;
- ordenar por `created_at`;
- mapear snake_case Supabase a `VisualScenario` frontend;
- parsear arrays JSON de `metrics`, `assumptions` y `risks`;
- mantener el tipo frontend desacoplado del schema SQL.

## Nota sobre tipos Supabase

El archivo `src/integrations/supabase/types.ts` es generado automáticamente. Por eso este sprint no lo edita manualmente.

El hook usa un cast local controlado para consultar la nueva tabla hasta que se regenere el tipo `Database` desde Supabase.

Cuando se regenere el cliente Supabase, se puede eliminar ese cast y usar tipos nativos.

## Integración pendiente

Este sprint no reemplaza todavía el mock en `PropertyDetail`.

Siguiente PR recomendado:

1. Usar `useVisualScenarios(listing.id)` en `PropertyDetail`.
2. Si Supabase devuelve escenarios, mostrarlos.
3. Si no devuelve escenarios y la propiedad es Teno, mantener fallback temporal mock.
4. Si no hay escenarios, no mostrar el módulo.

## QA sugerido

- Revisar migración SQL antes de aplicarla en Supabase.
- Confirmar que `listings.id` existe como UUID.
- Confirmar que `listings.user_id` existe y referencia al owner.
- Confirmar políticas RLS según roles reales del proyecto.
- Ejecutar `npm run build`.
- Verificar que el hook compile aunque los tipos Supabase aún no estén regenerados.

## Riesgos

### RLS incompleta para admin

La migración cubre lectura pública y owner. Si el rol admin se maneja mediante tabla `user_roles`, se debe agregar política admin en un PR posterior.

### Tipos Supabase generados

El hook compila con cast temporal, pero el ideal es regenerar `src/integrations/supabase/types.ts` después de aplicar la migración.

### Datos conceptuales

`approved` significa validación interna, no aprobación estatal. La UI debe seguir mostrando disclaimer salvo evidencia documental real.
