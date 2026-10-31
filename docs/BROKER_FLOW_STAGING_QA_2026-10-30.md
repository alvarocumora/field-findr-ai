# OfertaTerrenos — verificación del circuito Broker → Venta → Comisión

**Alcance:** Valle de Hualañé y Valle Escondido Licantén. Este documento no representa aprobación de pagos.

## Cambios de este PR

- Cierre de reserva pagada mediante `register_project_broker_sale`; exige vendedor activo y aprobado para el proyecto, mantiene la atribución del cliente validada en la reserva y genera los dos importes CLP independientes cuando corresponde.
- La función de cierre NO asigna por defecto la comisión al propietario, no acepta un referidor arbitrario y no registra un pago real.
- Cierre heredado por porcentaje (`register_sale`, ambos overloads) y registro manual (`admin_register_manual_sale`) bloqueados exclusivamente para estos dos proyectos, hasta incorporar un flujo de venta manual con la misma validación de atribuciones.
- El cierre se bloquea si vendedor y captador son la misma persona hasta definir la condición comercial para ese caso. Se conserva un único registro de comisión por reserva activa.
- Landing de brokers y dashboard sin promesas de mínimos universales ni porcentajes falsos para las comisiones fijas.

## Prerrequisitos de MIGRACIÓN, en este orden

1. Historial completo de migraciones anteriores `supabase/` (verificar también si se despliegan `drizzle/`).
2. `20260928223000_canonical_sales_ledger.sql` — tabla `sales` y triggers.
3. `20261030140000_public_reservation_form.sql` — reserva pública.
4. `20261030180000_project_fixed_commissions.sql` — montos CLP, normalización y revocación de marcado de pago.
5. `20261030181000_public_reservation_broker_attribution.sql` — captación validada.
6. `20261030223000_hualane_sale_commission_750k.sql` — Hualañé $750.000 por venta.
7. `20261030234000_broker_sale_attribution_hardening.sql` — RPC de cierre explícito y guardas porcentuales.
8. `20261030234500_block_manual_fixed_commission_sales.sql` — guarda registro manual.

**No ejecutar solo las últimas migraciones contra una base sin los prerrequisitos.** Inspeccionar primero las migraciones ya registradas en el despliegue y respaldar la base. No activar en producción antes de la revisión en staging.

## Preflight SQL (solo lecturas)

```sql
SELECT to_regclass('public.sales') IS NOT NULL AS canonical_sales_present;
SELECT column_name FROM information_schema.columns
 WHERE table_schema='public' AND table_name='commission_rules' AND column_name='fixed_sale_amount';
SELECT p.name,cr.fixed_sale_amount,cr.referral_fixed_amount,cr.is_active
 FROM public.commission_rules cr JOIN public.projects p ON p.id=cr.project_id
 WHERE p.id IN ('761e73ed-cc0d-5605-a06a-4a4348523b4b','b4363fda-e99f-400d-ae95-2cbc8244b770');
SELECT p.proname,pg_get_function_identity_arguments(p.oid) args
 FROM pg_proc p WHERE p.pronamespace='public'::regnamespace
 AND p.proname IN ('register_project_broker_sale','list_project_closing_brokers','register_sale');
SELECT tgname FROM pg_trigger WHERE tgrelid='public.reservations'::regclass
 AND tgname='trg_resolve_public_reservation_broker';
```

## Casos E2E con datos FICTICIOS, exclusivamente staging

| Caso | Acción | Esperado |
| --- | --- | --- |
| A | Broker postula y admin aprueba | Perfil activo; no existe comisión |
| B | Broker solicita proyecto y propietario aprueba | Acceso al kit; link `?ref=` con código real del perfil |
| C | Comprador de prueba abre enlace de broker y reserva | Captador asignado **solo si** broker está activo y aprobado; aún no hay comisión ganada |
| D | Reserva impaga o sin autorización | Cierre rechazado |
| E | Propietario elige vendedor aprobado distinto del captador y registra venta pagada Hualañé | 1 comisión venta $750.000; 1 captación $200.000 en la misma operación; ninguno `paid` |
| F | Igual para Licantén | $1.000.000 y $350.000 |
| G | Sin `ref` válido en reserva | Comisión del vendedor sin inventar bono de captación |
| H | Vendedor no autorizado o suspendido | Cierre rechazado, reserva intacta |
| I | Vendedor = captador | Requiere revisión comercial; cierre rechazado |
| J | Repetir la misma conversión | Se rechaza, no hay duplicado ni doble pago |
| K | Intentar cierre por `register_sale` en estos proyectos | Rechazado; legacy aún disponible para otros proyectos |
| L | Admin intentar crear venta fija manual porcentual | Rechazado; registrar cierre desde reserva verificada |
| M | Asesor llama `mark_commission_paid` o `mark_referral_paid` | Permiso denegado |
| N | Admin valida reglas sin ingresar pagos | Tarifario y saldos de 2 proyectos correctos |

**Regla de negocio pendiente de aprobación:** coincidencia del mismo vendedor y captador, venta fuera del flujo de reserva, hito de devengo, comprobante, impuestos, medio y plazo de pago. No se automatiza ninguno de estos supuestos.

## Estado de base consultada antes del PR

En la base Lovable Remix inspeccionada por SELECT no estaban `public.sales`, `fixed_sale_amount`, ni el trigger de captación; no había asignaciones de brokers aprobadas. El código GitHub `main` estaba avanzado, pero ello no certificaba base desplegada.

## Criterio de liberación

CI verde + migración en **staging** aplicada + tests E2E autenticados + aprobación de dueño del proceso financiero. Después se puede planificar un merge a `main` y deploy controlado, que son acciones diferentes.
