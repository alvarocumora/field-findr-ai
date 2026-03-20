

# Plan de Mejoras Reales de la Plataforma

## Diagnóstico

Tras revisar la plataforma completa, identifico mejoras en 5 áreas concretas que impactan la experiencia real del usuario y la operación del negocio.

---

## Mejora 1: Onboarding Post-Registro con Asignación de Rol

**Problema:** Al registrarse, el usuario selecciona "buyer" o "agent" en el form pero no se crea el registro en `user_roles`. El rol solo está en `user_metadata` y `useUserRoles` consulta la tabla `user_roles`, lo que significa que el redirect post-login no funciona correctamente.

**Solución:**
- Crear un trigger de base de datos `on_auth_user_created` que inserte automáticamente en `user_roles` basándose en `raw_user_meta_data->account_type`
- Agregar un OnboardingWizard compacto (ya existe el archivo pero verificar que esté conectado) que se muestre al primer login para completar perfil y confirmar rol

**Archivos:**
- Migración SQL: trigger `handle_new_user_role`
- `src/pages/Auth.tsx`: verificar flujo post-signup

---

## Mejora 2: Dashboard Asesor con KPIs Reales y Acciones Rápidas

**Problema:** El dashboard del asesor (`DashboardAsesor`) carga datos pero las acciones rápidas no tienen rutas conectadas y los KPIs no reflejan datos del mes actual de forma precisa (el `conversionRate` divide ventas del mes entre total de lotes, no es representativo).

**Solución:**
- Corregir cálculo de conversión: `(vendidos + reservados) / total * 100`
- Conectar QuickActions con rutas reales (`/asesor/projects`, `/asesor/leads`, etc.)
- Agregar widget de "Próximos seguimientos" mostrando leads con `next_follow_up` cercano

**Archivos:**
- `src/hooks/useDashboardData.ts`: corregir fórmula KPI
- `src/components/dashboard/QuickActions.tsx`: conectar navegación
- `src/components/Dashboard.tsx`: agregar sección de seguimientos pendientes

---

## Mejora 3: Flujo Completo de Creación de Proyecto → Publicación

**Problema:** El wizard de 8 pasos funciona pero al crear un proyecto el `status` default es `'active'` y los lotes se crean sin `price` ni `polygon`. El proyecto aparece en la vista pública sin lotes configurados, dando mala impresión.

**Solución:**
- Cambiar default a `status: 'draft'` hasta que el usuario confirme que el proyecto está listo
- Agregar validación: no permitir cambiar a `'active'` si no hay al menos 1 lote con precio
- En `ProjectsManagement`, mostrar badge "Borrador" y botón "Publicar" que valide requisitos mínimos
- Actualizar la query pública de `ProjectDetail` para solo mostrar proyectos `active`

**Archivos:**
- Migración SQL: cambiar default de `projects.status` a `'draft'`
- `src/components/ProjectsManagement.tsx`: agregar flujo de publicación
- `src/components/projects/CreateProjectWizard.tsx`: ajustar status inicial
- `src/pages/ProjectDetail.tsx`: ya filtra por active en RLS, verificar

---

## Mejora 4: Sidebar Colapsable con Categorías y Contadores Reales

**Problema:** El sidebar tiene 22 items de navegación para agentes, todos al mismo nivel. Es abrumador y difícil de navegar. Los contadores de `useSidebarCounts` solo muestran 3 métricas.

**Solución:**
- Agrupar items en categorías colapsables: Operaciones (Dashboard, Proyectos, Lotes), Comercial (Leads, Ventas, Pipeline, Reservas), Finanzas (Créditos, Pagos, Financiero), Analytics (Multi-Proyecto, Reportes, Rendimiento, Ejecutivo), Configuración (Enterprise, API, Notificaciones)
- Agregar contadores dinámicos a Leads (nuevos), Reservas (pendientes), Pagos (vencidos)
- Highlight visual del grupo activo

**Archivos:**
- `src/components/ModernSidebar.tsx`: reestructurar con grupos colapsables

---

## Mejora 5: Página de Proyecto Público con Descripción y Galería Prominente

**Problema:** La página `ProjectDetail` abre directamente en la tab "Mapa" pero no muestra la descripción del proyecto ni fotos en un lugar visible. Un comprador llega y no entiende qué es el proyecto.

**Solución:**
- Agregar sección hero bajo el header con: descripción del proyecto (si existe), galería de imágenes (carousel compacto), y highlights (total área, servicios, ubicación)
- Mover la galería fuera de la tab "Info" a una posición visible antes de las tabs
- Si no hay descripción ni imágenes, no mostrar la sección (graceful degradation)

**Archivos:**
- `src/pages/ProjectDetail.tsx`: agregar sección hero con descripción + galería antes de tabs

---

## Resumen de Cambios

| Archivo | Acción |
|---------|--------|
| Migración SQL | Trigger `handle_new_user_role`, default status `draft` |
| `src/components/ModernSidebar.tsx` | Grupos colapsables |
| `src/hooks/useDashboardData.ts` | Fix KPI conversión |
| `src/components/Dashboard.tsx` | Seguimientos pendientes |
| `src/components/dashboard/QuickActions.tsx` | Conectar rutas |
| `src/components/ProjectsManagement.tsx` | Flujo borrador/publicar |
| `src/components/projects/CreateProjectWizard.tsx` | Status draft |
| `src/pages/ProjectDetail.tsx` | Hero con descripción + galería |

