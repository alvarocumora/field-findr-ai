# Plan maestro: ordenar la plataforma y dejarla operativa para LATAM

Objetivo: consolidar lo que ya existe en un producto coherente —un flujo real por rol, sin pantallas huérfanas ni funciones a medias— y habilitar operación multi-país desde esta ronda.

## Estado verificado

- El manifiesto único de rutas (`src/routes/routeManifest.tsx`) ya declara ~112 rutas en 5 grupos (públicas, landings de proyecto, comprador, asesor, admin) más 24 alias legacy.
- Hay 28 pantallas en `src/pages/dashboard` y 9 en `src/pages/admin`, con solapamiento evidente: `DashboardAsesor`, `DashboardInmobiliaria`, `DashboardAdmin`, `ExecutiveDashboard`, `MultiProjectDashboard`, `FinancialDashboard`, `DemandHeatmapDashboard`, `AgentPerformance` y `Reports` conviven sin jerarquía clara.
- La base ya tiene el modelo completo de negocio: `projects`, `lots`, `listings`, `leads`, `reservations`, `credits`, `agent_commissions`, `commission_rules`, `broker_profiles`, `broker_applications`, `project_broker_assignments`, `support_tickets`, `subscriptions`.
- Multi-país existe parcialmente: `listings.country`, `listings.currency`, `profiles.preferred_currency` y `preferred_language` están, pero no hay una tabla de países ni reglas por país (IDs fiscales, formatos, moneda base, marco legal).
- Landings hardcodeadas por proyecto (`exploraPark`, `huellelhue`, `playaAlvaro`, `forestal`) conviven con la landing genérica `ProjectLanding` + `projects.landing_config`.

## Fase 1 — Orden y consolidación (primero)

**1.1 Inventario y poda de rutas.** Recorrer las ~112 entradas del manifiesto y clasificar cada una: canónica, fusionable o a eliminar. Las eliminadas pasan a alias hacia su reemplazo, nunca a 404. Resultado: documento `docs/ROUTES_MAP.md` regenerado desde el manifiesto y test anti-links-muertos actualizado.

**1.2 Un dashboard por rol, con secciones.** Reducir los 28 paneles a tres raíces reales:
- `/asesor/dashboard` — vista única con módulos (mi negocio, inventario, leads, ventas, comisiones, red).
- `/inmobiliaria/dashboard` — multi-proyecto, equipo, financiero, reportes.
- `/admin/dashboard` — aprobaciones, brokers, comisiones, ventas, usuarios, soporte, destacados.
Las pantallas actuales dejan de ser rutas de primer nivel y se vuelven secciones o pestañas dentro de esa raíz, filtradas por plan (ya soportado por `nav.plans`).

**1.3 Flujos end-to-end verificados.** Recorrer y dejar funcionando sin cabos sueltos:
- Publicar terreno: formulario → validación geo → cola de aprobación → publicado → visible en explorador.
- Crear loteo: proyecto → carga KMZ/polígonos → lotes → publicación masiva → landing del proyecto.
- Vender: lead → seguimiento CRM → reserva con pago → cierre documental → venta registrada → comisión y override de red.
Cada paso con estado visible y sin acciones que no persistan.

**1.4 Landings de proyecto unificadas.** Migrar las landings hardcodeadas a la landing genérica configurada por `projects.landing_config`, manteniendo el hero cinemático y las secciones actuales como bloques configurables. Un solo motor, N proyectos.

**1.5 Limpieza de datos demo.** Separar claramente contenido real de demo (`listings.is_demo`) y ocultar demo en producción.

## Fase 2 — LATAM operativo

**2.1 Registro de países.** Tabla `countries` con código, nombre, moneda base, formato de ID fiscal (RUT/CUIT/RFC/NIT/DNI), unidad de superficie preferida, indexación de precio (UF solo en Chile) y estado de habilitación.

**2.2 Moneda y formato.** Conversión y visualización consistente CLP/UF/USD/ARS/COP/MXN/PEN en fichas, filtros, comisiones y PDFs, tomando la moneda del país del inmueble y mostrando también la preferida del usuario.

**2.3 Búsqueda y SEO por país.** `/pais/:code`, `/region/:slug` y `/ciudad/:slug` con contenido y datos reales por país; sitemap generado por país; hreflang.

**2.4 Validaciones locales.** ID fiscal y teléfono validados según país en registro de brokers, leads y reservas.

**2.5 Comunidad de brokers multi-país.** Zonas y ranking segmentados por país; reglas de comisión por país en `commission_rules`.

## Fase 3 — Funciones reales que faltan para cerrar el círculo

- **Marketplace interno de proyectos** para brokers (`project_broker_assignments` ya existe, falta la vitrina y el flujo de solicitud/aprobación completo).
- **Kit de venta por proyecto**: brochure PDF, plano, fotos, textos de WhatsApp y link atribuido al broker.
- **Panel de control de ventas del admin**: registro manual, corrección y anulación (RPC ya existen; falta UI consistente).
- **Reportería exportable** (CSV/PDF) de ventas, comisiones y pipeline.

## Detalles técnicos

- Toda ruta nueva o eliminada pasa por `src/routes/routeManifest.tsx`; nada se declara fuera.
- Las consolidaciones de dashboard no borran componentes: se reubican como secciones para no perder funcionalidad ni historial.
- Nuevas tablas (`countries`) con RLS de lectura pública y escritura solo admin, más `GRANT` explícitos.
- Operaciones sensibles (comisiones, ventas, aprobaciones) siguen pasando por funciones `SECURITY DEFINER` validadas con `is_platform_admin()`.
- Cada fase cierra con build verde, sitemap regenerado y `docs/ROUTES_MAP.md` actualizado.

## Orden de entrega

1. Fase 1.1 + 1.2 (mapa de rutas y consolidación de dashboards).
2. Fase 1.3 (flujos end-to-end verificados) — es lo que vuelve la app "operativa".
3. Fase 2 (LATAM).
4. Fase 1.4 + 1.5 y luego Fase 3.
