# Ecosistema de venta de loteos: comunidad de brokers + control total del administrador

Objetivo: cerrar el círculo comercial de la plataforma — que un vendedor (corredor, corredora, inmobiliaria) tenga todo lo necesario para vender, que exista una **comunidad de brokers** con inscripción pública y proyectos disponibles para vender, y que el **administrador** pueda modificar datos, comisiones y ventas de punta a punta.

## Estado actual (lo que ya existe)

- Panel de asesor completo: inventario, leads, CRM, reservas, créditos, cierre, comisiones, pagos, reportes.
- Comisiones y referidos entre agentes ya modelados (`agent_commissions` con agente referidor, tasa y monto de referido).
- Panel admin con usuarios, agentes, aprobaciones, destacados, auditoría, leads comerciales.
- Programa de referidos genérico de usuarios (`/referrals`) orientado a compradores, no a brokers.

## Lo que falta (los 4 huecos reales)

1. No hay **inscripción pública de brokers** ni un perfil de broker con estado (pendiente / aprobado / suspendido).
2. No hay un **marketplace interno de proyectos en venta** donde un broker vea qué loteos puede vender y con qué comisión.
3. El admin **no puede editar comisiones ni registrar/corregir ventas** desde la interfaz.
4. No hay **material de venta ni ranking/comunidad** que dé pertenencia y competencia sana entre brokers.

---

## Fase 1 — Comunidad de Brokers (inscripción y perfil)

**Público:** nueva landing `/brokers` con propuesta de valor, esquema de comisiones, casos y CTA de inscripción. Formulario `/brokers/inscripcion` (nombre, RUT/ID, país, región, empresa, experiencia, especialidad, RRSS, cómo llegó).

**Backend:** tabla `broker_applications` (postulación, estado `pending|approved|rejected`, notas admin) y tabla `broker_profiles` (nivel, comisión base, zonas, bio pública, estado activo, link de invitación propio).

**Flujo:** postulación → cola admin `/admin/brokers` → aprobación otorga rol `agent`, crea `broker_profiles` y envía credenciales/onboarding.

**Link de inscripción viral:** cada broker aprobado recibe `ofertaterrenos.com/brokers/inscripcion?ref=CODIGO`; los brokers que trae quedan asociados como su red (comisión de override configurable por el admin).

## Fase 2 — Marketplace interno de proyectos en venta

Nueva sección de asesor `/asesor/mercado`: catálogo de loteos y terrenos habilitados para venta por terceros.

- Cada proyecto expone: comisión ofrecida (%), stock disponible, precio desde, condiciones, material descargable y estado de exclusividad.
- Botón **"Quiero vender este proyecto"** → crea una solicitud; el dueño del proyecto o el admin la aprueba.
- Tabla `project_broker_assignments` (proyecto, broker, comisión pactada, estado, fecha).
- Al referir un cliente a un proyecto asignado, el lead y la futura comisión quedan trazados automáticamente contra ese broker (reutiliza `create_referral_lead` y `agent_commissions`).
- Kit de venta por proyecto: brochure PDF, fotos, plano, textos listos para WhatsApp, link personalizado con el código del broker.

## Fase 3 — Control total del administrador

Nueva sección `/admin/comisiones` y `/admin/ventas`:

- **Comisiones:** ver todas las comisiones (agente, referidor, proyecto, monto), editar tasa y monto, cambiar estado (pendiente / aprobada / pagada / anulada), pagos masivos y exportación CSV para contabilidad. Todo cambio queda en `audit_logs`.
- **Ventas:** registrar una venta manual (sin reserva previa), corregir monto, reasignar el agente acreditado, anular con motivo. Reutiliza y extiende `register_sale`.
- **Reglas comerciales:** panel de configuración de comisión por defecto por plan y por proyecto, y de override de red de brokers (tabla `commission_rules`).
- **Brokers:** aprobar, suspender, cambiar nivel y comisión base, ver producción individual.

Todas estas operaciones pasan por funciones `SECURITY DEFINER` validadas con `is_platform_admin()`, nunca por escritura directa desde el cliente.

## Fase 4 — Que el vendedor venda más

- **Panel "Mi negocio"** en el dashboard del asesor: comisiones ganadas vs. pendientes, ventas del mes, meta (`agent_goals` ya existe) y ranking de la comunidad.
- **Ranking público de brokers** (`/brokers/ranking`) por ventas y por proyectos activos — impulsa la comunidad.
- **Link personal de captación** por broker: `ofertaterrenos.com/b/:slug` con su vitrina y todos sus proyectos asignados; todo lead entra atribuido.
- **Onboarding de 5 pasos** al aprobar un broker: completar perfil, elegir proyectos, descargar kit, compartir link, primer lead.
- **Centro de recursos**: guías de venta, scripts de WhatsApp, preguntas frecuentes legales de loteos (DL 3.516), plantillas de propuesta.

---

## Detalles técnicos

- Nuevas tablas: `broker_applications`, `broker_profiles`, `project_broker_assignments`, `commission_rules`. Todas con RLS estricta: el broker ve lo suyo, el dueño del proyecto ve sus asignaciones, el admin ve todo vía `is_platform_admin()`; `GRANT` explícitos por tabla.
- Nuevas RPC `SECURITY DEFINER`: `submit_broker_application`, `approve_broker_application`, `request_project_assignment`, `admin_update_commission`, `admin_register_manual_sale`, `admin_void_sale`.
- Rutas nuevas registradas en `src/routes/routeManifest.tsx` respetando el sistema unificado (público / agent / admin) y la navegación segmentada por plan.
- Reutiliza el sistema existente de notificaciones (`notification_templates`) para avisar postulación recibida, aprobación, nueva asignación y comisión pagada.
- SEO: `/brokers` y `/brokers/ranking` entran al sitemap generado desde el manifiesto.

## Orden de entrega sugerido

1. Fase 1 (comunidad e inscripción) — habilita el crecimiento.
2. Fase 3 (control admin de comisiones y ventas) — sin esto no se puede operar dinero real.
3. Fase 2 (marketplace de proyectos) — conecta oferta y fuerza de venta.
4. Fase 4 (ranking, kit, vitrina) — retención y escala.
