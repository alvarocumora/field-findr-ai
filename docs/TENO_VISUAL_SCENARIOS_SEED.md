# Teno Visual Scenarios Seed — Sprint 4.2

## Objetivo

Crear un seed SQL idempotente para poblar escenarios visuales iniciales asociados a la propiedad industrial Teno.

## Archivo agregado

- `supabase/seeds/20260514044500_seed_teno_visual_scenarios.sql`

## Propiedad objetivo

```txt
TENO_LISTING_ID = 4f5bca9a-22df-4afd-85cb-0fbda3667a84
```

## Escenarios incluidos

### 1. Packing frutícola con cámaras de frío

- Tipo: `industrial_packing`
- Estado: `concept`
- Incluye métricas de superficie predial, superficie construida y patio de maniobras.
- Incluye supuestos y riesgos.

### 2. Bodegaje y patio logístico

- Tipo: `warehouse_logistics`
- Estado: `concept`
- Incluye métricas de superficie de bodega, patio logístico y andenes referenciales.
- Incluye supuestos y riesgos.

### 3. Autoconsumo solar industrial

- Tipo: `solar_energy`
- Estado: `draft`
- Incluye métricas preliminares de área útil, potencia referencial y uso esperado.
- Incluye supuestos y riesgos.

## Seguridad / idempotencia

El seed usa IDs fijos y `on conflict (id) do update`, por lo que puede ejecutarse más de una vez sin duplicar registros.

## Requisitos previos

Antes de aplicar este seed, debe estar aplicada la migración:

```txt
supabase/migrations/20260512205000_create_visual_scenarios.sql
```

También debe existir en `public.listings` el registro de Teno con el ID indicado.

## Cómo aplicar

Aplicar desde el SQL editor de Supabase o mediante el flujo de migraciones/seeds usado por el proyecto.

Orden recomendado:

1. Aplicar migración `visual_scenarios`.
2. Aplicar seed Teno.
3. Abrir la ficha Teno en la app.
4. Confirmar que `useVisualScenarios(propertyId)` devuelve datos reales.
5. Confirmar que el fallback mock deja de ser usado cuando Supabase entrega escenarios.

## QA sugerido

- Ejecutar seed sin errores.
- Ejecutar seed una segunda vez y confirmar que no duplica registros.
- Revisar que los escenarios `concept` sean visibles públicamente si la propiedad está activa.
- Confirmar que el escenario `draft` solo sea visible para owner según RLS.
- Abrir ficha Teno y validar el viewer.

## Próximo paso

Una vez verificado el seed, se puede retirar gradualmente el fallback mock de Teno y preparar un flujo admin/agent para crear escenarios desde la interfaz.
