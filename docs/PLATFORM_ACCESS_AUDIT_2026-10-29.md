# Auditoría de acceso, perfiles y dashboards

Fecha: 29 de octubre de 2026 (Chile). Base: `651ae61` de main.

## Dictamen

Hay una base reutilizable: manifiesto de rutas, retorno interno seguro tras login, contextos de trabajo, capacidades por rol de empresa y políticas de ruta. Todavía no es un módulo completo y certificado de acceso: hay un riesgo crítico en la asignación de roles del SQL versionado, aislamiento incompleto de caché y fallos de carga que se interpretan como ausencia de permisos o datos. Esas correcciones preceden al rediseño de dashboards.

No se deben reconstruir login, CRM ni perfiles desde cero. Conviene completar un núcleo de sesión/identidad/workspace y hacer que rutas, acciones, consultas y dashboards lo consuman consistentemente.

## Alcance y evidencia

- Revisión estática de login/registro, recuperación, sesión, roles, perfiles, contextos, organización, plan, guardas, navegación, dashboards y una muestra de consultas y endpoints de equipo.
- Inventario AST: 64 rutas declaradas con `pub`, 6 con `buyer`, 45 con `agent` y 23 con `admin`. `/panel` es una entrada literal adicional; no se incluyen aliases. De 45 entradas agent, 25 declaran capability o feature. Las restantes requieren clasificación, no son por ello vulnerables.
- 22 recorridos Chromium: login, registro, recuperación, enlace inválido y retorno anónimo desde comprador, broker, captaciones, finanzas, admin, panel y perfil, en 320×740 y1440×1000. Ningún desbordamiento horizontal; los retornos probados preservan ruta, query y hash.
- 61 pruebas existentes aprobadas en 13 archivos de acceso, equipo, workspace, broker y captaciones.
- Experimento sintético con QueryClient: una clave compartida y todavía fresca devuelve el registro ficticio A tras cambiar la función a B, sin ejecutar una segunda consulta. Muestra el mecanismo de riesgo; no accede a información real ni reproduce una intrusión.
- Evidencia: [inventario](audits/2026-10-29-access/routes.json), [navegador](audits/2026-10-29-access/browser.json), [caché](audits/2026-10-29-access/cache.json).

No hubo creación de usuarios, login con credenciales reales, envío de correos, cambios de contraseña, modificaciones de roles, reservas ni pagos. Las APIs externas se bloquearon en el navegador. No se certifican configuración Auth, proveedores OAuth, políticas RLS efectivamente desplegadas, cron, correo ni rendimiento de producción. Las pruebas anónimas no validan aislamiento autenticado entre roles.

## Modelo de perfiles que existe

`buyer`, `agent` y `admin` son roles de identidad. `buyer`, `broker`, `empresa` y `plataforma` son contextos de trabajo. El perfil público de broker y su estado activo son otra entidad. Captador es un flujo comercial, no un rol de identidad independiente. El plan habilita producto; no acredita permisos de empresa.

| Perfil operativo | Entrada y tareas principales | Estado / brecha |
| --- | --- | --- |
| Visitante | Explorar → ficha → consulta o autenticación con retorno | Retorno anónimo comprobado; completar confirmación por correo y estados de error |
| Comprador | `/comprador/inicio`: favoritos, búsquedas, reservas y pagos propios | Existe; faltan errores recuperables uniformes y QA autenticado |
| Broker activo con rol agent | `/asesor/mi-negocio`: proyectos asignados, clientes, red y comisiones | Existe; dependencia de roles + aprobación no debe confundirse con ausencia de perfil |
| Broker pendiente/inactivo | Postulación y explicación del estado | Diseñar estados explícitos; perfil activo por sí solo no habilita rutas agent |
| Captador | `/asesor/captaciones`: alta, revisión, negociación y publicación | Flujo existe; no aparece en el menú del contexto broker porque no declara ese contexto. Decidir y probar el acceso comercial deseado |
| Vendedor / `sales_agent` y `member` legado | Empresa: cartera, siguiente contacto, visitas y reservas | Capacidades definidas; falta aplicar permisos de escritura en todas las acciones |
| Loteador individual | Empresa: proyectos, inventario y operación comercial | Se trata como dueño de espacio individual; debe distinguirse de fallo al cargar membresía |
| Dueño de empresa / `owner` | Empresa: equipo, proyectos, ventas y finanzas | Capacidades amplias definidas; verificar aislamiento multiempresa extremo a extremo |
| Administrador de empresa / `org_admin`, `admin` legado | Equipo y operación según delegación | Backend de equipo restringe ciertas operaciones al dueño; UI no refleja todas esas diferencias |
| Jefatura comercial | `commercial_manager`: cartera del equipo, pipeline y resultados | Capacidades existentes; home compartida y acciones de equipo requieren ajuste |
| Operaciones | `operations`: inventario, reservas y documentos | Home de organización genérica; falta priorizar estas tareas |
| Finanzas | `finance`: pagos, comisiones y reportes | Home de organización genérica; evitar consultas y acciones comerciales no pertinentes |
| Corredor externo | `external_broker`: clientes y reservas permitidos | Diferenciar de broker de comunidad y verificar alcance de proyectos/clientes |
| Solo lectura | `viewer`: consulta, sin mutaciones | Matriz declarada; faltan pruebas negativas de cada acción y backend |
| Administración de plataforma | `/admin/dashboard`: aprobaciones, usuarios, organizaciones y soporte | Rol global separado de admin de empresa; revisar MFA, sesión y acciones sensibles |
| Cuenta multiperfil / multiempresa | `/panel`: elegir contexto y organización | Selector existe; preferencia de contexto es global al navegador y falta cierre seguro de caché |

