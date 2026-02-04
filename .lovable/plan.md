

# Plan: Dashboard Premium + Gestión de Usuarios y Paquetes

## Resumen Ejecutivo

Implementar un sistema de control de acceso basado en suscripciones que restrinja el dashboard y herramientas avanzadas solo a usuarios con planes de pago (Professional/Enterprise). Además, agregar una página de gestión de suscripción donde los usuarios puedan ver y mejorar sus paquetes, y para administradores, una sección de gestión de usuarios.

---

## Fase 1: Sistema de Rutas Protegidas

### 1.1 Crear componente ProtectedRoute

Nuevo componente que verificará:
- Autenticación del usuario
- Suscripción activa (plan de pago)
- Rol del usuario (opcional)

```text
┌─────────────────────────────────────────────────┐
│              ProtectedRoute                      │
├─────────────────────────────────────────────────┤
│ Props:                                           │
│ - requireAuth: boolean (requerir login)         │
│ - requirePremium: boolean (plan pago)           │
│ - requireRole: 'agent' | 'admin' (opcional)     │
│ - fallback: ReactNode (loading)                 │
│ - redirectTo: string (donde redirigir)          │
└─────────────────────────────────────────────────┘
```

### 1.2 Nuevo archivo: `src/components/auth/ProtectedRoute.tsx`

- Verifica autenticación con `useAuth()`
- Verifica suscripción con `useCurrentPlan()`
- Verifica roles con `useUserRoles()`
- Redirige a `/auth` si no autenticado
- Redirige a `/pricing` si no tiene plan premium
- Muestra página de acceso denegado si no tiene rol requerido

---

## Fase 2: Actualizar Rutas en App.tsx

### 2.1 Rutas que requerirán plan PREMIUM

| Ruta | Componente | Requisito |
|------|------------|-----------|
| `/dashboard` | Dashboard | Premium |
| `/inventory` | PropertyInventory | Premium |
| `/leads` | LeadManagement | Premium |
| `/analytics` | BusinessIntelligence | Premium |
| `/crm` | CRMSystem | Premium |
| `/agents` | AgentManagement | Premium + Admin |
| `/sales` | SalesManagement | Premium |
| `/projects` | ProjectsManagement | Premium |
| `/lots` | LotManagement | Premium |

### 2.2 Rutas que solo requerirán autenticación

| Ruta | Componente | Requisito |
|------|------------|-----------|
| `/favorites` | Favorites | Auth |
| `/alerts` | Alerts | Auth |
| `/profile` | Profile | Auth |
| `/publish` | PublishProperty | Auth + Agent/Admin |

### 2.3 Rutas públicas (sin cambios)

- `/`, `/explorar`, `/propiedad/:id`, `/comparar`, `/pricing`, `/auth`

---

## Fase 3: Página de Gestión de Suscripción

### 3.1 Nuevo archivo: `src/pages/Subscription.tsx`

Panel donde el usuario puede:
- Ver su plan actual y estado
- Historial de pagos
- Fecha de próximo cobro
- Botón para mejorar/cambiar plan
- Botón para cancelar suscripción

```text
┌─────────────────────────────────────────────────────────┐
│  Mi Suscripción                                          │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────┐                  │
│  │  Plan Profesional          $49.990/mes              │
│  │  ✓ Activo desde: 01 Feb 2026                        │
│  │  Próximo cobro: 01 Mar 2026                         │
│  │                                                      │
│  │  [Mejorar a Enterprise]  [Cancelar]                 │
│  └───────────────────────────────────┘                  │
│                                                          │
│  Historial de Pagos                                      │
│  ┌───────────────────────────────────┐                  │
│  │ Feb 2026  │ $49.990  │ ✓ Pagado                     │
│  │ Ene 2026  │ $49.990  │ ✓ Pagado                     │
│  └───────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

---

## Fase 4: Panel de Administración de Usuarios

### 4.1 Nuevo archivo: `src/pages/AdminUsers.tsx`

Solo accesible para usuarios con rol `admin`:
- Lista de todos los usuarios
- Ver perfil y suscripción de cada usuario
- Asignar/remover roles (buyer, agent, admin)
- Activar/desactivar cuentas
- Filtros por rol, plan, estado

### 4.2 Hook para administración

Nuevo hook `useAdminUsers` para:
- Listar usuarios (requiere función edge o política RLS de admin)
- Actualizar roles de usuarios

---

## Fase 5: Mejoras al Sidebar y Navegación

### 5.1 Actualizar ModernSidebar.tsx

- Mostrar badge del plan actual junto al perfil
- Ocultar/deshabilitar links premium para usuarios free
- Agregar indicador visual (candado) en items bloqueados
- Link a "Ver Planes" para usuarios free

```text
┌─────────────────────────────────────┐
│  🌍 Explorar Mapa                   │
│  🔍 Búsqueda IA                     │
│  ⚡ Herramientas IA                  │
│  ❤️ Mis Favoritos                   │
├─────────────────────────────────────┤
│  📊 Mi Dashboard        🔒          │
│  🏠 Mis Propiedades     🔒          │
│  👥 CRM Leads           🔒          │
│  📈 Analytics           🔒          │
├─────────────────────────────────────┤
│  👤 Mi Perfil                       │
│  ─────────────────────────          │
│  [ Plan: Gratuito ]                 │
│  [ 💎 Ver Planes Premium ]          │
└─────────────────────────────────────┘
```

---

## Fase 6: Componente de Upgrade Prompt

### 6.1 Nuevo archivo: `src/components/subscription/UpgradePrompt.tsx`

Modal/Card que aparece cuando:
- Usuario free intenta acceder a feature premium
- Se muestra en lugar del contenido bloqueado

Contenido:
- Beneficios del plan premium
- Comparación de features
- CTA para ir a /pricing

---

## Detalles Técnicos

### Archivos a Crear

1. `src/components/auth/ProtectedRoute.tsx` - Componente de rutas protegidas
2. `src/pages/Subscription.tsx` - Gestión de suscripción personal
3. `src/pages/AdminUsers.tsx` - Panel de administración de usuarios
4. `src/components/subscription/UpgradePrompt.tsx` - Modal de upgrade
5. `src/hooks/useAdminUsers.ts` - Hook para gestión de usuarios (admin)

### Archivos a Modificar

1. `src/App.tsx` - Envolver rutas premium con ProtectedRoute
2. `src/components/ModernSidebar.tsx` - Agregar badges y locks
3. `src/components/Layout.tsx` - Integrar estado de suscripción
4. `supabase/functions/` - Edge function para admin (listar usuarios)

### Base de Datos

- Crear política RLS para que admins puedan ver todos los usuarios
- Crear política RLS para que admins puedan modificar user_roles
- Ya existe la función `has_role()` que se usará

### Seguridad

- Todas las verificaciones de roles y suscripciones se harán del lado del servidor (RLS)
- El frontend solo oculta UI, pero el backend bloquea el acceso real
- Los admins solo pueden asignar roles a través de políticas RLS controladas

---

## Orden de Implementación

1. ProtectedRoute component
2. Actualizar App.tsx con rutas protegidas
3. Actualizar ModernSidebar con indicadores visuales
4. Crear página Subscription.tsx
5. Crear UpgradePrompt component
6. Crear AdminUsers.tsx + hook
7. Crear edge function para admin si es necesario

