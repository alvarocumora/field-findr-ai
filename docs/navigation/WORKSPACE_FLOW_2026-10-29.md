# Menú y flujo de espacios de trabajo

Primera corrección de navegación sobre el diagnóstico de acceso del29 de octubre. No cierra los hallazgos de seguridad/sesión de esa auditoría.

## Organización del menú comercial

- Principal: un único acceso principal por contexto; empresa inicia en su dashboard y broker en Mi negocio.
- Propiedades: oportunidades, captaciones, catálogo, proyectos e inventario.
- Clientes y agenda: contactos, consultas, seguimiento y encuentros.
- Ventas y cobros: reservas, cierres, contratos, pagos y comisiones.
- Mi red: negocio broker y atribución.
- Gestión y reportes: análisis y resultados.
- Mi cuenta: equipo, empresa, notificaciones, soporte y perfil.

Se sustituyen etiquetas vagas por nombres de tarea: Consultas y prospectos, Seguimiento comercial, Ventas registradas, Registrar cierres y Contratos y firmas. No se fusionan sus tablas ni flujos distintos por una similitud de nombre.

La búsqueda del menú filtra únicamente las opciones visibles del contexto/capacidades, abre sus grupos y permite limpiar el filtro. No revela administración desde el espacio comercial. Los enlaces tienen altura mínima44px. Las rutas existentes conservan sus URLs y políticas.

## Continuidad

El dashboard muestra la ubicación actual y un retorno fiable al inicio del espacio, sin depender de un historial previo. El enlace de perfil del asesor permanece en /asesor/profile; administración dispone de /admin/profile bajo su guard de administrador. Se retira el acceso duplicado al perfil comprador del pie del menú.

En comprador, las cuentas con perfil comercial o administración pueden solicitar explícitamente el selector mediante /panel?elegir=1; la preferencia guardada ya no impide abrirlo. Elegir navega al inicio del contexto y deja atrás el selector.

El catálogo completo de módulos del dashboard queda en un desplegable accesible. Las tareas principales siguen visibles y el menú continúa siendo la entrada habitual. No se eliminan módulos por esconder el catálogo inicial.

## Verificación y límites

Suite completa: 494 pruebas en96 archivos, seguida de 24 pruebas focalizadas del menú, contratos de rutas y cambio de espacio. TypeScript, lint sin errores y build/PWA locales. Las pruebas del menú y cambio de contexto utilizan identidades simuladas; no certifican la sesión real del usuario ni el acceso de producción.

Queda pendiente el bootstrap de permisos con errores recuperables, la frontera de sesión/caché, la corrección SQL del registro y la validación autenticada por perfil. El menú no sustituye controles RLS/servidor ni permite declarar resueltos esos hallazgos.
