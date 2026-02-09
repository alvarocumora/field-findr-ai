
# Plan de Mejora: Landing, Mapa y UI/UX + Audit de Herramientas SaaS

## Diagnostico Actual

Despues de revisar toda la plataforma, identifico estas areas criticas:

### Problemas de la Landing Actual
1. **Stats hardcodeados** (15K terrenos, $2.5B ventas) -- no reflejan datos reales
2. **Featured Listings vacios** si no hay datos en BD
3. **MiniMap con estilo dark-v11** fijo -- no respeta el tema actual (light/dark)
4. **FloatingCTA dice "15+ terrenos agregados hoy"** -- dato inventado
5. **Footer con links rotos** (search, price-predictor, risk-analysis apuntan a componentes legacy envueltos en Layout con sidebar)
6. **No hay seccion "Como Funciona"** para explicar el flujo al usuario
7. **No hay seccion de Proyectos de Loteo** como producto principal (FeaturedProjects existe pero no tiene imagenes ni preview visual atractivo)

### Problemas del Mapa
1. **MiniMap**: marcadores de 14px demasiado pequenos, popups con HTML inline y fondo blanco fijo (rompe dark mode)
2. **ExploreMap**: funcional pero sin onboarding -- usuario nuevo no sabe que hacer
3. **Sin clustering** en MiniMap cuando hay muchos markers

### Problemas de UI/UX
1. **Navigation inconsistente**: links como "Comparar", "Proyectos", "Agentes", "Blog" apuntan a rutas inexistentes o legacy
2. **PublicLayout vs Layout**: dos sistemas de layout paralelos, confuso
3. **Herramientas legacy** (Dashboard, CRM, Sales, BI) usan datos mock hardcodeados
4. **Pricing page** existe pero no conecta con el flujo de reservas

### Herramientas que faltan completar (Gap Analysis SaaS Inmobiliario)

| Herramienta | Estado | Prioridad |
|---|---|---|
| Reservas con pago | Implementado (Fase 1.1) | Listo |
| Dashboard con datos reales | Solo mock data | Alta |
| CRM/Pipeline real | Solo mock data | Alta |
| Gestion de reservas (admin view) | No existe | Alta |
| Portal del comprador (/mi-terreno) | No existe | Alta |
| Contratos PDF | No existe | Media |
| WhatsApp integration | No existe | Media |
| Landing con datos dinamicos | Parcial | Alta |
| Cotizador embebible | Parcial (FinancingCalculator) | Media |
| Analytics con datos reales | Solo mock | Media |

---

## Plan de Implementacion

### Parte 1: Landing Page Premium (Impacto inmediato)

**1.1 Hero Section mejorado**
- Reemplazar stats hardcodeados por consulta real a la BD (count de listings, projects, lots)
- Agregar seccion "Video/Demo" o animacion del mapa como background sutil
- Mejorar copy para enfocarse en el valor para **desarrolladores de loteos** (no solo compradores)

**1.2 Seccion "Como Funciona"**
- Nueva seccion con 3-4 pasos: "Sube tu proyecto" -> "Configura tus lotes" -> "Recibe reservas" -> "Cierra ventas"
- Iconos animados y layout horizontal en desktop, vertical en mobile

**1.3 FeaturedProjects mejorado**
- Agregar imagen del master plan o primera imagen de galeria del proyecto
- Mostrar barra de progreso visual (% vendido)
- Precio desde (min lot price)
- CTA mas prominente

**1.4 Stats dinamicos**
- Query real: total listings activos, total proyectos, total lotes disponibles, total reservas pagadas
- Fallback a valores por defecto si no hay datos

**1.5 Footer funcional**
- Corregir links rotos
- Remover links a paginas que no existen
- Agregar link a /pricing

### Parte 2: Mejoras del Mapa

**2.1 MiniMap mejorado**
- Marcadores mas grandes (20px) con animacion de pulso
- Popups que respeten el tema (dark/light)
- Clustering cuando hay mas de 20 markers
- Estilo del mapa segun tema: light-v11 en light mode, dark-v11 en dark mode

**2.2 ExploreMap con onboarding**
- Tooltip inicial: "Arrastra para explorar, haz clic en un marcador para ver detalles"
- Boton "Buscar en esta area" mas visible
- Animacion de entrada suave para markers

### Parte 3: Navegacion y UI/UX

**3.1 StickyHeader limpio**
- Remover links a rutas que no funcionan (Comparar, Agentes, Blog)
- Agregar link "Proyectos" que apunte a la seccion de proyectos en landing o a /explorar
- Agregar "Precios" como link publico
- Separar claramente navegacion publica vs autenticada

**3.2 Mobile-first refinements**
- Asegurar que la landing sea fluida en mobile
- Botones de 44px minimo en toda la app
- Mejorar spacing y readability en ListingCard para mobile

### Parte 4: Dashboard con Datos Reales

**4.1 Dashboard principal**
- Reemplazar KPIs mock por queries reales:
  - Total ventas (lots con status 'sold' y sus precios)
  - Reservas activas (de tabla reservations)
  - Leads en pipeline (de tabla leads)
  - Lotes disponibles vs total
- Grafico de ventas por mes real
- Feed de actividad real (ultimas reservas, leads, cambios de estado)

**4.2 Vista de Reservas para Admin**
- Nueva pagina/componente: lista de reservas con estados
- Filtros por proyecto, estado (pending, paid, expired)
- Acciones: confirmar pago manual, cancelar, extender plazo

---

## Detalles Tecnicos

### Archivos a modificar:
- `src/pages/Index.tsx` -- Landing restructurada
- `src/components/landing/HeroStats.tsx` -- Stats dinamicos desde BD
- `src/components/landing/FeaturedProjects.tsx` -- Cards con imagenes y progreso
- `src/components/map/MiniMap.tsx` -- Theme-aware, markers mejorados, clustering
- `src/components/navigation/StickyHeader.tsx` -- Links corregidos
- `src/components/FooterSection.tsx` -- Links funcionales
- `src/components/landing/FloatingCTA.tsx` -- Dato dinamico o remover texto falso
- `src/components/Dashboard.tsx` -- Conectar a datos reales

### Archivos nuevos:
- `src/components/landing/HowItWorks.tsx` -- Seccion de pasos
- `src/components/landing/ProjectShowcase.tsx` -- Showcase mejorado de proyectos
- `src/components/reservations/ReservationsManager.tsx` -- Admin de reservas
- `src/hooks/useLandingStats.ts` -- Hook para stats dinamicos

### Queries de BD necesarias:
```sql
-- Stats para landing
SELECT COUNT(*) as total_listings FROM listings WHERE status = 'active';
SELECT COUNT(*) as total_projects FROM projects WHERE status = 'active';
SELECT COUNT(*) as total_lots FROM lots;
SELECT COUNT(*) as total_reservations FROM reservations WHERE status = 'paid';
```

### Orden de implementacion sugerido:
1. Landing Page (stats, how it works, featured projects mejorado, footer)
2. MiniMap y navegacion
3. Dashboard con datos reales
4. Reservations Manager

Este plan prioriza el impacto visual e inmediato (landing) y luego avanza hacia la funcionalidad operativa (dashboard, reservas).
