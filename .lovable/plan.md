# Plataforma global de venta de terrenos — un solo entorno, sin fragmentación

Objetivo: convertir lo que hoy son ~112 rutas y decenas de paneles en **una sola plataforma global, comunitaria y fácil de usar**, con el módulo de loteo/parcelación ("Land Plotter") integrado como herramienta central del vendedor, no como app aparte.

## Principio rector

Un solo producto, tres puertas de entrada: **Explorar** (comprador), **Vender** (corredor/propietario/inmobiliaria), **Comunidad** (brokers e inversionistas). Todo lo demás son secciones dentro de esas tres, nunca rutas nuevas de primer nivel.

---

## Fase 1 — Un entorno, no fragmentos

**1.1 Consolidación de navegación.** Tres raíces reales: `/explorar`, `/panel`, `/comunidad`. Los ~37 paneles actuales pasan a ser secciones con pestañas dentro de `/panel`, filtradas por rol y plan (el manifiesto ya soporta `nav.plans`). Las rutas viejas quedan como alias, nunca 404.

**1.2 Un solo shell visual.** Header, sidebar, breadcrumbs, estados vacíos, skeletons y toasts unificados en un layout compartido para público y privado. Se elimina la sensación de "varias apps pegadas".

**1.3 Land Plotter como módulo integrado.** El editor de loteo (dibujo de polígonos, KMZ, numeración, precios por m², master plan, exportes DXF/PDF) vive en `/panel/loteos/:id` y comparte geometría, precios y estado con el marketplace: publicar un lote desde el plano es un botón, no un flujo aparte.

**1.4 Poda de duplicados.** Landings hardcodeadas (`exploraPark`, `huellelhue`, `playaAlvaro`, `forestal`) migran al motor genérico con `projects.landing_config`. Un motor, N proyectos.

## Fase 2 — Global de verdad

**2.1 Registro de países** (`countries`): moneda base, ID fiscal, unidad de superficie, idioma, indexación de precio (UF solo Chile), estado de habilitación.

**2.2 Multi-moneda y multi-idioma** consistente en fichas, filtros, comisiones y PDFs: moneda del inmueble + moneda preferida del usuario, ES/EN/PT.

**2.3 Descubrimiento global**: mapa mundial de entrada, `/pais/:code`, `/region/:slug`, `/ciudad/:slug` con datos reales, sitemap por país y hreflang.

**2.4 Validaciones locales** de ID fiscal y teléfono por país en registro, leads y reservas.

## Fase 3 — Comunitaria (el diferencial)

- **Perfil público de cada actor**: broker, inmobiliaria, propietario e inversionista, con reputación verificable (ventas cerradas, reseñas, tiempo de respuesta).
- **Muro de oportunidades**: cualquier miembro publica un terreno buscado o disponible; la comunidad responde. Convierte la plataforma en red, no en catálogo.
- **Marketplace interno de proyectos**: el broker ve qué loteos puede vender, con qué comisión, y solicita asignación en un clic (`project_broker_assignments` ya existe).
- **Referidos y red**: link personal `/b/:slug`, override de red, ranking global y por país.
- **Kit de venta por proyecto**: brochure, plano, fotos, textos de WhatsApp y link atribuido.

## Fase 4 — Fácil de usar

- **Onboarding por intención** en 3 pasos ("compro / vendo / invierto") que deja al usuario en su panel ya configurado.
- **Búsqueda conversacional** como entrada principal, con filtros visuales secundarios.
- **Publicar en 90 segundos**: dirección o punto en mapa → superficie automática → precio sugerido por comparables → publicado.
- **Móvil primero**: mapa, ficha, plano y firma operativos en pantalla chica; PWA offline.

---

## Detalles técnicos

- Toda ruta pasa por `src/routes/routeManifest.tsx`; nada se declara fuera. Cada fase cierra con `docs/ROUTES_MAP.md` y sitemap regenerados.
- Consolidar dashboards **no borra** componentes: se reubican como secciones.
- Nuevas tablas (`countries`, muro de oportunidades, reputación) con RLS estricta y `GRANT` explícitos; operaciones de dinero solo por RPC `SECURITY DEFINER` con `is_platform_admin()`.
- Geometría siempre por `normalizePolygon`; hero cinemático según `docs/GUIA_HERO_CINEMATICO.md`.
- Land Plotter reutiliza el stack actual (Mapbox GL Draw, KMZ parser, Voronoi, exportes) sin duplicar lógica.

## Orden de ejecución

1. Fase 1.1 + 1.2 — el entorno unificado (base de todo lo demás).
2. Fase 1.3 + 1.4 — Land Plotter integrado y landings unificadas.
3. Fase 4 — onboarding, publicar en 90s, móvil.
4. Fase 3 — comunidad y red de brokers.
5. Fase 2 — expansión global país por país.
