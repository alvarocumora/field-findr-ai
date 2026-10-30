# Frontera de roles del registro público

## Corrección

La migración20261030010000_restrict_public_signup_roles.sql reemplaza handle_new_user sin recrear ni desconectar el trigger. Conserva la creación de perfil y los dos tipos públicos actuales: buyer por defecto y agent solamente con account_type exactamente agent. Admin, otros nombres y valores JSON no válidos para un rol se normalizan a buyer.

No se convierten valores externos a app_role directamente. El administrador de plataforma se asigna por una operación privilegiada independiente. La función mantiene SECURITY DEFINER/search_path controlado y ejecución directa revocada a PUBLIC/anon/authenticated. No modifica roles ya asignados ni presume que un administrador existente sea ilegítimo.

## Prueba ejecutable

`bash scripts/test-auth-signup.sh`

Requiere Docker. Crea PostgreSQL16 aislado, sin puertos ni red externos, copia solo las dos migraciones necesarias y la prueba, y elimina el contenedor al terminar. No acepta URLs de base ni credenciales de producción.

La prueba aplica la migración histórica, reproduce el metadata→admin con datos sintéticos, aplica dos veces la migración real de corrección y verifica13 registros nuevos: buyer, agent, admin, rol desconocido, vacío, ausente, null, número, array, objeto, otra clave, mayúscula y metadata null. Comprueba un rol inicial por cuenta, preservación del perfil, ACL, roles previos y ausencia de promoción al modificar metadata posteriormente.

La ejecución utiliza un rol de servicio de prueba con INSERT en auth.users pero sin permiso para insertar perfiles/roles; el trigger se prueba realmente en PostgreSQL, no por búsqueda textual del SQL. El esquema mínimo no sustituye una restauración/replay completo del proyecto Supabase ni las políticas del entorno desplegado.

## Aplicación al entorno objetivo

1. Inspeccionar de forma autenticada la definición activa de handle_new_user y el trigger de auth.users mediante el administrador de base/Supabase. Registrar versión del entorno.
2. Aplicar la nueva migración en staging por el proceso normal de migraciones. No usar el fixture de pruebas sobre una base real.
3. Verificar alta con confirmación según la configuración real, conservación del perfil y asignación pública buyer/agent; repetir intentos de rol privilegiado con cuentas de prueba controladas, sin crear administradores globales.
4. Inspeccionar definición/ACL desplegadas, revisar errores de Auth y ejecutar smoke de los perfiles existentes. Luego promover por el proceso autorizado a producción.
5. Revisar asignaciones administrativas previas con evidencia y responsable. No revocar masivamente cuentas por inferencia a partir de metadata.

Verificación de solo lectura:

```sql
select pg_get_functiondef('public.handle_new_user()'::regprocedure);
select pg_get_triggerdef(oid)
from pg_trigger
where tgrelid = 'auth.users'::regclass and tgname = 'on_auth_user_created';
select has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE'),
       has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE');
```

Si aparece un fallo de alta, corregir manteniendo la allowlist. No restaurar el cast vulnerable de metadata para recuperar funcionalidad. La migración no introduce una revocación de roles existentes ni una operación irreversible de datos.

Estado: prueba local PostgreSQL aprobada. Aplicación/inspección en staging y producción pendientes; no se usaron cuentas reales ni conexión a la base productiva. El workflow añadido ejecuta la misma regresión aislada; la CI remota no se presenta como aprobada.
