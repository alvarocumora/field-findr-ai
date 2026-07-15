# Ruta pública y CTAs — planes loteos

## Objetivo

Activar la página comercial de planes de gestión de loteos y agregar entradas visibles hacia ella.

## Ruta pública

- `/planes-loteos`

## Archivos modificados

- `src/routes/publicRoutes.tsx`
- `src/components/navigation/StickyHeader.tsx`
- `src/pages/marketing/InmobiliariasLanding.tsx`
- `src/pages/AgencyShowcase.tsx`

## CTAs agregados

- Navegación pública: `Planes Loteos` con badge `B2B`.
- Landing `/para-inmobiliarias`: botones principales y planes apuntan a `/planes-loteos`.
- Vitrina pública `/inmobiliaria/:slug`: footer con CTA `Crear vitrina inmobiliaria`.

## Alcance

Este PR no agrega checkout ni captura avanzada de demo. Deja la conversión pública lista para el siguiente paso: formulario comercial con plan seleccionado o checkout.

## QA sugerido

- Abrir `/planes-loteos`.
- Verificar navegación desktop y mobile.
- Abrir `/para-inmobiliarias` y confirmar CTAs hacia `/planes-loteos`.
- Abrir una vitrina pública y confirmar CTA de creación de vitrina.
- Ejecutar `npm run build`.
