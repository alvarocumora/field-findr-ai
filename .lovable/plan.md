# Plan de mejoras: Dashboard, Perfil, Usuarios y otras secciones

Divido el trabajo en 4 fases entregables por separado. Cada fase se puede revisar y publicar independientemente.

---

## Fase 1 — Dashboard admin

**Objetivo:** que los KPIs sean interactivos, comparables y navegables.

- Selector de rango de fechas en `DashboardHeader` (Hoy / 7d / 30d / 90d / YTD / Custom con `Calendar`).
- Extender `useDashboardKPIs` / `useSalesChartData` para aceptar `{ from, to }` y calcular **% vs periodo anterior** (comparativa real, no placeholder).
- Saludo dinámico según rol (Admin / Asesor / Inmobiliaria) usando `useUserRoles`.
- Cablear navegación real:
  - `QuickActions` → rutas existentes (`/asesor/listings/new`, `/asesor/leads`, `/asesor/reservations`).
  - `PropertyInsights.onViewProperty(id)` → `/propiedad/:id`, `onViewAll` → `/asesor/listings`.
- Skeleton unificado y estado vacío con CTA cuando no hay ventas.

**Archivos:** `src/components/Dashboard.tsx`, `src/components/dashboard/DashboardHeader.tsx`, `src/components/dashboard/QuickActions.tsx`, `src/components/dashboard/PropertyInsights.tsx`, `src/hooks/useDashboardData.ts`.

---

## Fase 2 — Perfil

**Objetivo:** perfil real, con avatar, rol visible y preferencias que persistan.

- **Avatar:** componente `AvatarUploader` que sube al bucket `avatars` (ya existe, público) en path `${user.id}/avatar.{ext}`, con RLS de owner y actualiza `profiles.avatar_url`.
- **Badge de rol** junto al nombre (Comprador / Asesor / Admin) + CTA "Convertirme en asesor" que redirige a `/pricing` si es buyer.
- **PreferencesTab:** agregar columnas `language`, `currency`, `notifications_email`, `notifications_push` a `profiles` (migración) y persistirlas.
- **SecurityTab:** cambio de email (`supabase.auth.updateUser`), cerrar sesión en todos los dispositivos, toggle 2FA (informativo si no está habilitado a nivel proyecto).

**Archivos:** `src/pages/Profile.tsx`, `src/components/profile/PersonalInfoTab.tsx`, `src/components/profile/SecurityTab.tsx`, `src/components/profile/PreferencesTab.tsx`, nuevo `src/components/profile/AvatarUploader.tsx`, migración de `profiles` + policy en `storage.objects`.

---

## Fase 3 — Gestión de usuarios (admin)

**Objetivo:** panel admin funcional para operar sobre la base de usuarios.

- Auditar `AdminUsers.tsx` actual y agregar lo que falte:
  - Buscador (email / nombre) + filtro por rol + orden.
  - Cambio de rol inline (buyer ↔ agent ↔ admin) usando `user_roles`.
  - Suspender/reactivar (columna `is_suspended` en `profiles` + guard en `useAuth`).
  - Drawer de detalle: listings, reservas, pagos, leads, última actividad.
  - Invitar por email (edge function `invite-user` usando `auth.admin.inviteUserByEmail`).
  - Export CSV del listado filtrado.
- Todas las acciones registradas en `audit_logs`.

**Archivos:** `src/pages/AdminUsers.tsx` (+ subcomponentes nuevos en `src/components/admin/users/`), nueva edge function `supabase/functions/invite-user/index.ts`, migración para `is_suspended`.

---

## Fase 4 — Otras secciones

**Objetivo:** pulir puntos débiles detectados.

- **Notificaciones (`/notificaciones`):** agrupar por tipo (reservas / leads / sistema), acciones inline "marcar leído" masivo, tab "no leídas".
- **Aprobaciones (`/admin/approvals`):** motivos estructurados de rechazo (enum + plantillas editables) en lugar de texto libre.
- **Auditoría (`/admin/audit`):** filtros por usuario / acción / fecha + export CSV.
- **Onboarding asesor:** widget en `DashboardAsesor` con checklist ("Completa tu perfil", "Publica tu 1ª propiedad", "Configura pagos", "Conecta WhatsApp") con % de progreso.

**Archivos:** `src/pages/NotificationCenter.tsx`, `src/components/admin/PropertyApprovalQueue.tsx`, `src/pages/dashboard/AuditLog.tsx`, `src/pages/dashboard/DashboardAsesor.tsx` + nuevo `src/components/dashboard/OnboardingChecklist.tsx`.

---

## Orden sugerido

1. **Fase 1** (dashboard) — impacto visible inmediato, sin cambios de schema.
2. **Fase 2** (perfil) — requiere 1 migración pequeña + policy de storage.
3. **Fase 3** (usuarios) — requiere migración + edge function.
4. **Fase 4** (secciones) — pulido final.

## Aspectos técnicos

- Sin cambios en `auth`, `storage.buckets` (uso `storage_update_bucket` si hace falta) ni en archivos autogenerados.
- Nuevas tablas/columnas con `GRANT` explícito + policies role-based (nunca `USING(true)`).
- Reutilizar `useSmartRedirect`, `useUserRoles`, `useTrackEvent` existentes.
- Sin tocar el hero cinemático ni el flujo de tasaciones.

## Pregunta antes de empezar

¿Arranco por **Fase 1** ya, o prefieres que ejecute las 4 fases seguidas en un solo hilo largo sin pausas para revisión?
