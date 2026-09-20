# Auditoría consolidada del ecosistema OfertaTerrenos

**Fecha:** 20 de septiembre de 2026  
**Repositorio:** `alvarocumora/field-findr-ai`  
**Fuente revisada:** `main` en `d7c50caadd6ee8fe8e16dd54d921e98a5a5b4f2f`  
**Producción:** https://ofertaterrenos.com

## Resultado ejecutivo

**Estado global: AMARILLO — código validado, producción desactualizada.**

El repositorio está consolidado y la última entrega aprobó typecheck, pruebas unitarias y build de producción. Las rutas públicas principales responden y los paneles privados redirigen correctamente a autenticación.

La brecha crítica está en el despliegue: producción no contiene las dos últimas mejoras fusionadas en `main` y `/version.json` responde 404. Por tanto, no se puede demostrar qué commit está publicado y la sincronización GitHub → Lovable no es confiable.

## Evidencia principal

| Área | Estado | Evidencia |
|---|---|---|
| Rama `main` | OK | HEAD auditado: `d7c50ca...` |
| CI del PR #132 | OK | Typecheck, pruebas y build completados correctamente |
| Rutas públicas | OK parcial | 15/15 rutas críticas renderizaron sin 404 ni pantalla de error |
| Datos públicos | OK | Portada mostró 4 proyectos, 652 lotes y 236 publicaciones activas |
| Protección de paneles | OK | `/panel`, `/asesor/loteos` y `/admin/dashboard` redirigen a `/auth?redirect=...` |
| Despliegue Lovable | CRÍTICO | Producción no muestra cambios de los PR #131 y #132 |
| Trazabilidad de versión | CRÍTICO | `/version.json` responde 404 |
| Apertura directa del predictor | PENDIENTE EN PRODUCCIÓN | `/tools?tab=price-predictor` abre todavía el asistente general |
| Mapbox/WebGL | REVISAR | El navegador cloud sin WebGL registró fallo de inicialización; validar fallback en equipos incompatibles |

## Rutas públicas comprobadas

Todas renderizaron sin 404 ni error global:

- `/`
- `/explorar`
- `/search`
- `/quiz`
- `/tools?tab=price-predictor`
- `/comunidad`
- `/referidos`
- `/brokers`
- `/brokers/inscripcion`
- `/planes-loteos`
- `/para-inmobiliarias`
- `/contacto-loteos`
- `/mercado`
- `/comparar`
- `/alertas`
- `/eventos`

### Protección de acceso comprobada

- `/panel` → autenticación con retorno a `/panel`
- `/asesor/loteos` → autenticación con retorno al control de loteos
- `/admin/dashboard` → autenticación con retorno al panel administrativo

Esta prueba confirma la barrera pública, pero no reemplaza pruebas de permisos RLS con usuarios comprador, asesor y administrador.

## Diferencia entre GitHub y producción

En `main` sí existen:

- `OpportunityHubSection` conectado al landing.
- Fotografías reales de proyectos en las tarjetas del landing.
- Match, tasación, comunidad, referidos y programa de consultores.
- Incentivos de $100.000 por referido cerrado y desde $500.000 por venta como consultor.
- Apertura del predictor mediante `?tab=price-predictor`.
- Indicador de preparación comercial en Control de Loteo.
- Demo visual `LoteoDashboardPreview` para inmobiliarias.

En producción no se encontraron los textos/marcadores:

- “Activa tu oportunidad”.
- “$100.000”.
- “Desde $500.000”.
- “El panel que recibe tu equipo”.
- “Control de Loteo · Proyecto Mirador”.

Conclusión: producción está detrás de `main`.

## Cobertura técnica del repositorio

- 1.375 archivos rastreados.
- 33 archivos de pruebas unitarias.
- 121 migraciones SQL.
- 28 Supabase Edge Functions.
- 43 documentos técnicos.
- 2 workflows: CI y despliegue DreamHost.

