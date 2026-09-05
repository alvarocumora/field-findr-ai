# Plan de ingeniería: la mejor corredora de campos y loteos

Dos entregables: (1) un documento guía maestro en `docs/GUIA_CORREDORA_DISRUPTIVA.md` que define cómo se opera y se construye la corredora, y (2) un plan de ejecución técnico por fases, con criterios de "listo" verificables.

## Entregable 1 — Documento guía (`docs/GUIA_CORREDORA_DISRUPTIVA.md`)

Documento único, en español, que reemplaza la dispersión actual (hoy hay 42 documentos en `docs/`, varios superpuestos). Estructura:

1. Tesis y promesa: no vender el terreno, mostrar el proyecto que puede existir sobre él.
2. Los cuatro actores y qué gana cada uno: propietario, inmobiliaria, corredor, comprador.
3. Modelo de negocio: suscripción de inmobiliarias, destacados, comisión de red, kits y tasaciones.
4. Manual operativo de la corredora: captación, ficha mínima aceptable, publicación, seguimiento, reserva, cierre, comisión y postventa.
5. Estándar de calidad de publicación: fotos, polígono, precio, superficie, estado legal, plano y kit descargable.
6. Playbooks comerciales: WhatsApp, visita, Open Land, seguimiento a 48 h, reactivación.
7. Estándares de producto: navegación de tres puertas, hero cinemático, informes PDF, tokens de diseño.
8. Reglas de datos y privacidad: una sola fuente de verdad en base de datos, atribución en cada lead, RLS por organización.
9. Métricas y tablero: inventario activo, contacto, visita, reserva, cierre, GMV, comisiones, MRR.
10. Reglas de ingeniería: manifiesto único de rutas, motor único de landings, shell único de informes, PRs pequeños, build verde.
11. Checklist de "listo para vender" por proyecto y por corredora.
12. Índice de documentos vigentes y lista de documentos archivados.

## Entregable 2 — Plan técnico por fases

### Fase 0 — Base estable (primero)
- Auditoría de errores de build, hallazgos de seguridad pendientes y rutas rotas.
- QA de las rutas críticas con sesión real: explorar, ficha, landing de proyecto, panel por rol.
- Documentar el despliegue y dejar visible la versión publicada.

### Fase 1 — Inventario impecable
- Estándar de completitud por publicación con puntaje visible al corredor y bloqueo de publicación bajo el mínimo.
- Importador de proyectos: KMZ/KML, polígonos, superficies, precios y estados en un solo asistente.
- Kit descargable verificado contra la publicación en cada proyecto.

### Fase 2 — Demanda y matching
- Perfil de demanda del comprador y matching explicable por reglas.
- Alertas y búsquedas guardadas.
- Shortlist enviable por WhatsApp y PDF.

### Fase 3 — Red comercial
- Perfil público de corredor y directorio.
- Vitrina de oportunidades con comisión ofrecida y solicitud de asignación.
- Atribución captador/vendedor y ledger de comisiones auditable.

### Fase 4 — Operación de venta
- Pipeline único: consulta, visita, reserva, cierre, comisión, postventa.
- Reservas con pago y contrato firmado.
- Reportería exportable de ventas, comisiones y conversión.

### Fase 5 — Diferenciación
- Escenarios visuales de desarrollo por terreno.
- Tasación y validación pública con QR.
- Asistente comercial con datos reales de la plataforma.

## Detalles técnicos

- Toda ruta se declara solo en `src/routes/routeManifest.tsx`; el test de enlaces se mantiene verde.
- Landings solo por el motor `/p/:slug`; nada hardcodeado nuevo.
- Informes PDF solo por `scripts/reports/ot_report_shell.py`.
- Tablas nuevas con `GRANT` explícito, RLS por organización y funciones `SECURITY DEFINER` con `search_path` fijo.
- Cada fase cierra con build verde, sitemap y `docs/ROUTES_MAP.md` regenerados.

## Orden de entrega

1. Documento guía.
2. Fase 0 y Fase 1.
3. Fase 3 y Fase 4 (son las que generan ingresos).
4. Fase 2 y Fase 5.
