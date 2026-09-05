# Guía maestra — La mejor corredora de campos y loteos

Documento único de referencia para operar y construir OfertaTerrenos como corredora digital de campos, terrenos y loteos. Si otro documento contradice a este, manda este.

Versión 1.0 · Última revisión: 2026-09-05

---

## 1. Tesis y promesa

> No vendemos el terreno. Mostramos el proyecto que puede existir sobre él.

Un terreno es abstracto: un polígono, un precio y un camino de tierra. La corredora gana cuando el comprador entiende, en menos de 60 segundos, qué puede hacer ahí, cuánto cuesta, qué riesgos tiene y cuál es el siguiente paso.

Tres promesas verificables:

1. **Claridad**: cada publicación muestra polígono real, superficie, precio, estado y documentos.
2. **Proyección**: cada terreno relevante muestra un escenario de desarrollo posible, siempre marcado como conceptual.
3. **Velocidad comercial**: del interés al contacto real en un clic; del contacto al cierre con trazabilidad completa.

Lo que nunca hacemos: afirmar factibilidades, permisos, subdivisiones o cambios de uso de suelo sin respaldo documental.

---

## 2. Los cuatro actores

| Actor | Qué necesita | Qué gana con nosotros |
|---|---|---|
| Propietario | Vender bien y sin exponerse | Valorización preliminar, ficha profesional, acceso a red de corredores |
| Inmobiliaria / loteador | Vender el proyecto completo | Landing, masterplan, CRM, reservas, equipo, métricas y red de corredores |
| Corredor | Inventario y compradores | Oportunidades con comisión clara, kit de venta listo, atribución garantizada |
| Comprador / inversionista | Entender y comparar | Fichas comparables, plano, documentos, simuladores y seguimiento de su compra |

Regla: ninguna función entra al roadmap si no fortalece al menos uno de estos cinco ciclos — inventario, demanda, ventas, red, ingresos.

---

## 3. Modelo de negocio

1. **Suscripción de inmobiliarias** (planes por proyecto, usuarios y lotes).
2. **Destacados**: proyecto completo en portada con etiqueta pagada.
3. **Comisión de red**: corredor captador y corredor vendedor, con ledger auditable.
4. **Servicios**: tasación profesional con validación pública por QR, kit comercial y dossier.
5. **Enterprise / API**: integraciones, white-label y datos territoriales.

Principio: no custodiamos dinero al inicio. Las comisiones se registran y concilian; el pago integrado es una fase posterior.

---

## 4. Manual operativo de la corredora

### 4.1 Captación
- Visita o levantamiento remoto con KMZ/KML, plano y rol de avalúo.
- Verificación mínima: dominio vigente, deslindes, accesos, servicios y gravámenes.
- Acuerdo comercial firmado: exclusividad o no, comisión, vigencia y material autorizado.

### 4.2 Publicación
- Ficha creada solo cuando cumple el estándar de calidad (sección 5).
- Precio en la moneda base del país; en Chile también en UF.
- Proyectos se publican como proyecto, no como 76 lotes sueltos en el buscador.

### 4.3 Seguimiento
- Todo contacto entra como lead con origen, corredor y proyecto/lote.
- Primer contacto en menos de 2 horas hábiles; segundo toque a las 48 horas.
- Visita agendada con fecha, hora, estado y resultado registrado.

### 4.4 Reserva
- Monto de reserva definido por proyecto, pagado en línea y con comprobante.
- La reserva bloquea el lote y cambia su estado en el masterplan.

### 4.5 Cierre
- Promesa o contrato firmado, pago verificado, lote marcado vendido.
- El cierre genera automáticamente la comisión del corredor con su porcentaje.

### 4.6 Postventa
- Portal del comprador con hitos legales, documentos y avance.
- Solicitud de reseña y activación del programa de referidos.

---

## 5. Estándar de calidad de una publicación

Una publicación es válida solo si tiene:

- [ ] Polígono real normalizado (2D y 3D coinciden).
- [ ] Superficie oficial coincidente con el plano maestro.
- [ ] Precio y moneda, o motivo explícito de "consultar".
- [ ] Mínimo 5 fotos reales; nada de imágenes referenciales sin declararlo.
- [ ] Ubicación con comuna, región y país.
- [ ] Accesos, agua, luz y factibilidad declarados con su nivel de certeza.
- [ ] Estado legal: dominio, gravámenes, uso de suelo.
- [ ] Plano descargable y kit PDF que coincida exactamente con lo publicado.
- [ ] Corredor responsable asignado.

Puntaje de completitud visible al corredor. Bajo el mínimo, no se publica.

---

## 6. Playbooks comerciales

**WhatsApp (primer contacto).** Nombre, proyecto, una ventaja concreta, link atribuido, pregunta cerrada. Nunca más de cuatro líneas.

**Visita.** Confirmar 24 h antes, llevar plano impreso y kit, recorrer límites reales, cerrar con una opción de reserva concreta.

**Open Land.** Fecha, cupos, inscripción con QR, check-in y conversión de asistentes en leads el mismo día.

**Seguimiento 48 h.** Un dato nuevo (lote liberado, cambio de precio, financiamiento) y una fecha propuesta.

**Reactivación.** Contactos fríos a 30 días con novedades del proyecto o alternativa comparable.

---

## 7. Estándares de producto

