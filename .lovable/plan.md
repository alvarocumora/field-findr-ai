

# Rediseño Estrategico: Ofertaterrenos.com como Referente Digital

## Vision

Transformar la landing page y experiencia publica de un "portal inmobiliario con features" a una **plataforma de inteligencia territorial** que comunique autoridad, sofisticacion y oportunidad de inversion. El rediseño se enfoca en la experiencia publica (lo que ve un visitante nuevo) manteniendo intacta toda la infraestructura backend y dashboards internos.

## Diagnostico Actual

La app ya tiene una base solida: globe 3D, scrollytelling, AI search, split-view explorer. Pero la landing actual se siente como una coleccion de secciones genericas (LogoCloud, HowItWorks, TrustBadges) sin narrativa clara. Falta:
- **Propuesta de valor diferenciada** (no dice POR QUE es mejor que un portal comun)
- **Social proof con datos reales** (estadisticas del negocio, no solo testimonios)
- **Captacion de corredores** (la landing no habla a profesionales)
- **Seccion de inversion** (no hay contenido para inversionistas)
- **Header con mas autoridad** (navegacion muy basica para una plataforma compleja)

## Cambios Propuestos

### 1. Hero Mejorado — CartographicHero.tsx
- Agregar un **tagline mas potente**: "Inteligencia Territorial para Invertir con Certeza"
- Agregar **3 metricas animadas** debajo del titulo (ej: "+2,400 hectareas mapeadas", "12 regiones", "$XX mil millones en inventario") usando datos reales de `useLandingStats`
- Agregar **doble CTA**: "Explorar Terrenos" (primario) + "Soy Corredor" (secundario, lleva a /pricing)
- Mejorar la tipografia del subtitulo con tracking mas refinado

### 2. Nueva Seccion — ValueProposition (nueva)
- Reemplazar la seccion HowItWorks actual con una **seccion de valor en 3 columnas** tipo "Por que Ofertaterrenos":
  - **Para Inversionistas**: Analisis de plusvalia, scoring de inversion, datos verificados SII
  - **Para Compradores**: Reserva digital, simulador financiero, 3D interactivo
  - **Para Corredores**: CRM integrado, cotizador publico, leads automaticos
- Cada columna con icono premium, titulo, 3-4 bullets y CTA contextual
- Diseño con cards glassmorphism y bordes sutiles

### 3. Nueva Seccion — InvestmentShowcase (nueva)
- Seccion dedicada a **inteligencia de inversion** con:
  - Mini mapa estatico mostrando densidad de oportunidades por region
  - 3 KPIs grandes animados: "Plusvalia promedio", "Terrenos bajo valor de mercado", "Nuevos esta semana"
  - CTA: "Ver Analisis Completo" → /explorar
- Fondo con gradiente sutil esmeralda-to-transparent

### 4. Nueva Seccion — AgentCTA (nueva)
- Seccion full-width oscura dirigida a **corredores y desarrolladores**:
  - Headline: "Vende mas rapido con inteligencia artificial"
  - 4 features inline: CRM + Lead Scoring + Cotizador Publico + Brochures IA
  - CTA prominente: "Comienza Gratis" → /auth con account_type=agent
  - Badge "Usado por +XX corredores" (dato de profiles con rol agent)

### 5. Mejora del Header — StickyHeader.tsx
- Agregar link "Para Profesionales" en la nav publica
- Cambiar "Precios" por "Planes" (mas SaaS)
- Agregar micro-badge "BETA" o "NUEVO" junto a "Herramientas IA" cuando exista esa nav
- En mobile, hacer el CTA "Explorar" mas prominente

### 6. Mejora del Footer — FooterSection.tsx
- Agregar seccion "Regiones Populares" con links a /region/valparaiso, /region/los-lagos, etc.
- Agregar seccion "Para Inversionistas" con links a /tools, /comparar, /quiz
- Agregar badge de seguridad "Datos verificados por SII"
- Agregar contador real: "XX terrenos disponibles hoy"

### 7. Mejora Estetica — index.css
- Agregar nueva clase `.section-premium` con padding generoso y fondo con noise texture sutil
- Agregar clase `.stat-counter` para los numeros grandes animados
- Refinar el gradiente hero para que sea mas cinematografico en light mode

### 8. Reorganizacion del Index — Index.tsx
Nueva estructura de la landing:
```text
CartographicHero (mejorado con stats + doble CTA)
ConversationalSearch (se mantiene)
ScrollytellingSection (proyectos activos)
ValueProposition (NUEVO - 3 columnas por audiencia)
InvestmentShowcase (NUEVO - KPIs de inversion)
AgentCTA (NUEVO - captacion de corredores)
TestimonialMarquee (se mantiene)
TrustBadges (se mantiene, con datos reales)
FloatingCTA (se mantiene)
```
Se eliminan: LogoCloud (se integra en TrustBadges), CountrySelector (se mueve al footer como links), el divider cartographic (innecesario).

## Archivos a Crear
- `src/components/landing/ValueProposition.tsx`
- `src/components/landing/InvestmentShowcase.tsx`
- `src/components/landing/AgentCTA.tsx`

## Archivos a Modificar
- `src/pages/Index.tsx` — nueva estructura
- `src/components/landing/CartographicHero.tsx` — stats + doble CTA
- `src/components/navigation/StickyHeader.tsx` — nav mejorada
- `src/components/FooterSection.tsx` — mas completo
- `src/components/landing/TrustBadges.tsx` — integrar LogoCloud
- `src/index.css` — clases premium nuevas

## Sin Cambios
- No se tocan dashboards, backend, base de datos, edge functions ni el explorador
- No se requieren migraciones SQL
- Todo es frontend, componentes nuevos y refactoring visual

