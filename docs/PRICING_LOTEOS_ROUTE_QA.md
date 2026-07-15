# QA — ruta y CTAs planes loteos

Checklist para validar el PR:

- Abrir `/planes-loteos` y confirmar que renderiza la página de planes.
- Confirmar que el header desktop muestra `Planes Loteos` con badge `B2B`.
- Confirmar que el menú mobile muestra el mismo CTA.
- Abrir `/para-inmobiliarias` y verificar que los botones de planes apuntan a `/planes-loteos`.
- Abrir una vitrina pública `/inmobiliaria/:slug` y verificar el CTA `Crear vitrina inmobiliaria`.
- Ejecutar `npm run build` antes de release.
