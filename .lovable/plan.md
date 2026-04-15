

# Plan: Consolidacion y Mejora de OFERTATERRENOS.COM

## Estado Actual

La plataforma ya tiene implementado el **85-90%** de lo solicitado:
- Home premium con globe 3D, scrollytelling, ValueProposition, InvestmentShowcase, AgentCTA
- Explorador split-view con mapa Mapbox, filtros, scroll infinito
- Ficha de propiedad con galeria, mapa, contacto, IA, PDF, favoritos
- Dashboard de agentes con CRM, leads, proyectos, lotes, analytics, pipeline, creditos, reservas
- Panel admin con aprobaciones, usuarios, documentos, audit log
- Comparador de propiedades (hasta 4)
- Auth con roles (buyer/agent/admin), suscripciones, pagos
- Blog (placeholder), Pricing, Tools, Quiz, Referidos
- PWA, SEO dinamico, multi-moneda, edge functions

Lo que falta o necesita mejora concreta:

## Cambios Propuestos

### 1. Seccion "Categorias Destacadas" en Landing (NUEVO)
Crear componente `CategoryShowcase.tsx` con cards visuales para los tipos de terreno:
- Parcelas de agrado, Terrenos rurales, Campos agricolas, Fundos, Sitios industriales, Panos urbanos, Terrenos logisticos, Terrenos energeticos, Terrenos mineros, Oportunidades de inversion
- Cada card con icono, nombre, conteo real de listings de ese tipo, y link a `/explorar?type=X`
- Insertar en `Index.tsx` despues del ConversationalSearch

**Archivo**: `src/components/landing/CategoryShowcase.tsx`, `src/pages/Index.tsx`

### 2. Pagina "Oportunidades" dedicada (NUEVO)
Crear `/oportunidades` como pagina premium que muestre listings filtrados por: featured=true, precio atractivo, gran superficie, tags de inversion.
- Diseno tipo "marketplace de deals" con cards grandes, etiquetas de oportunidad, scoring de inversion
- Filtros rapidos por tipo de oportunidad (agricola, industrial, energetica, logistica)

**Archivo**: `src/pages/Oportunidades.tsx`, ruta en `App.tsx`

### 3. Navegacion actualizada
Cambiar nav publica a: Inicio | Buscar Terrenos | Oportunidades | Publicar | Corredores (=pricing) | Blog | Ingresar
- Agregar link "Oportunidades" apuntando a `/oportunidades`
- Renombrar "Explorar" a "Buscar Terrenos"

**Archivo**: `src/components/navigation/StickyHeader.tsx`

### 4. Seccion "Insights / Tendencias" en Landing (NUEVO)
Crear componente `MarketInsights.tsx` con 3-4 cards editoriales estaticas:
- "Tendencias del mercado de terrenos 2026"
- "Guia para invertir en terrenos rurales"
- "Las regiones con mayor plusvalia"
- CTA a `/blog`

**Archivo**: `src/components/landing/MarketInsights.tsx`, insertar en `Index.tsx`

### 5. Mejora de la ficha de propiedad
Agregar bloques faltantes al `PropertyDetail.tsx`:
- "Potencial del terreno" (basado en tags y zoning)
- "Ideal para" (chips derivados del tipo y atributos)
- "Proyeccion de valor" (mini chart si hay price_history)
Estos son bloques visuales adicionales, no cambios estructurales.

**Archivo**: `src/pages/PropertyDetail.tsx`

### 6. Filtros avanzados de terreno en Explorador
Agregar al panel de filtros:
- Aptitud del terreno (agricola, industrial, logistico, energetico, residencial)
- Acceso a caminos (si/no)
- Disponibilidad de agua (si/no)
- Condicion legal (al dia, en tramite, con restricciones)
Estos filtros operan client-side sobre los campos `utilities`, `tags` y `legal_status` existentes.

**Archivo**: `src/components/explore/ExploreListPanel.tsx` (filtros UI)

### 7. Blog con contenido inicial
Reemplazar el placeholder actual con 4-6 articulos estaticos editoriales que comuniquen autoridad en el nicho.

**Archivo**: `src/pages/Blog.tsx`

## Archivos a Crear
- `src/components/landing/CategoryShowcase.tsx`
- `src/components/landing/MarketInsights.tsx`
- `src/pages/Oportunidades.tsx`

## Archivos a Modificar
- `src/pages/Index.tsx` — agregar CategoryShowcase y MarketInsights
- `src/App.tsx` — ruta `/oportunidades`
- `src/components/navigation/StickyHeader.tsx` — nav actualizada
- `src/pages/PropertyDetail.tsx` — bloques "Potencial" e "Ideal para"
- `src/components/explore/ExploreListPanel.tsx` — filtros de aptitud
- `src/pages/Blog.tsx` — contenido editorial real

## Sin Cambios
- No se tocan dashboards, backend, base de datos ni edge functions
- Todo es frontend, componentes nuevos y mejoras visuales
- No se requieren migraciones SQL

