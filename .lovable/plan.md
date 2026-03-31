

# Plan Maestro Disruptivo: Experiencias por Perfil de Usuario

## Contexto

La plataforma tiene 3 roles (buyer, agent, admin) pero la experiencia post-login es genérica. El siguiente paso es crear experiencias diferenciadas y personalizadas para cada perfil, maximizando conversión para compradores, productividad para agentes, y control para admins.

---

## Fase 6: Onboarding Personalizado por Rol

### 6.1 Wizard de Onboarding Post-Registro
- Al primer login, detectar rol del usuario y mostrar un wizard de 3-4 pasos
- **Buyer**: Preferencias de búsqueda (región, presupuesto, tamaño, uso) → Guardar como `saved_searches` automática
- **Agent**: Datos de empresa, zona de operación, tipo de proyectos → Pre-configurar perfil y primer proyecto
- Guardar flag `onboarding_completed` en profiles para no repetir

**Archivos:** nuevo `src/components/onboarding/OnboardingWizard.tsx`, migración (columna `onboarding_completed` en profiles), `src/pages/Auth.tsx` (redirect post-login)

### 6.2 Dashboard de Bienvenida Contextual
- **Buyer sin reservas**: "Explora terrenos cerca de ti" + cards de proyectos destacados + búsqueda IA
- **Agent sin proyectos**: "Crea tu primer proyecto" + guía paso a paso + métricas vacías con CTA
- Reemplazar dashboards vacíos por estados empty-state con acciones claras

**Archivos:** `src/pages/dashboard/DashboardAsesor.tsx`, nuevo `src/components/dashboard/BuyerHome.tsx`

---

## Fase 7: Experiencia Buyer Premium

### 7.1 Home del Comprador
- Página `/buyer/home` con: recomendaciones IA basadas en búsquedas guardadas, proyectos visitados recientemente, alertas de precio, favoritos recientes
- Sección "Terrenos para ti" con scoring de match personalizado
- Card de estado de reserva activa (si existe) con acceso directo a Mi Terreno

**Archivos:** nuevo `src/pages/BuyerHome.tsx`, ruta en `App.tsx`

### 7.2 Historial de Actividad del Comprador
- Timeline visual de interacciones: proyectos visitados, lotes cotizados, búsquedas realizadas
- Basado en `user_events` existente
- Accesible desde perfil y desde home del comprador

**Archivo:** nuevo `src/components/buyer/ActivityTimeline.tsx`

### 7.3 Alertas Inteligentes Personalizadas
- Configurar alertas desde perfil: "Avisarme cuando haya terrenos < 30M en La Araucanía"
- Integrar con `saved_searches` + `notifications`
- Badge en bottom nav cuando hay alertas nuevas

**Archivos:** `src/components/profile/PreferencesTab.tsx`, edge function `check-saved-searches`

---

## Fase 8: Experiencia Agent Potenciada

### 8.1 Dashboard Contextual Inteligente
- KPIs que cambian según la hora: mañana = seguimientos pendientes, tarde = reservas del día, fin de mes = metas
- "Acción del día": sugerencia IA basada en datos (ej: "Contacta a María, lleva 3 días sin respuesta")
- Widget de actividad reciente de sus proyectos (nuevas vistas, favoritos, leads)

**Archivos:** `src/pages/dashboard/DashboardAsesor.tsx`

### 8.2 Vista Rápida de Proyecto desde Sidebar
- Hover en "Proyectos" del sidebar muestra mini-cards con stats de cada proyecto (lotes vendidos/disponibles)
- Click directo al proyecto sin pasar por listado

**Archivo:** `src/components/ModernSidebar.tsx`

### 8.3 Centro de Comunicaciones Unificado
- Fusionar mensajes internos + historial WhatsApp + emails enviados en un timeline por lead
- Vista tipo "inbox" con threads por lead/comprador
- Respuesta rápida con templates predefinidos

**Archivo:** `src/pages/dashboard/Messages.tsx`