La UI de registro ofrece comprador y «Soy Loteador». No describe por sí sola todos los perfiles anteriores. Los roles de empresa deben venir de una invitación/asignación autorizada, no de una elección libre en el registro.

## Brechas priorizadas

### A01 · P0 · Asignación de rol desde metadatos de registro

Evidencia: última definición versionada de `handle_new_user` en `supabase/migrations/20260213112738_d3caed97-36eb-4393-9071-4f54af199aaf.sql`, líneas21–29. Convierte `raw_user_meta_data.account_type` a `app_role` e inserta el resultado en `user_roles`; el enum incluye admin. No hay allowlist dentro de esa función. El formulario restringe su selector, pero la API de registro no depende de ese formulario. Revocar ejecución pública de la función no elimina su ejecución por trigger.

Riesgo: una base que conserve esa definición puede asignar privilegios globales a partir de entrada del cliente. Confirmado en SQL del repositorio; aplicabilidad en producción pendiente de inspección autorizada de la definición desplegada y configuración de alta. No se intentó explotar ni crear una cuenta privilegiada.

Corrección: migración que limita el alta a los roles públicos decididos (buyer y, si corresponde al producto, agent), mantiene admin únicamente mediante operación privilegiada y auditable, y maneja valores desconocidos sin un cast que rompa el alta. Pruebas en base aislada de rol permitido, desconocido y privilegiado. Inspeccionar/aplicar la migración y verificarla antes de cerrar el hallazgo.

### A02 · P1 · Caché privada sin frontera completa de sesión

Evidencia: `src/App.tsx` crea un QueryClient compartido con staleTime de60s; `useAuth.tsx:58` no limpia caché al salir ni cambiar identidad. `useReservations.ts:40` usa `['reservations', projectId]`, sin usuario u organización; claves de varios módulos admin también son compartidas. `signOut` no comprueba su error. No se encontró un mecanismo global de limpieza por evento de sesión.

Riesgo: datos privados de la cuenta anterior pueden seguir en memoria y presentarse al reutilizar una clave. RLS protege una nueva petición al servidor, no borra una respuesta ya almacenada. El experimento aislado reproduce ese mecanismo, no certifica exposición real entre dos cuentas de producción.

Corrección: cancelar solicitudes y limpiar consultas privadas al cambiar identidad, propagar fallos de logout y definir claves de consultas privadas por usuario + workspace + filtros. Probar A→logout→B, logout fallido, refresco de token y respuestas antiguas que llegan tarde.

### A03 · P1 · Error de identidad o empresa confundido con permisos ausentes

Evidencia: `useSmartRedirect` no expone error de `useUserRoles`; `RouteGuard` solo distingue carga/roles presentes. `usePanelContext` consume datos y loading de plan/empresa/broker, no sus errores. `useAccess.ts:59` concede capacidades de dueño individual cuando no hay organizationRole, sin distinguir una empresa ausente de una consulta fallida.

Impacto: denegación engañosa, envío a onboarding o capacidades frontend demasiado amplias tras un fallo. No demuestra bypass de RLS. Necesita estado explícito `loading / ready / error`, reintento y bloqueo de acciones hasta resolver el alcance.

### A04 · P1 · Lectura de módulo y escritura de acción no están alineadas

Evidencia: `/asesor/team` requiere `team.read`; `TeamManagement.tsx` presenta invitar, retirar y cambiar rol sin comprobar `team.write`. `manage-team/index.ts:90` sí devuelve403 salvo owner/admin/org_admin y limita cambios de rol al dueño. Viewer y jefatura tienen team.read sin team.write.

