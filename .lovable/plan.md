

# Plan: Consolidación Disruptiva del Portal -- Expansión y Mejoras Integrales

## Diagnóstico Rápido

La plataforma tiene ~50 rutas, 3 roles, herramientas IA, CRM, tours 360, diseñador 3D, y PWA. Sin embargo hay fragmentación: componentes duplicados, footer con links muertos (`#`), falta de cohesión entre flujos buyer/agent, y oportunidades de engagement sin explotar.

---

## Fase A: Consolidación de Navegación y Footer (Limpieza)

### A.1 Footer Completo con Links Reales
**Archivo:** `src/components/FooterSection.tsx`
- Reemplazar todos los `href: '#'` por rutas reales o páginas stub
- Agregar links funcionales: Herramientas (`/tools`), Instalar App (`/instalar`), Blog (stub `/blog`)
- Agregar sección "Para Profesionales" con links a `/pricing` y `/auth`

### A.2 Página Blog Stub
**Archivo:** nuevo `src/pages/Blog.tsx`
- Página mínima con layout, titulo, y empty state "Próximamente"
- Ruta `/blog` en `App.tsx`

---

## Fase B: Mejora del Flujo Buyer (Engagement + Retención)

### B.1 Buyer Dashboard Mejorado con Recomendaciones IA
**Archivo:** `src/pages/BuyerHome.tsx`
- Agregar sección "Recomendados para ti" que usa `saved_searches` + listings activos para match scoring
- Mostrar proyectos con `available_lots > 0` ordenados por relevancia
- Card de "Precio reducido" para listings con entradas recientes en `price_history`

### B.2 Alertas de Precio en Tiempo Real
**Archivo:** nuevo `src/components/buyer/PriceAlertCard.tsx`
- Componente que muestra listings donde el precio bajó en los últimos 7 días
- Query a `price_history` + join con `listings`
- Integrar en `BuyerHome.tsx`

### B.3 Quick Actions Contextuales para Buyer
**Archivo:** `src/pages/BuyerHome.tsx`
- Agregar grid de acciones rápidas: "Explorar Mapa", "Mis Favoritos", "Comparar Terrenos", "Simular Crédito"
- Cada acción navega a la ruta correspondiente

---

## Fase C: Dashboard Agent -- Widgets de Productividad

### C.1 Widget "Oportunidades Calientes"
**Archivo:** `src/pages/dashboard/DashboardAsesor.tsx`
- Sección que muestra los 3 leads con mayor `lead_score` que no han sido contactados en 48h+
- Botón "Contactar ahora" que abre WhatsApp con template contextual

### C.2 Mini-Resumen de Proyecto en Dashboard
**Archivo:** `src/pages/dashboard/DashboardAsesor.tsx`
- Grid compacto de proyectos activos mostrando: nombre, progress bar (vendidos/total), ingresos acumulados
- Click navega al detalle del proyecto

### C.3 Notificaciones Inline en Dashboard
**Archivo:** `src/pages/dashboard/DashboardAsesor.tsx`
- Mostrar últimas 3 notificaciones no leídas como cards dismissibles
- Link a `/asesor/notifications` para ver todas

---

## Fase D: Herramientas IA Consolidadas

### D.1 Centro de Herramientas Reorganizado
**Archivo:** `src/pages/Tools.tsx`
- Reorganizar tabs en categorías claras: "IA" (Chat, Predictor, Búsqueda), "Financiero" (Calculadoras, Comparador), "Datos" (SII, Catastro)
- Agregar descripción breve en cada tab para guiar al usuario
- Agregar acceso al Story Generator desde Tools para agents

### D.2 Story Generator Accesible desde Tools
**Archivo:** `src/pages/Tools.tsx`
- Agregar tab "Social" (solo para agents) con el `StoryGenerator` existente
- Permite generar contenido visual sin salir del centro de herramientas

---

## Fase E: Mejoras de Experiencia Global

### E.1 Empty States Profesionales
**Archivos:** `src/pages/Favorites.tsx` (componente Favorites), `src/pages/MiTerreno.tsx`
- Cuando no hay datos, mostrar ilustración + CTA contextual
- Favoritos vacío: "Explora terrenos y guarda tus favoritos" → link a `/explorar`
- Mi Terreno sin reservas: "Aún no tienes un terreno" → link a `/explorar`

### E.2 Breadcrumbs en Páginas de Detalle
**Archivo:** `src/pages/ProjectDetail.tsx`, `src/pages/PropertyDetail.tsx`
- Agregar breadcrumb: Home > Explorar > Proyecto X
- Mejora SEO y navegación

### E.3 Skeleton Loading Consistente
**Archivos:** varios dashboards
- Asegurar que todas las páginas de dashboard usen skeletons consistentes durante carga
- Patrón: `KPICard` skeleton (4 cards) + chart skeleton

---

## Fase F: Mejoras Técnicas de Consolidación

### F.1 Tracking de Eventos de Usuario
**Archivo:** nuevo `src/hooks/useTrackEvent.ts`
- Hook reutilizable: `useTrackEvent()` que inserta en `user_events`
- Integrar en: vista de proyecto, vista de lote, búsqueda, favorito
- Base para recomendaciones IA y lead scoring futuro

### F.2 SEO Meta Tags Dinámicos
**Archivo:** `src/hooks/useSEO.ts` (ya existe)
- Verificar que `ProjectDetail` y `PropertyDetail` setean title/description dinámicos
- Agregar Open Graph tags para compartir en redes sociales

---

## Resumen de Archivos

| Archivo | Cambio |
|---------|--------|
| `src/components/FooterSection.tsx` | Links reales, nueva sección Pro |
| `src/pages/Blog.tsx` | **Nuevo** - Stub page |
| `src/pages/BuyerHome.tsx` | Recomendaciones IA, price alerts, quick actions |
| `src/components/buyer/PriceAlertCard.tsx` | **Nuevo** - Alertas de precio |
| `src/pages/dashboard/DashboardAsesor.tsx` | Widgets oportunidades, mini-proyectos, notifs |
| `src/pages/Tools.tsx` | Reorganizar tabs, agregar Social/Story |
| `src/pages/MiTerreno.tsx` | Empty states mejorados |
| `src/pages/ProjectDetail.tsx` | Breadcrumbs |
| `src/hooks/useTrackEvent.ts` | **Nuevo** - Hook de tracking |
| `src/App.tsx` | Ruta `/blog` |

## Prioridad de Implementación

1. Footer + Blog stub (limpieza inmediata)
2. Event tracking hook (base para todo lo demás)
3. Buyer Home mejorado + Price Alerts
4. Dashboard Agent widgets
5. Tools reorganizado
6. Empty states + Breadcrumbs

## Sin Migraciones de BD

Todos los datos necesarios ya existen en las tablas actuales (`user_events`, `price_history`, `leads`, `notifications`, `saved_searches`). No se requieren cambios de esquema.

