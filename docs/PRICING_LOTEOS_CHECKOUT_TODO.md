# Checkout pendiente para venta de planes

## Objetivo

Conectar los planes comerciales a un flujo de pago o venta asistida.

## Opción A: Stripe Checkout

- Crear products/prices en Stripe.
- Agregar env vars para price IDs.
- Crear edge function de checkout.
- Redirigir desde pricing.
- Escuchar webhook para activar plan.

## Opción B: Venta asistida inicial

- CTA a formulario comercial.
- Capturar plan solicitado.
- Crear lead interno para cierre manual.
- Activar plan manualmente desde admin.

## Recomendación

Partir con venta asistida para validar pricing y demanda. Luego integrar Stripe para automatizar.
