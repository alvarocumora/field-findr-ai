

# Plan: Estabilización de Plataforma para Producción

## Diagnóstico

Tras auditar rutas, sidebar, layouts y flujos completos, se identifican estos problemas concretos que impiden el uso real en producción:

---

## 1. Rutas rotas en Sidebar

**Problema:** El sidebar tiene `/asesor/ventas` pero la ruta en App.tsx es `/asesor/sales`. Al hacer clic en "Ventas", se muestra 404.

**Fix:** Cambiar el href en `ModernSidebar.tsx` de `/asesor/ventas` a `/asesor/sales`.

**Archivo:** `src/components/ModernSidebar.tsx` (línea 73)

---

## 2. `LotManagement` usa `Layout` duplicado en lugar de `DashboardLayout`

**Problema:** `LotManagement.tsx` importa `Layout` (que incluye su propio sidebar + mobile header), pero ya está envuelto en `DashboardLayout` vía App.tsx. Resultado: **sidebar duplicado** y padding inconsistente. Lo mismo ocurre en la screenshot del usuario — el contenido de lotes se ve recortado.

**Fix:** Eliminar el wrapper `<Layout>` de `LotManagement.tsx` y devolver el contenido directamente, ya que `DashboardLayout` proporciona el sidebar y la estructura.

**Archivo:** `src/components/LotManagement.tsx`

---

## 3. Sidebar móvil no funciona en DashboardLayout

**Problema:** En `DashboardLayout.tsx`, el botón mobile hamburger toggle solo cambia `sidebarCollapsed` pero el sidebar está dentro de `hidden md:block`. En móvil el sidebar nunca aparece.

**Fix:** Agregar un Sheet/Drawer para la sidebar en móvil, similar a lo que hace `Layout.tsx`, que usa `Sheet` para el menú mobile.

**Archivo:** `src/components/layouts/DashboardLayout.tsx`

---

## 4. Reducir navegación para agentes nuevos

**Problema:** Un agente nuevo ve 22 items en 5 categorías. Muchos son features avanzadas (Enterprise, API Portal, Multi-Proyecto, Demanda) que solo confunden a un usuario que empieza. La plataforma se siente "desordenada" por exceso de opciones visibles.

**Fix:** Crear dos niveles de visibilidad:
- **Core** (siempre visible): Dashboard, Proyectos, Lotes, CRM Leads, Reservas, Pagos, Reportes
- **Avanzado** (colapsado por defecto bajo "Más herramientas"): Pipeline, Ventas, Cierres, Financiero, Multi-Proyecto, Rendimiento, Ejecutivo, Demanda, Enterprise, API, Notificaciones, Mensajes, Propiedades, Créditos

**Archivo:** `src/components/ModernSidebar.tsx`

---

## 5. Consistencia de iconos duplicados en Sidebar

**Problema:** `FileText` se usa para Reservas, Reportes y Documentos. Dificulta la diferenciación visual.

**Fix:** Asignar iconos únicos: Reservas → `CalendarCheck`, Reportes → `FileBarChart`.

**Archivo:** `src/components/ModernSidebar.tsx`

---

## 6. Dashboard: período selector no hace nada

**Problema:** El selector de período (Semana/Mes/Año) en `DashboardHeader` cambia el state `selectedPeriod` pero ninguna query lo consume. Es UI muerta.

**Fix:** Pasar `selectedPeriod` a `useDashboardKPIs` para filtrar los datos por rango de fecha real, o remover el selector hasta que esté implementado.

**Decisión:** Remover el selector por ahora para no confundir. Agregar un label "Este mes" estático.

**Archivo:** `src/components/Dashboard.tsx`, `src/components/dashboard/DashboardHeader.tsx`

---

## 7. QuickActions duplicado

**Problema:** Existen dos componentes `QuickActions`: `src/components/QuickActions.tsx` (landing page) y `src/components/dashboard/QuickActions.tsx` (dashboard). No es un bug funcional, pero genera confusión en mantenimiento.

**Fix:** Renombrar el de landing a `LandingQuickActions.tsx` para claridad.

**Archivos:** `src/components/QuickActions.tsx` → renombrar y actualizar imports.

---

## 8. ProjectDetail público no filtra proyectos draft

**Problema:** Un proyecto en estado `draft` es visible públicamente vía `/proyecto/:id`. Cualquier persona con el URL puede verlo, incluso si está incompleto.

**Fix:** Agregar validación en la query de `ProjectDetail.tsx`: si el proyecto es `draft` y el usuario actual no es el dueño, mostrar "Proyecto no disponible".

**Archivo:** `src/pages/ProjectDetail.tsx`

---

## Resumen de Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/ModernSidebar.tsx` | Fix ruta ventas, iconos únicos, navegación simplificada core/avanzado |
| `src/components/LotManagement.tsx` | Quitar wrapper `Layout` duplicado |
| `src/components/layouts/DashboardLayout.tsx` | Agregar Sheet mobile para sidebar |
| `src/components/Dashboard.tsx` | Remover período selector no funcional |
| `src/components/dashboard/DashboardHeader.tsx` | Simplificar header sin selector |
| `src/components/QuickActions.tsx` | Renombrar a `LandingQuickActions.tsx` |
| `src/pages/ProjectDetail.tsx` | Filtrar proyectos draft para visitantes |

## Impacto

Estos 8 cambios eliminan las rutas rotas, la UI duplicada, la sobrecarga visual del sidebar, y la exposición de datos incompletos. La plataforma queda limpia y funcional para uso real.

