

# Plan: Mejoras Completas del Perfil Pro y Funciones Criticas

## Diagnóstico

El perfil actual es básico: nombre, teléfono, avatar URL (manual), contraseña y preferencias locales (no persistidas en BD). Faltan funciones criticas para un portal inmobiliario profesional.

### Problemas detectados

| Problema | Detalle |
|----------|---------|
| Avatar solo por URL | No hay upload de imagen, el usuario debe pegar un link |
| Preferencias no persistidas | Notificaciones, moneda, idioma son `useState` local, se pierden al recargar |
| Sin resumen de actividad | No se muestra cuántos favoritos, reservas, leads o créditos tiene el usuario |
| Sin badge de plan/rol | El perfil no muestra si es buyer/agent/admin ni su plan actual |
| Sin acceso rápido a Mi Terreno | No hay link contextual desde perfil a reservas activas |
| Perfil no integrado en DashboardLayout | La página `/profile` no usa el sidebar, se siente desconectada |

---

## Cambios Propuestos

### 1. Upload de Avatar con Storage

**Archivo:** `src/components/profile/PersonalInfoTab.tsx`
- Reemplazar el campo "URL de Avatar" por un botón de upload que suba la imagen al storage del backend (bucket `avatars`)
- Preview en tiempo real del avatar seleccionado
- Compresión client-side antes de subir (max 500KB)

**Migración:** Crear bucket `avatars` con política pública de lectura

### 2. Card de Resumen de Cuenta en Perfil

**Archivo:** `src/pages/Profile.tsx`
- Agregar sección entre avatar y tabs con cards de estadísticas:
  - Favoritos guardados (count de `favorites`)
  - Reservas activas (count de `reservations` del usuario)
  - Créditos activos (count de `credits` donde `buyer_user_id = user.id`)
  - Plan actual (badge con nombre del plan desde `subscriptions`)
  - Rol (badge buyer/agent/admin desde `user_roles`)
- Links rápidos a cada sección

### 3. Persistir Preferencias en Base de Datos

**Migración:** Agregar columnas a `profiles`:
- `preferred_currency TEXT DEFAULT 'CLP'`
- `preferred_language TEXT DEFAULT 'es'`
- `email_notifications BOOLEAN DEFAULT true`
- `new_listing_alerts BOOLEAN DEFAULT true`
- `price_drop_alerts BOOLEAN DEFAULT true`
- `marketing_emails BOOLEAN DEFAULT false`

**Archivos:**
- `src/components/profile/PreferencesTab.tsx` - Leer y guardar en BD via `updateProfile`
- `src/hooks/useProfile.ts` - Extender interface `Profile` y `ProfileUpdate` con los nuevos campos

### 4. Perfil dentro del DashboardLayout para Agents

**Archivo:** `src/App.tsx`
- Agregar ruta `/asesor/profile` que renderiza Profile dentro de `DashboardLayout`
- El `/profile` público sigue existiendo para buyers sin sidebar

### 5. Mejora Visual del Perfil

**Archivo:** `src/pages/Profile.tsx`
- Header con gradient y avatar más grande
- Grid de stats con iconos y colores por categoría
- Badge de verificación de email (si el email está confirmado)
- Indicador visual del plan (free = gris, starter = azul, growth = verde, etc.)

---

## Resumen de Archivos

| Archivo | Cambio |
|---------|--------|
| `src/pages/Profile.tsx` | Stats cards, badges rol/plan, visual upgrade |
| `src/components/profile/PersonalInfoTab.tsx` | Upload de avatar con storage |
| `src/components/profile/PreferencesTab.tsx` | Persistir preferencias en BD |
| `src/hooks/useProfile.ts` | Extender con campos de preferencias |
| `src/App.tsx` | Ruta `/asesor/profile` con DashboardLayout |
| **Migración SQL** | Columnas de preferencias en `profiles`, bucket `avatars` |

## Orden de Implementación

1. Migración BD (columnas + storage bucket)
2. Upload de avatar
3. Stats cards y badges en perfil
4. Persistencia de preferencias
5. Ruta `/asesor/profile` en dashboard