Impacto confirmado por fuente: controles que el usuario puede intentar y backend deniega. No se declara un bypass. Corrección: lectura y mutación separadas, estado explicativo según rol y mismas reglas de delegación que el endpoint. Revisar de igual forma inventario, CRM, documentos, comisiones y pagos; probar mutaciones negativas en servidor.

### A05 · P1 · Confirmación de correo pierde el destino original

Evidencia: `Auth.tsx` conserva redirect seguro para login y Google, pero `useAuth.tsx:49` usa `/auth` fijo para emailRedirectTo al registrar. El caso sin sesión solo muestra un toast de confirmación, sin pantalla persistente de próximos pasos/reenvío.

Corrección: conservar un destino interno validado durante la confirmación, estado «revisa tu correo», reenvío con espera y recuperación de enlaces vencidos. QA de retorno a parcela, búsqueda guardada y solicitud comercial, sin enviar a un dominio externo.

### A06 · P1 · Cambio/recuperación de contraseña incompletos

Evidencia: `SecurityTab` exige contraseña actual pero nunca la utiliza al ejecutar updateUser (líneas50–55). Login/registro/reset exigen seis caracteres; perfil exige ocho. `ResetPassword` deriva estado inicial del hash y evento recovery, sin estado de verificación inicial ni CTA directo para solicitar otro enlace.

Corrección: política coherente y compatible con el servidor; verificar/reautenticar realmente cuando se solicite contraseña actual o eliminar una promesa falsa de verificación. Separar checking/valid/expired/error en recovery y probar callbacks reales, error de red y cuenta OAuth. El backend debe seguir autorizando el cambio; mostrar un formulario por hash no prueba autorización.

### A07 · P1 · Cambio multiempresa no cubre uniformemente todas las consultas

Evidencia: `useProjects` sí incorpora organizationId y alcance en la clave; `useLeads` usa userId/projectId sin workspace y depende del conjunto accesible por RLS. `useOrganizationWorkspace` invalida una lista de familias, sin incluir reservas/pagos/comisiones de forma general. Un mismo usuario puede tener acceso a varias organizaciones.

Corrección: contrato único de scope y claves; invalidación/cancelación de todas las consultas dependientes del workspace y filtrado explícito cuando RLS permite varias empresas. Probar organizaciones A/B con membresías compartidas; misma persona no equivale a misma empresa. No se certifica mezcla real sin fixtures autenticados.

### A08 · P2 · Preferencia de contexto global y almacenamiento frágil

Evidencia: `usePanelContext` usa `ot:app-context:v2` sin userId y lecturas/escrituras sin try/catch; empresa sí tiene clave por usuario, pero sus accesos a storage tampoco siempre toleran error. Instancias del hook tienen estado local, no un proveedor único del contexto.

Corrección: preferencia por usuario, sincronización central y tolerancia al almacenamiento bloqueado. Nunca usar la preferencia como permiso. Probar dos cuentas en el mismo navegador y cambios de contexto sin recargar.

### A09 · P1 · Métricas y errores no uniformes en todos los dashboards

Evidencia: `useAdminStats` y `useAgentStats` en `useDashboardStats.ts` descartan errores de algunas respuestas y convierten resultados ausentes en cero; `DashboardAsesor`, `DashboardInmobiliaria` y BuyerHome no consumen todos los errores de sus consultas. TodayPanel y los módulos corregidos en PR anteriores sí ofrecen recuperación.

Corrección: completar el patrón existente de error/reintento, evitar KPI de negocio cuando su fuente falla, explicar el alcance y separar ventas de comisiones o intenciones. No inventar actividad a partir de profile.updated_at.

### A10 · P2 · Home de organización genérica para funciones diferentes

Evidencia: `dashboardComposition.ts` agrupa finanzas, operaciones, viewer y jefatura en la misma variante organization. Los permisos de rutas existen, pero no resuelven por sí solos la pertinencia del contenido y las consultas de inicio.

Corrección: composición de bloques por tarea/capacidad (no un dashboard duplicado por rol), con próxima acción, pendientes, alcance y accesos utilizables. Finanzas prioriza pagos; operaciones inventario; comercial seguimiento; viewer solo consulta.

### A11 · P2 · Perfil y acceso sin experiencia unificada

Evidencia: `/perfil` está en layout comprador y `/asesor/profile` usa la misma pantalla dentro del dashboard. ModernSidebar también ofrece `/perfil` como enlace común. La pantalla usa volver por historial. Los inputs observados de auth no declaran autocomplete apropiado (42 apariciones en la matriz, incluyendo visitas repetidas).

Corrección: perfil de cuenta compartido conservando workspace y punto de retorno, campos de password manager (email/username/current-password/new-password), etiquetas de botones icono, errores inline y próximos pasos persistentes. No confundir perfil público de broker con la cuenta privada.