### Funciones críticas identificadas

1. **Descubrimiento y compra**
   - Atlas, mapa, explorador, búsqueda natural, quiz/match, favoritos, comparación y alertas.
2. **Proyecto y parcela**
   - Fichas, experiencia inmersiva, inventario, planos, cotizaciones, visitas y reservas.
3. **Tasación y análisis**
   - Predictor, plusvalía, comparación, SII, tasación verificable y anclaje.
4. **Comunidad y crecimiento**
   - Brokers, inscripción, ranking, comunidad, referidos y atribución.
5. **Operación de loteos**
   - Proyectos, lotes, precios masivos, publicación, leads, CRM, reservas, pagos, cierres y comisiones.
6. **Gestión empresarial**
   - Equipos, roles, multi-proyecto, BI, finanzas, reportes, API y webhooks.
7. **Administración**
   - Usuarios, aprobaciones, proyectos, brokers, ventas, comisiones, auditoría y soporte.
8. **Infraestructura**
   - Supabase, RLS, Edge Functions, Mercado Pago, Mapbox, sitemap, PWA y despliegue.

## Riesgos priorizados

### P0 — Resolver antes de nuevas funciones

1. **Producción no corresponde a `main`.**
   - Publicar exactamente el commit auditado o uno posterior.
   - Evitar que Lovable trabaje desde una copia o snapshot antiguo.

2. **No existe identificación del release.**
   - Generar `/version.json` en cualquier proveedor de build, no sólo en el workflow DreamHost.
   - Debe incluir commit, fecha UTC y proveedor.

3. **Hay dos relatos de despliegue.**
   - El repositorio contiene `deploy-dreamhost.yml`, pero la operación declarada usa Lovable.
   - Definir una sola fuente de despliegue o documentar expresamente el fallback.

### P1 — Validación funcional crítica

1. Probar roles y RLS con comprador, asesor y administrador.
2. Validar el ciclo lote disponible → reservado → vendido.
3. Evitar doble reserva y confirmar expiración automática.
4. Validar comisión potencial → reservada → devengada → aprobada → pagada.
5. Probar Mercado Pago sólo en sandbox, incluidos webhooks e idempotencia.
6. Verificar las 28 Edge Functions desplegadas y sus secretos, sin exponer valores.
7. Comprobar publicación de proyectos/lotes y aislamiento por organización.
8. Validar formularios de contacto, inscripción broker y referidos sin duplicados.

### P2 — Calidad y experiencia

1. Añadir smoke tests de rutas públicas al CI.
2. Añadir validación de que `/version.json` coincide con el commit desplegado.
3. Añadir `npm run lint` al control de calidad una vez corregida la deuda existente.
4. Regenerar y fijar `package-lock.json` para volver de `npm install` a `npm ci`.
5. Verificar fallback accesible cuando WebGL/Mapbox no esté disponible.
6. Añadir encabezados `h1` semánticos donde hoy no aparecen.
7. Corregir título SEO genérico de `/eventos`.

## Criterios de aceptación de la consolidación

La consolidación queda aprobada sólo cuando:

- Producción muestra los marcadores de los PR #131 y #132.
- `/version.json` devuelve el SHA publicado y coincide con `main`.
- Typecheck, pruebas, build y smoke tests pasan.
- Las rutas críticas funcionan en escritorio y móvil.
- Los roles comprador/asesor/admin respetan permisos y alcance de datos.
- Reserva, venta, pago y comisión son idempotentes y trazables.
- Lovable entrega un reporte de cambios, pruebas, bloqueos y evidencia de producción.

## Límites de esta auditoría

No se enviaron formularios ni se generaron datos reales. Tampoco se ejecutaron cobros ni pruebas profundas dentro de paneles autenticados, porque requieren cuentas de prueba por rol y un entorno de pagos sandbox. Esas validaciones quedan incluidas como obligación del prompt de Lovable.
