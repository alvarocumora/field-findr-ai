# Visual Scenarios Admin RLS — Sprint 4.3

## Objetivo

Agregar políticas RLS para que usuarios con rol `admin` puedan gestionar todos los escenarios visuales.

## Archivo agregado

- `supabase/migrations/20260515040500_add_visual_scenarios_admin_rls.sql`

## Función agregada

```sql
public.is_platform_admin()
```

Esta función revisa la tabla `public.user_roles` y devuelve `true` si el usuario autenticado tiene rol `admin`.

## Políticas agregadas

### Lectura admin

Permite que admins lean todos los escenarios, incluyendo:

- `draft`
- `concept`
- `review`
- `approved`
- `archived`

### Creación admin

Permite que admins creen escenarios para cualquier listing.

### Actualización admin

Permite que admins actualicen cualquier escenario.

### Eliminación admin

Permite que admins eliminen cualquier escenario.

## Requisitos previos

Antes de aplicar esta migración, deben existir:

- `public.visual_scenarios`
- `public.user_roles`
- rol `admin` en `public.user_roles.role`

## Orden recomendado

1. Aplicar migración base `visual_scenarios`.
2. Aplicar migración admin RLS.
3. Aplicar seed Teno si corresponde.

## QA sugerido

- Iniciar sesión con usuario admin.
- Confirmar lectura de escenarios `draft`, `review` y `archived`.
- Confirmar creación de escenario para un listing que no pertenece al admin.
- Confirmar actualización de escenario.
- Confirmar eliminación controlada.
- Iniciar sesión con usuario no admin y confirmar que no obtiene permisos globales.

## Riesgos

### Dependencia de `user_roles`

La función depende de que `public.user_roles` exista y tenga columna `role` con valor `admin`.

### Seguridad definer

`is_platform_admin()` usa `security definer` para permitir evaluación estable dentro de RLS. Se fija `search_path = public` para reducir riesgo de búsqueda de objetos inesperados.

## Próximo paso

Crear un panel admin/agent para gestionar escenarios visuales desde UI, usando estas políticas como base de seguridad.
