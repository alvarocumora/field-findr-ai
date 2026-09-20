# Plan maestro: super administrador con visión total y consolidación de la plataforma

Hoy tu cuenta de administrador no ve toda la plataforma. Lo verifiqué contra las reglas reales de la base de datos: el administrador sí puede ver todos los perfiles, roles, propiedades, suscripciones y comisiones, pero **no** puede ver empresas (inmobiliarias), miembros de equipo, pagos, proyectos de terceros, clientes potenciales, reservas ni cierres de otras cuentas. Por eso los paneles se ven vacíos o parciales cuando entras como plataforma.

Tampoco existe una pantalla de inmobiliarias: hay "Usuarios", "Agentes" y "Brokers", pero ninguna vista de empresas contratantes con su plan, equipo, proyectos y facturación.

## Lo que se va a construir

### 1. Visión total para el super administrador
Habilitar acceso de solo lectura (y gestión donde corresponde) del administrador de plataforma sobre: empresas y sus miembros, proyectos, clientes potenciales, visitas, reservas, cierres, pagos y suscripciones. Todo lo demás sigue igual de restringido para el resto de usuarios.

### 2. Nueva sección "Inmobiliarias" en administración
Listado de todas las empresas con: nombre, dueño, plan contratado y estado de pago, número de asesores, proyectos y unidades publicadas, ventas y comisiones del mes, última actividad. Al abrir una empresa: ficha con su equipo, sus proyectos, su consumo de plan y sus pagos, con acciones de cambiar plan, suspender, reactivar y ver su panel tal como lo ve ella.

### 3. Gestión de usuarios más completa
Sobre la pantalla actual de usuarios: filtros por rol, empresa, plan y estado; ver a qué empresa pertenece cada persona; asignar o quitar roles; mover una persona de empresa; y el historial de acciones en auditoría. Se mantienen invitar, suspender, eliminar y restablecer contraseña.

### 4. Panel de plataforma real
El panel de administración pasa a mostrar el estado verdadero del negocio: empresas activas y nuevas del mes, ingresos por suscripciones, unidades publicadas, ventas y comisiones de toda la plataforma, aprobaciones pendientes y tickets abiertos. Un solo origen de cálculo para que nunca haya dos cifras distintas del mismo dato.

### 5. Consolidación del menú de plataforma
Agrupar administración en cinco bloques estables: Principal, Empresas y usuarios, Aprobaciones, Finanzas, Sistema. Sin rutas sueltas ni duplicadas, y con el selector Inmobiliaria ↔ Plataforma que ya existe.

## Orden de trabajo

1. Permisos de super administrador en la base de datos (base de todo lo demás).
2. Sección Inmobiliarias (listado + ficha de empresa).
3. Usuarios ampliado con empresa, plan y roles.
4. Panel de plataforma con indicadores reales.
5. Reorden del menú de administración y verificación de rutas.

## Detalles técnicos

- Nueva función `public.is_platform_admin()` ya existe; se usará de forma uniforme en políticas nuevas de `organizations`, `organization_members`, `projects`, `leads`, `visits`, `reservations`, `sales_closings`, `payments`, evitando `USING (true)`.
- Las políticas de administrador serán `SELECT` salvo donde la operación lo exija (`organizations`, `subscriptions`, `user_roles` para cambio de plan/rol), y toda mutación administrativa queda registrada en `audit_logs`.
- Nuevas páginas `src/pages/admin/OrganizationsAdmin.tsx` y `src/pages/admin/OrganizationDetail.tsx`, declaradas solo en `src/routes/routeManifest.tsx` (`/admin/inmobiliarias`, `/admin/inmobiliarias/:id`) con su `seo`.
- Nuevo hook `useAdminOrganizations.ts` con una única consulta agregada por empresa; los indicadores del panel de plataforma se mueven a `usePanelToday('platform')` y a un `useAdminMetrics.ts` compartido para no duplicar cálculos.
- Verificación: `tsgo --noEmit`, `navLinks.test.ts`, build y recorrido con navegador autenticado como admin sobre `/admin/dashboard`, `/admin/inmobiliarias`, `/admin/users`.
