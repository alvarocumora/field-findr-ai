## Hallazgos de la auditoría

Recorrí `/` en el preview y detecté:

1. **Hero (`CartographicHero`)** — El título "OFERTA / TERRENOS" ocupa demasiado espacio vertical y se solapa con el globo. Los KPIs sobre el hero muestran "31+ hectáreas · 1 región · 1+ proyectos" — números débiles que dañan credibilidad. No hay propuesta de valor concreta arriba del pliegue.
2. **Meta / SEO en `index.html`** — Título genérico "Ofertaterrenos.com - Terrenos con IA", description promocional sin keywords ("plataforma revolucionaria"), JSON-LD `RealEstateAgent` con `areaServed: Chile` (el proyecto es LATAM), sin `Organization` ni `WebSite` con `SearchAction`.
3. **`CategoryShowcase`** — 10 tarjetas idénticas en cuadrícula plana, sin imagen, sin conteos reales visibles cuando `counts=0`, sin jerarquía. Se ven como cajas negras vacías.
4. **`RealListingsSection`** — La edge function `scrape-real-listings` devuelve **CORS + 400/401** en el preview → la sección se rompe silenciosamente. Hay que ocultarla si falla en vez de mostrar espacio muerto.
5. **`CTASection` (no montada)** — Existe pero no se usa; el landing termina en `TrustBadges` sin cierre fuerte de conversión.
6. **Orden de secciones** — Value Proposition (¿por qué nosotros?) aparece **después** de featured listings y how-it-works. Debería subir para justificar antes de convertir.
7. **Performance** — Fonts se cargan con 8 pesos + Fraunces sin `preload`; el hero (`CartographicHero`) es lazy pero es LCP → tiene que ser eager. `FeaturedListings` y `RealListingsSection` disparan queries al montar sin `Suspense`.

## Alcance de esta iteración

Foco en `/` (home principal). No toco landings de proyectos (Forestal / Huellelhue / Playa Álvaro) ni las de marketing — quedan para una segunda ronda si te interesa.

## Cambios

### 1. `index.html` — SEO + Head
- Título: `Ofertaterrenos · Marketplace de terrenos LATAM con IA territorial`
- Meta description con keywords reales (terrenos rurales, parcelas de agrado, loteos, DL 3.516, Chile / Argentina / Colombia / México / Perú), <160 chars.
- OG/Twitter alineados con nuevo título.
- JSON-LD: `Organization` + `WebSite` con `potentialAction` (SearchAction apuntando a `/explorar?q={query}`). Mantener `RealEstateAgent` pero con `areaServed` = lista de países LATAM.
- `<link rel="preload">` para la imagen LCP del hero (si aplica) y `font-display: swap` ya está — quitar `Fraunces` del cargador global si no se usa en landing (se usa solo en Forestal → mover a esa página).

### 2. `CartographicHero` — Compactar y fortalecer
- Reducir el título gigante a `text-5xl md:text-7xl` (hoy `text-8xl`), acortar padding vertical.
- Añadir subtítulo/subheadline concreto encima de los CTAs: *"El marketplace inteligente para terrenos rurales, industriales y de inversión en LATAM. Datos verificados, análisis IA y contacto directo con corredores."*
- **KPIs**: cambiar `1 región / 1+ proyectos` por métricas más honestas y con formato: `+X terrenos publicados`, `Y países`, `Z corredores verificados`. Si un valor es <5, mostrar copy cualitativo en su lugar ("Mapeo activo", "En expansión") — no números vergonzosos.
- Añadir tercer CTA secundario "Ver oportunidades" que enlace a `/oportunidades`.

### 3. `CategoryShowcase` — Rediseño visual
- Grid asimétrico: 2 categorías destacadas (Parcelas de Agrado, Oportunidades) en tarjetas grandes (col-span-2) con imagen/gradient de fondo, y las 8 restantes en tarjetas compactas.
- Mostrar conteo siempre (aunque sea 0 → "Explorar"), y KPI de precio mínimo por categoría cuando esté disponible.
- Hover con lift + glow en color de la categoría.

### 4. `RealListingsSection` — Fallback robusto
- Si el hook `useRealListings` retorna error o array vacío, **no renderizar** la sección (return null) en vez de mostrar shell vacío.
- No arreglar la edge function en este pase (es tema aparte); solo evitar que rompa visualmente el landing.

### 5. Reordenar `Index.tsx`
Nuevo orden:
```text
Hero → Search AI → ValueProposition (¿por qué?) → CategoryShowcase
→ FeaturedListings → HowItWorksFlow → RealListingsSection (si hay data)
→ InvestmentShowcase → Scrollytelling → RegionStats → MarketInsights
→ AgentCTA → Testimonials → TrustBadges → CTASection (cierre) → FloatingCTA
```
Se agrega `CTASection` como cierre fuerte antes del footer.

### 6. Performance quick-wins
- Cargar `CartographicHero` **eager** (no lazy) — es el LCP.
- Reducir pesos de Google Fonts: `Inter 400;500;600;700` + `Plus Jakarta Sans 600;700;800`. Quitar Fraunces del landing.
- Añadir `fetchpriority="high"` al primer asset del hero.

## Detalle técnico

Archivos a modificar:
- `index.html` — meta, JSON-LD, fonts
- `src/pages/Index.tsx` — reorden + hero eager + añadir CTASection
- `src/components/landing/CartographicHero.tsx` — tipografía, subtítulo, KPIs con fallback cualitativo
- `src/components/landing/CategoryShowcase.tsx` — grid asimétrico con hero cards
- `src/components/RealListingsSection.tsx` — early-return si error/empty (leer primero)
- `src/hooks/useLandingStats.ts` — extender si hace falta para más KPIs

No toco: rutas, auth, edge functions, migraciones, landings de proyectos, sidebar.

## Fuera de alcance (te aviso para futura ronda)
- Arreglar la edge function `scrape-real-listings` (CORS + 400/401).
- Rediseño de secciones `MarketInsights`, `Scrollytelling`, `TestimonialMarquee` — funcionan pero merecen otra iteración.
- SEO por-ruta con `react-helmet-async` (hoy solo hay meta estáticos en `index.html`).
- Landings `/inmobiliarias`, `/corredoras`, `/pricing-loteos`.

¿Apruebas el plan tal cual, o quieres priorizar/quitar algo?