- **Tres puertas públicas**: `/explorar`, `/comenzar`, `/comunidad`. Área privada por rol en `/panel`.
- **Landings**: un solo motor, `/p/:slug`. Nada hardcodeado nuevo.
- **Hero cinemático**: obligatorio en todo proyecto con polígono válido.
- **Informes PDF**: shell único de reportes; portada, banda verde, cabecera, pie y QR.
- **Diseño**: modo oscuro, tipografía suiza, glassmorfismo. Estados: verde disponible, ámbar reservado, gris vendido.
- **Marca**: "OFERTA TERRENOS" en lo público; "Field-Findr AI" solo en herramientas internas.

---

## 8. Datos y privacidad

1. Una sola fuente de verdad: proyectos, lotes, disponibilidad, leads y comisiones viven en la base de datos.
2. Atribución desde el origen: todo lead conserva origen, corredor y proyecto/lote.
3. Multi-tenant real: los datos se aíslan por organización mediante RLS.
4. Datos de propietarios y compradores nunca se exponen públicamente sin consentimiento.
5. Datos demo separados y ocultos en producción.
6. Distinguir siempre dato real, supuesto y estimación.

---

## 9. Métricas

**Inventario**: proyectos activos, lotes disponibles, completitud promedio de ficha.
**Demanda**: visitas al sitio, búsquedas, contactos, tasa búsqueda → contacto.
**Ventas**: contacto → visita, visita → reserva, reserva → cierre, tiempo lead → cierre.
**Red**: corredores activos, oportunidades tomadas, leads atribuidos.
**Ingresos**: MRR de inmobiliarias, destacados vendidos, comisiones generadas, GMV intermediado.
**Técnicas**: build verde, tiempo de carga, errores de funciones, errores de autenticación.

---

## 10. Reglas de ingeniería

1. Toda ruta se declara solo en `src/routes/routeManifest.tsx`; el test de enlaces debe quedar verde.
2. Landings solo por el motor `/p/:slug`.
3. Informes PDF solo por `scripts/reports/ot_report_shell.py`.
4. Tablas nuevas: `CREATE TABLE` → `GRANT` → `ENABLE RLS` → políticas, en la misma migración.
5. Funciones sensibles con `SECURITY DEFINER` y `search_path` fijo; nunca `USING (true)` en pagos, comisiones o transacciones.
6. Polígonos siempre por `normalizePolygon`.
7. PRs pequeños: un objetivo por PR; no mezclar rutas, UI, datos y auth.
8. Cada entrega cierra con build verde, sitemap y `docs/ROUTES_MAP.md` regenerados.

---

## 11. Checklists

### Proyecto listo para vender
- [ ] Proyecto creado con polígonos y superficies validadas contra el plano maestro.
- [ ] Landing `/p/:slug` publicada con hero cinemático y masterplan usable.
- [ ] Precios y estados por lote cargados.
- [ ] Kit descargable verificado contra la publicación.
- [ ] Comisión definida y oportunidad visible en la red comercial.
- [ ] Reserva en línea probada de punta a punta.
- [ ] Corredor responsable y equipo asignados.

### Corredora lista para operar
- [ ] Organización creada, plan activo y equipo invitado.
- [ ] Al menos un proyecto completo publicado.
- [ ] CRM recibiendo y asignando leads.
- [ ] Pipeline de ventas en uso real.
- [ ] Comisiones visibles y conciliables.
- [ ] Reportería exportable disponible.

---

## 12. Mapa de documentos

**Vigentes**
- `GUIA_CORREDORA_DISRUPTIVA.md` (este documento, raíz de todo).
- `OFERATTERRENOS_PRODUCT_VISION_2026.md` — orden de ejecución por prioridades.
- `MASTER_PLAN.md` — visión y posicionamiento.
- `ROUTES_MAP.md` — mapa de rutas generado.
- `GUIA_HERO_CINEMATICO.md`, `GUIA_FORMATO_INFORMES.md`, `GUIA_TASACION_PROFESIONAL.md` — estándares obligatorios.
- `QA_RELEASE_CHECKLIST.md` — control previo a publicar.
- `DREAMHOST_PRODUCTION_DEPLOY.md` — despliegue.

**De referencia** (histórico, no normativos): documentos de `VISUAL_SCENARIOS_*`, `PRICING_LOTEOS_*`, `COMMERCIAL_*`, `AUDIT_REPORT.md`, `CODE_REVIEW_IMPROVEMENTS.md`, `SALES_READY_LOTEOS_BACKLOG.md`, `SPRINTS.md`, `CODEX_BACKLOG.md`.

---

## 13. Plan de ejecución

**Fase 0 — Base estable.** Build verde, hallazgos de seguridad resueltos, rutas críticas verificadas con sesión real, versión publicada visible.

**Fase 1 — Inventario impecable.** Puntaje de completitud con bloqueo bajo el mínimo, importador único de proyectos (KMZ/KML → polígonos → precios → estados), kit verificado por proyecto.

**Fase 2 — Demanda y matching.** Perfil de demanda del comprador, matching explicable, alertas y shortlist enviable por WhatsApp y PDF.

**Fase 3 — Red comercial.** Perfil público de corredor, directorio, vitrina de oportunidades con comisión, atribución captador/vendedor y ledger auditable.

**Fase 4 — Operación de venta.** Pipeline único, reserva con pago y contrato, reportería exportable de ventas, comisiones y conversión.

**Fase 5 — Diferenciación.** Escenarios visuales de desarrollo, tasación con validación pública por QR, asistente comercial con datos reales.

Orden de entrega: Fase 0 y 1 → Fases 3 y 4 (generan ingresos) → Fases 2 y 5.
