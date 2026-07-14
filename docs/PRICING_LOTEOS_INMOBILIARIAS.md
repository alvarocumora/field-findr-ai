# Pricing para gestión de loteos inmobiliarios

## Objetivo

Crear una primera página comercial para vender planes de gestión de loteos a inmobiliarias.

## Página agregada

- `src/pages/PricingLoteos.tsx`

## Planes propuestos

### Starter Loteo

Pensado para corredores o inmobiliarias pequeñas que necesitan publicar y validar un loteo.

Incluye:

- 1 proyecto activo.
- Hasta 50 lotes.
- Vitrina pública.
- Captura de leads.
- Dashboard básico.

### Growth Inmobiliaria

Plan recomendado para equipos comerciales que venden varios loteos.

Incluye:

- Hasta 5 proyectos activos.
- Hasta 500 lotes.
- CRM y pipeline.
- Reservas y pagos.
- Dashboard multi-proyecto.
- Vitrina con proyectos destacados.
- Feed de actividad.

### Enterprise Loteos

Plan para inmobiliarias con múltiples proyectos, roles y necesidades de reporting ejecutivo.

Incluye:

- Proyectos y lotes según contrato.
- Roles comerciales.
- Reportes ejecutivos.
- Implementación acompañada.
- Integraciones.

## Pendiente para venta completa

1. Conectar esta página a una ruta pública, por ejemplo `/planes-loteos` o `/pricing`.
2. Conectar CTA a checkout real o formulario comercial.
3. Mapear los planes a límites técnicos en `usePlanLimits`.
4. Activar upgrade prompts dentro del dashboard.
5. Definir prices/IDs de Stripe si se usa checkout.

## QA sugerido

- Ejecutar `npm run build`.
- Revisar copy comercial en desktop/mobile.
- Validar que los CTA apunten a rutas existentes antes de publicar.
