# OfertaTerrenos — Product Vision & Execution Order 2026

## North Star

OfertaTerrenos debe evolucionar desde un portal de avisos hacia **la red comercial de terrenos y loteos de Chile**.

La plataforma conecta cuatro actores:

1. Propietarios que aportan inventario.
2. Inmobiliarias/desarrolladores que aportan proyectos y loteos.
3. Corredores que aportan compradores, captaciones y capacidad comercial.
4. Compradores/inversionistas que generan demanda.

La plataforma registra el ciclo completo:

`inventario → lead → matching → reunión/visita → reserva → cierre → comisión`

## Pilares de producto

### 1. Marketplace

- Terrenos, campos, industriales y loteos.
- Filtros territoriales y comerciales.
- Lotes individuales dentro de proyectos.
- Búsquedas guardadas y alertas.
- Destacados y oportunidades patrocinadas.

### 2. Loteos OS

- Landing dinámica `/p/:slug`.
- Masterplan interactivo.
- Disponibilidad, precio y superficie por lote.
- CRM, reservas, documentos y métricas.
- Equipo de ventas por organización.
- Planes SaaS para inmobiliarias.

### 3. Comunidad comercial

- Perfil público de corredor.
- Directorio de corredores.
- Captaciones.
- Oportunidades compartidas.
- Ranking, reputación y badges.
- Seguimiento de referidos.

### 4. Comisiones

- Comisión configurable por proyecto/lote/propiedad.
- Attribution del corredor captador y vendedor.
- Pipeline de comisión: potencial, reservada, aprobada, pagada.
- Ledger auditable.
- Dashboard para inmobiliaria y corredor.

### 5. Eventos

- Open Land / visitas masivas.
- Lanzamientos de proyectos.
- Networking de corredores.
- Capacitaciones y webinars.
- Inscripción, cupos, QR/check-in y seguimiento CRM.

### 6. Matching e IA

- Perfil de demanda del comprador.
- Matching comprador ↔ terreno/lote.
- Recomendaciones automáticas.
- Comparativos y PDFs.
- Asistente comercial Oferta AI.

## Principios de ejecución

1. **No agregar features sobre deploy inestable.** Producción debe reflejar `main` de forma verificable.
2. **Una sola fuente de verdad.** Proyectos, lotes, disponibilidad, leads y comisiones deben vivir en DB, no en landings hardcodeadas.
3. **Attribution desde el origen.** Todo lead, captación, visita y reserva debe conservar `source`, corredor y proyecto/lote cuando corresponda.
4. **Privacidad por diseño.** Datos de propietarios, compradores y teléfonos privados no se exponen públicamente sin opt-in.
5. **Multi-tenant real.** Datos y métricas deben estar scoped por organización mediante RLS.
6. **Mobile first comercial.** WhatsApp, compartir ficha, reservar y agendar deben requerir pocos pasos.
7. **No custodiar dinero inicialmente.** Comisiones comienzan como ledger y conciliación; pagos integrados son una fase posterior.

# Orden de ejecución

## P0 — Production Ready / DevOps

Objetivo: que cada release llegue a `ofertaterrenos.com` de forma repetible.

- CI: typecheck, tests y build.
- Deploy DreamHost automatizado o procedimiento único documentado.
- SPA fallback `.htaccess`.
- Variables de entorno documentadas.
- Health checks de rutas críticas.
- Version/commit visible en producción.
- Checklist de migraciones Supabase y Edge Functions.

**Gate:** no comenzar features comerciales críticas hasta verificar deploy reproducible.

## P1 — Cerrar plataforma inmobiliaria vendible

- Resolver y mergear PR #83 después de corregir review y conflictos.
- Aplicar migraciones pendientes.
- Validar `/p/:slug`, masterplan, CRM, reservas, equipo y reuniones.
- QA end-to-end de una inmobiliaria piloto.
- Validar planes y límites por organización.

**Resultado:** OfertaTerrenos puede vender gestión de loteos como SaaS.

## P2 — Comunidad: perfiles y directorio

### Entidades

- `broker_profiles`
- especialidades y zonas
- métricas públicas agregadas
- verificación

### Rutas

- `/corredores`
- `/corredor/:slug`

### MVP