### A12 · P1 · Certificación autenticada y operación de producción pendientes

Las pruebas existentes cubren reglas puras y algunos componentes; el smoke público comprueba redirecciones anónimas. No se ejecutó una matriz de cuentas reales por rol, RLS de mutaciones, callbacks OAuth/email ni métricas de carga autenticada. No se encontró integración MFA en la UI; la configuración externa de Supabase no se inspeccionó. El bloqueo de facturación de Actions impide tomar la CI remota como evidencia aprobada.

Corrección: fixtures en staging con usuarios de prueba, suite negativa/positiva por rol/tenant, revisión de configuración de proveedor y MFA para administración/acciones sensibles, restaurar CI y verificación del build desplegado. Medir tiempo login→home utilizable, errores por etapa y consultas repetidas, sin registrar credenciales, tokens ni PII innecesaria.

## Núcleo recomendado

1. **Sesión e identidad**: arranque, login, confirmación, recovery, expiración y salida con estados y errores explícitos.
2. **Workspace**: contexto + organización activos, preferencia por usuario y cambio atómico de alcance.
3. **Autorización**: roles/capacidades para rutas y acciones; controles equivalentes en RLS/RPC/Edge Functions.
4. **Cuenta y onboarding**: identidad privada común, perfil público separado y progreso según intención.
5. **Home por tareas**: composición de bloques según capacidades, pendientes reales y estado de cada consulta.
6. **Operación**: auditoría de acciones sensibles, pruebas por perfil y medición de latencia/fallos.

## Plan de PR acotados y aceptación

| Orden | PR propuesto | Cierre verificable |
| --- | --- | --- |
| 1 · P0 | Alta sin roles privilegiados desde metadata | Migración + pruebas SQL aisladas; inspección/aplicación verificada en entorno objetivo; admin no autoconcedible |
| 2 · P1 | Frontera de sesión y caché privada | Cuenta A nunca aparece en B; solicitudes antiguas canceladas; logout falla de forma explícita; claves privadas completas |
| 3 · P1 | Bootstrap de permisos y workspace | Error no deriva a onboarding ni dueño individual; reintento recupera el scope; contexto persiste por usuario |
| 4 · P1 | Login/confirmación/recovery completos | Retorno seguro tras correo y OAuth; enlaces vencidos recuperables; política de contraseña coherente; errores inline y password manager |
| 5 · P1 | Permisos de acción y delegación | Viewer no ve mutaciones; jefatura no administra roles; backend rechaza acciones no permitidas; auditoría de cambios |
| 6 · P1 | Scope multiempresa de todos los módulos privados | CRM, reservas, pagos, comisiones y métricas cambian juntos entre A/B sin filas ni cifras anteriores |
| 7 · P1/P2 | Dashboards y perfil por tarea | KPI indisponible no se vuelve cero; finanzas/operaciones/comercial tienen pendientes pertinentes; perfil conserva workspace |
| 8 · P1 | Staging, CI y certificación de perfiles | Suite autenticada y RLS, correo/OAuth, expiración, móvil y publicación verificadas; métricas sin datos sensibles |

Dependencias: PR1 antes de ampliar registro público; PR2–3 antes de considerar confiables los demás recorridos privados; PR5–6 antes de certificar permisos y aislamiento. PR4 puede prepararse en paralelo conceptual, pero no se ha delegado ni ejecutado en esta auditoría.

## Matriz mínima de pruebas para declarar el módulo completo

- Invitado → login → retorno exacto, con filtros/campaña/hash y redirect externo rechazado.
- Alta buyer/agent permitida, metadata desconocida/privilegiada rechazada o normalizada según contrato; confirmación y reenvío.
- Password errónea, red caída, rate limit, usuario sin rol, rol pendiente y fallo de consulta de roles.
- Recovery válido, vencido, ya usado, error de red, OAuth sin contraseña local y sesión expirada.
- Cuenta A→logout→B sin datos ni preferencias privadas de A; pestañas concurrentes y token renovado.
- Buyer, broker aprobado/pendiente, captador, owner, org_admin, jefatura, vendedor, operaciones, finanzas, externo, viewer y admin global.
- Lectura permitida y mutación denegada por ruta, acción y servidor; admin de empresa nunca equivale a admin de plataforma.
- Organización A→B: proyectos, leads, reservas, pagos, comisiones, equipo y métricas; respuestas antiguas no repueblan B.
- Móvil 320/390 y escritorio, teclado y lector de pantalla; password manager y mensajes inline.
- Conteos vacíos auténticos vs consulta fallida; reintento sin duplicar altas o pagos.

La auditoría entrega diagnóstico y aceptación; no corrige todavía los hallazgos ni equivale a un despliegue o certificación de seguridad de producción.
