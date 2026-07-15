# Commercial Plan Leads — planes loteos

## Objetivo

Capturar solicitudes comerciales con plan seleccionado para vender planes de gestión de loteos a inmobiliarias.

## Archivos agregados

- `supabase/migrations/20260715154000_create_commercial_plan_leads.sql`
- `src/hooks/useCommercialPlanLead.ts`
- `src/pages/ContactLoteos.tsx`
- `docs/COMMERCIAL_PLAN_LEADS.md`

## Ruta pública

```txt
/contacto-loteos?plan=growth-inmobiliaria&source=planes-loteos
```

## Datos capturados

- `plan_slug`
- `source`
- `company_name`
- `contact_name`
- `email`
- `phone`
- `message`
- `status`
- `metadata`

## Estados comerciales

- `new`
- `contacted`
- `qualified`
- `won`
- `lost`
- `archived`

## Seguridad

- El público puede insertar leads comerciales.
- Solo admins pueden leer y actualizar leads.
- La política usa `public.is_platform_admin()`.

## QA sugerido

- Aplicar migración.
- Abrir `/contacto-loteos?plan=growth-inmobiliaria&source=qa`.
- Enviar formulario con email válido.
- Confirmar registro en `commercial_plan_leads`.
- Confirmar que usuario público no puede leer leads.
- Confirmar que admin puede leer y actualizar el estado.

## Próximo PR sugerido

Agregar dashboard admin para ver, filtrar y actualizar leads comerciales, y conectar todos los CTAs de `/planes-loteos` directamente a `/contacto-loteos` con `plan` y `source`.
