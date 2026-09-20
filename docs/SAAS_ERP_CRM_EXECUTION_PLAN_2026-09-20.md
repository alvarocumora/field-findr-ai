# Plan de ejecución SaaS ERP/CRM

Fecha: 20-09-2026
Producto: OfertaTerrenos / Rural Finder

## Norte del producto

OfertaTerrenos tendrá tres superficies separadas:

1. Marketplace público y portal comprador.
2. Workspace SaaS para corredores, inmobiliarias y desarrolladores.
3. Administración interna de la plataforma.

La unidad de propiedad B2B será la organización. Los usuarios podrán participar en una o más organizaciones, con permisos por capacidad. El plan contratado controlará funcionalidades y límites, no permisos humanos.

## Fase 1 — Workspaces y catálogo único

Estado: en ejecución.

- [x] Resolver todas las organizaciones propias y por membresía.
- [x] Persistir un workspace activo por usuario.
- [x] Invalidar datos comerciales al cambiar de workspace.
- [x] Mostrar el selector de organización en el panel.
- [x] Usar el catálogo central de planes en la landing de loteos.
- [ ] Migrar suscripciones desde usuario hacia organización.
- [ ] Incorporar prueba E2E con dos organizaciones.

Criterio de salida: una persona puede operar dos inmobiliarias sin mezclar equipo ni datos visibles; marketing y dashboard muestran los mismos planes.

## Fase 2 — Permisos organizacionales

- Roles base: propietario, administrador, gerente comercial, ejecutivo, operaciones, finanzas, corredor externo y solo lectura.
- Capacidades: proyectos, inventario, CRM, reservas, cierres, pagos, comisiones, reportes, equipo y facturación.
- RLS basada en membresía y capacidad, no en el dueño personal de cada fila.
- Acceso de corredor externo limitado por proyecto.
- Auditoría de cambios sensibles.

Criterio de salida: los datos sobreviven al cambio de un vendedor y cada acción sensible se autoriza en servidor.

## Fase 3 — CRM canónico

- Crear entidades canónicas: contactos, oportunidades y actividades.
- Convertir lead en origen de contacto/oportunidad.
- Unificar CRMSystem y SalesPipeline.
- Integrar llamadas, mensajes, reuniones, visitas y seguimientos como actividades.
- Migrar ClientsBook para dejar de reconstruir clientes en el navegador.
- Mantener redirects desde módulos heredados.

Criterio de salida: existe una sola identidad del cliente y un solo pipeline auditable.

## Fase 4 — ERP de proyectos, ventas y finanzas

- Workspace de proyecto: resumen, inventario, mapa, precios, documentos, CRM, reservas, ventas y analítica.
- Flujo continuo: cotización → reserva → contrato/cierre → pago → comisión.
- Consolidar gestión de proyectos, lotes, inventario, mapa y centro de loteos.
- Consolidar pagos, comisiones y reportes financieros.
- Incorporar importación, exportación e integraciones.

Criterio de salida: una inmobiliaria administra la operación completa sin cambiar entre módulos duplicados.

## Fase 5 — Navegación, analítica y retiro de legado

- Reducir navegación privada a: Inicio, CRM, Proyectos, Ventas, Finanzas, Analítica, Equipo y configuración.
- Mantener administración de plataforma en contexto separado.
- Consolidar dashboards y definiciones de KPI.
- Medir uso de aliases y rutas antiguas.
- Eliminar componentes heredados solo después del periodo de compatibilidad.

Criterio de salida: cada dato tiene una fuente y cada proceso una pantalla principal.

## Reglas de implementación

- Cambios pequeños mediante PR y con rollback simple.
- Ninguna migración destructiva.
- Escritura dual o backfill antes de cambiar lecturas.
- Compatibilidad temporal mediante aliases.
- CI obligatorio: tests, lint y build.
- Validación manual por comprador, corredor, inmobiliaria y administrador.
- No agregar módulos si la capacidad puede vivir dentro de un hub existente.

## Indicadores de éxito

- Menos de 8 grupos de navegación privada.
- Reducción mínima de 35% de rutas operativas visibles.
- Cero precios o límites duplicados fuera del catálogo canónico.
- 100% de registros B2B nuevos con organization_id.
- Un solo pipeline comercial.
- Un solo cálculo por KPI.
- Cero lecturas entre organizaciones en pruebas RLS.