- Perfil público.
- Propiedades/proyectos que puede comercializar.
- Captaciones y operaciones agregadas sin datos confidenciales.
- CTA contactar / compartir oportunidad.

## P3 — Oportunidades comerciales

Crear un inventario distribuible a la red.

### Modelo

- `sales_opportunities`
- proyecto/propiedad/lote asociado
- comisión ofrecida
- reglas comerciales
- vigencia
- material comercial

### Rutas

- `/oportunidades`
- `/oportunidades/:id`
- `/asesor/oportunidades`

### Acciones

- `Quiero vender este proyecto`
- `Tengo comprador`
- compartir WhatsApp
- registrar lead atribuido

## P4 — Attribution + Commission Ledger

### Entidades

- `deal_attributions`
- `commissions`
- `commission_events`

### Estados sugeridos

`potential → reserved → earned → approved → paid → cancelled`

### Reglas

- Captador y vendedor pueden ser personas distintas.
- Toda modificación queda auditada.
- La inmobiliaria confirma cierre antes de `earned/approved`.
- El corredor solo ve sus comisiones.

### Dashboards

- `/asesor/comisiones`
- `/admin/comisiones`
- módulo de comisiones dentro de inmobiliaria.

## P5 — Buyer Demand & Matching

### Entidad

`buyer_requirements`

Campos principales:

- región/comuna
- presupuesto mínimo/máximo
- superficie
- tipo de terreno
- finalidad
- financiamiento
- urgencia

### Motor V1

Matching determinístico por reglas y score explicable.

### UX

- `Tengo comprador` crea demanda.
- Plataforma devuelve propiedades/lotes compatibles.
- Corredor puede enviar shortlist por WhatsApp/PDF.

## P6 — Eventos

### Entidades

- `events`
- `event_registrations`
- `event_checkins`

### Rutas

- `/eventos`
- `/eventos/:slug`
- `/asesor/eventos`
- `/admin/eventos`

### MVP

- crear evento;
- cupos;
- inscripción;
- WhatsApp de confirmación;
- QR/check-in;
- convertir asistentes en leads;
- asociar evento a proyecto o propiedad.

## P7 — Gamificación y reputación

- Ranking mensual.
- Ventas/captaciones verificadas.
- Badges.
- Challenges de inmobiliarias.
- Score de actividad comercial.

Evitar rankings basados únicamente en volumen de publicaciones.

## P8 — Oferta AI

Después de acumular suficiente inventario y señales comerciales:

- búsqueda conversacional;
- matching asistido;
- generación de mensajes y fichas;
- comparativos;
- recomendaciones de siguiente acción;
- análisis de conversión por proyecto/agente.

# KPIs North Star

## Marketplace

- inventario activo;
- lotes disponibles;
- búsquedas → contacto;
- contacto → reunión/visita.

## Inmobiliarias

- organizaciones activas;
- proyectos activos;
- usuarios por organización;
- MRR;
- churn.

## Comunidad

- corredores activos mensuales;
- oportunidades tomadas;
- leads atribuidos;
- captaciones nuevas.

## Transacciones

- reservas;
- cierres;
- GMV intermediado;
- comisiones generadas;
- tiempo lead → cierre.

## Eventos

- inscritos;
- asistencia;
- leads generados;
- reservas originadas por evento.

# Definition of Done comercial

Una inmobiliaria está lista para pagar cuando puede:

1. Crear/configurar su organización.
2. Invitar equipo según plan.
3. Crear/importar proyecto y lotes.
4. Publicar landing y masterplan.
5. Gestionar disponibilidad/precios.
6. Recibir y asignar leads.
7. Agendar reuniones/visitas.
8. Registrar reservas y cierres.
9. Distribuir oportunidades a corredores.
10. Ver attribution y comisiones.
11. Medir conversión por proyecto y vendedor.

# Regla de priorización

Antes de aceptar un nuevo feature, evaluar si mejora al menos uno de estos loops:

- **Inventory loop:** más inventario de calidad.
- **Demand loop:** más compradores/leads.
- **Sales loop:** más conversión y cierres.
- **Network loop:** más corredores vendiendo inventario.
- **Revenue loop:** más suscripciones, destacados o comisiones.

Si no fortalece uno de estos loops, queda fuera del roadmap inmediato.