---

## Fase 9: Experiencia Admin Completa

### 9.1 Panel de Control de Plataforma
- Métricas globales: usuarios activos, proyectos publicados, reservas totales, GMV (volumen bruto)
- Gráficos de tendencia semanal/mensual
- Alertas del sistema: funciones edge con errores, usuarios reportados, documentos vencidos

**Archivo:** `src/pages/dashboard/DashboardAdmin.tsx`

### 9.2 Gestión Avanzada de Agentes
- Tabla de agentes con: proyectos activos, reservas logradas, tasa de conversión, comisiones pendientes
- Acciones: activar/desactivar, asignar leads, ver rendimiento
- Comparativa entre agentes (ranking)

**Archivo:** `src/components/AgentManagement.tsx`

### 9.3 Auditoría y Seguridad
- Log de acciones críticas: cambios de precio, cancelaciones de reserva, cambios de estado
- Basado en tabla `audit_logs` existente
- Filtros por usuario, tipo de acción, fecha

**Archivo:** nuevo `src/pages/dashboard/AuditLog.tsx`, ruta admin en `App.tsx`

---

## Fase 10: Personalización Cross-Perfil

### 10.1 Notificaciones Push (PWA)
- Solicitar permiso de notificaciones push al usuario
- Enviar notificaciones para: nuevos lotes en zona de interés, pago próximo a vencer, seguimiento pendiente
- Integrar con service worker existente

**Archivo:** `src/hooks/usePWA.ts`, edge function para push

### 10.2 Modo Demo/Tour Guiado
- Para usuarios nuevos que no se registran, ofrecer "Tour de la plataforma" interactivo
- Tooltips guiados que muestran las funciones principales
- Call-to-action de registro al final del tour

**Archivo:** nuevo `src/components/onboarding/GuidedTour.tsx`

---

## Migración de BD Necesaria

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_data jsonb DEFAULT '{}';
```

---

## Resumen de Prioridad

| Prioridad | Componente | Perfil | Impacto |
|-----------|-----------|--------|---------|
| 1 | Onboarding Wizard | Todos | Muy Alto |
| 2 | Buyer Home con recomendaciones | Buyer | Alto |
| 3 | Dashboard contextual agente | Agent | Alto |
| 4 | Panel admin con métricas globales | Admin | Alto |
| 5 | Alertas personalizadas buyer | Buyer | Alto |
| 6 | Activity Timeline buyer | Buyer | Medio |
| 7 | Centro comunicaciones unificado | Agent | Medio |
| 8 | Auditoría admin | Admin | Medio |
| 9 | Notificaciones Push PWA | Todos | Medio |
| 10 | Tour guiado demo | Público | Medio |

## Archivos Nuevos

| Archivo | Descripción |
|---------|-------------|
| `src/components/onboarding/OnboardingWizard.tsx` | Wizard post-registro por rol |
| `src/pages/BuyerHome.tsx` | Home personalizado del comprador |
| `src/components/buyer/ActivityTimeline.tsx` | Historial de interacciones |
| `src/components/dashboard/BuyerHome.tsx` | Dashboard empty-state buyer |
| `src/pages/dashboard/AuditLog.tsx` | Visor de auditoría admin |
| `src/components/onboarding/GuidedTour.tsx` | Tour interactivo para visitantes |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Rutas `/buyer/home`, `/admin/audit` |
| `src/pages/Auth.tsx` | Redirect a onboarding si `!onboarding_completed` |
| `src/pages/dashboard/DashboardAsesor.tsx` | KPIs contextuales + acción del día |
| `src/pages/dashboard/DashboardAdmin.tsx` | Métricas globales de plataforma |
| `src/components/ModernSidebar.tsx` | Mini-cards de proyecto en hover |
| `src/components/profile/PreferencesTab.tsx` | Config de alertas inteligentes |
| **Migración SQL** | `onboarding_completed`, `onboarding_data` en profiles |

