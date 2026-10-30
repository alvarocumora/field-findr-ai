# Datos privados y cambio de identidad

## Comportamiento

La instancia global de QueryClient se sustituye por una frontera dentro de AuthProvider. Al salir de una identidad autenticada o pasar de cuenta A a B, se crea otro cliente y se remonta el árbol consumidor. La instancia anterior se limpia; solicitudes o callbacks tardíos que conservan su referencia no pueden escribir en la caché nueva.

No depende de recordar todas las claves privadas existentes: también protege familias antiguas sin userId. Las claves explícitas por usuario/workspace siguen siendo necesarias para aislamiento entre empresas y para mantener el contrato de cada consulta.

Visitante→login conserva la instancia de datos públicos y el árbol. Antes del primer login no hay consultas privadas habilitadas por las rutas protegidas; después de un logout se parte de otra instancia nueva. Esto conserva formularios y listeners de OAuth/recovery. Una renovación de token de la misma identidad tampoco reinicia el cliente ni desmonta mapas/formularios.

El proveedor de sesión descarta una lectura inicial que llega después de un evento Auth más nuevo. Un fallo de esa lectura se resuelve sin mantener indefinidamente el spinner por una promesa rechazada. El SDK sigue siendo la fuente de sesión.

Logout devuelve error explícito y lo comunica; no presenta un fallo como éxito ni deja rechazos sin manejar. Perfil no navega al inicio al fallar la salida, y el menú móvil permanece disponible para reintentar. El borrador sensible de reserva se elimina al abandonar una cuenta dentro de la sesión activa; se conserva en visitante→login para no perder el formulario iniciado.

## Verificación

- Suite completa:529 pruebas en105 archivos.
- 13 pruebas focalizadas finales: frontera, proveedor Auth, integración de eventos y borradores. Incluyen A→B, logout→guest→B, callback tardío en el cliente viejo, mismo usuario, login desde visitante, sesión inicial obsoleta, logout con error/exception y limpieza de borrador.
- TypeScript, lint sin errores (advertencia existente de Fast Refresh) y build/PWA local.
- 22 recorridos anónimos Chromium a320/1440 sin desbordamiento ni pérdida del retorno privado. [Evidencia](audits/2026-10-29-identity/browser.json). APIs externas bloqueadas; no hubo credenciales ni operaciones reales.

## Límites y siguientes entregas

Esta frontera no cancela ni revierte una operación que ya llegó al servidor. Actor, scope, idempotencia y autorización de mutaciones deben verificarse en RLS/RPC/Edge Functions, especialmente para reservas/pagos y acciones sensibles. La limpieza de caché no equivale a revocar permisos en una base de datos.

No certifica OAuth/correo reales, múltiples pestañas con cuentas reales, despliegue ni renovación/revocación de roles en producción. Otros almacenamientos locales y preferencias por usuario requieren su propia política. La preferencia de contexto y errores de membresía siguen pendientes del siguiente bloque de bootstrap; aislar identidades no soluciona por sí solo aislamiento entre organizaciones de una misma cuenta.
