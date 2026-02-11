

# Plan: Reestructurar Sistema de Rutas, Perfiles y Accesos como SaaS Profesional

## Problema Actual

El sistema tiene rutas desorganizadas, accesos inconsistentes y navegacion que no diferencia claramente entre los 3 perfiles de usuario. Hay rutas duplicadas (/favorites y /favoritos), componentes legacy sin layout consistente, y la navegacion post-login no redirige al dashboard correcto segun el rol del usuario.

## Arquitectura de Perfiles Propuesta

```text
+------------------+     +------------------+     +------------------+
|    COMPRADOR     |     |      AGENTE      |     |   ADMIN          |
|    (buyer)       |     |    (agent)       |     |  (admin)         |
+------------------+     +------------------+     +------------------+
| /explorar        |     | /asesor/dashboard|     | /admin/dashboard |
| /favoritos       |     | /asesor/listings |     | /admin/users     |
| /mi-terreno      |     | /asesor/leads    |     | /admin/listings  |
| /profile         |     | /asesor/projects |     | /admin/analytics |
|                  |     | /asesor/lots     |     | /admin/security  |
|                  |     | /asesor/analytics|     |                  |
|                  |     | /asesor/crm      |     |                  |
|                  |     | /publish         |     |                  |
+------------------+     +------------------+     +------------------+
```

## Cambios a Implementar

### 1. Smart Redirect post-login

Modificar `Auth.tsx` para que al hacer login, redirija automaticamente segun el rol:
- **buyer** -> `/explorar` (o redirect param)
- **agent** -> `/asesor/dashboard`
- **admin** -> `/admin/dashboard`

Crear un hook `useSmartRedirect` que consulte `user_roles` y determine la ruta correcta.

### 2. Reestructurar Rutas en App.tsx

Limpiar y agrupar las rutas con namespaces claros:

**Publicas (sin auth):**
- `/` - Landing
- `/explorar` - Mapa exploracion
- `/propiedad/:id` - Detalle propiedad
- `/proyecto/:id` - Detalle proyecto
- `/pricing` - Precios
- `/auth` - Login/Registro
- `/tools` - Herramientas publicas
- `/search` - Busqueda IA

**Comprador (auth requerido):**
- `/favoritos` - Favoritos (eliminar duplicado `/favorites`)
- `/mi-terreno` - Portal del comprador
- `/profile` - Mi perfil
- `/subscription` - Mi suscripcion

**Agente (auth + role agent o premium):**
- `/asesor/dashboard` - Dashboard del agente
- `/asesor/listings` - Inventario de propiedades (renombrar /inventory)
- `/asesor/leads` - CRM Leads (renombrar /leads)
- `/asesor/projects` - Gestion de proyectos (renombrar /projects)
- `/asesor/lots` - Gestion de lotes (renombrar /lots)
- `/asesor/analytics` - Analytics (renombrar /analytics)
- `/asesor/crm` - CRM avanzado (renombrar /crm)
- `/asesor/sales` - Ventas (renombrar /sales)
- `/publish` - Publicar propiedad

**Admin (auth + role admin):**
- `/admin/dashboard` - Panel admin
- `/admin/users` - Gestion usuarios
- `/admin/agents` - Gestion agentes (renombrar /agents)

### 3. Layout Inteligente por Rol

Crear un `DashboardLayout` que envuelva todas las rutas de gestion (/asesor/*, /admin/*) con el sidebar contextual. Las rutas publicas y de comprador usan `PublicLayout` (sin sidebar, con StickyHeader).

Modificar `ModernSidebar.tsx` para mostrar navegacion contextual:
- Si es agente: mostrar menu de agente
- Si es admin: mostrar menu de admin con seccion extra de administracion

### 4. Mejorar ProtectedRoute

Actualizar `ProtectedRoute` para soportar multiples roles y manejar la carga de roles correctamente (actualmente no espera a que los roles carguen antes de evaluar acceso).

### 5. Navegacion Contextual en StickyHeader

Actualizar el header publico para mostrar accesos inteligentes segun rol:
- **Sin auth**: Explorar, Precios, Ingresar
- **Buyer**: Explorar, Favoritos, Mi Terreno, avatar dropdown
- **Agent**: Explorar, Mi Dashboard, Publicar, avatar dropdown
- **Admin**: Explorar, Panel Admin, avatar dropdown

El dropdown del avatar mostrara opciones relevantes al rol del usuario.

### 6. Eliminar Rutas y Componentes Legacy

Remover las rutas huerfanas que duplican funcionalidad:
- `/favorites` (usar solo `/favoritos`)
- `/compare` (duplicado de `/comparar`)
- `/calculators`, `/price-predictor`, `/risk-analysis`, `/ai-recommendations` (consolidar en `/tools`)
- `/urbanization` (mover a `/asesor/projects`)

### 7. Onboarding Post-Registro

Agregar seleccion de perfil en el flujo de registro: "Soy comprador" o "Soy corredor/desarrollador". Si elige corredor, redirigir a `/pricing` para elegir plan. Si elige comprador, redirigir a `/explorar`.

## Detalles Tecnicos

### Hook useSmartRedirect
```text
useSmartRedirect()
  -> Lee user_roles del usuario
  -> Retorna la ruta de dashboard correcta
  -> Prioridad: admin > agent > buyer
  -> Fallback: /explorar
```

### DashboardLayout (nuevo componente)
```text
DashboardLayout
  -> Wrapper con ModernSidebar contextual
  -> Lee rol del usuario y adapta menu
  -> Responsive con hamburger mobile
  -> Breadcrumbs de navegacion
```

### Archivos a crear:
- `src/hooks/useSmartRedirect.ts`
- `src/components/layouts/DashboardLayout.tsx`

### Archivos a modificar:
- `src/App.tsx` - Reestructurar todas las rutas
- `src/pages/Auth.tsx` - Smart redirect post-login + seleccion de perfil
- `src/components/auth/ProtectedRoute.tsx` - Esperar carga de roles
- `src/components/ModernSidebar.tsx` - Navegacion contextual por rol
- `src/components/navigation/StickyHeader.tsx` - Menu contextual por rol
- `src/hooks/useUserRole.ts` - Agregar utilidades de redirect

### Archivos a eliminar:
- Rutas duplicadas consolidadas (no archivos, solo rutas en App.tsx)

## Resultado Final

Un sistema SaaS profesional donde cada tipo de usuario tiene una experiencia personalizada, con rutas limpias bajo namespaces claros, navegacion contextual, y un flujo de acceso que guia naturalmente al usuario segun su perfil y suscripcion.

