# PropertyDetail Visual Scenarios Integration — Sprint 3.2

## Objetivo

Integrar `VisualScenarioViewer` en la ficha real de propiedad de forma condicional y segura, sin conectar todavía Supabase ni modificar el flujo general de propiedades.

## Alcance aplicado

La integración se limita inicialmente a la propiedad industrial Teno/packing existente.

Condición actual:

- Si la propiedad corresponde a `TENO_LISTING_ID`, se muestran `mockVisualScenarios`.
- Si no corresponde, no se muestra el módulo y la ficha mantiene su comportamiento anterior.

## Archivos modificados

- `src/pages/PropertyDetail.tsx`
- `docs/PROPERTY_DETAIL_VISUAL_SCENARIOS.md`

## Comportamiento

En fichas Teno:

- Se muestra el viewer después de la sección `Visión del Proyecto`.
- Usa mock scenarios controlados.
- El botón `Analizar con IA` muestra toast informativo.
- El botón `Descargar ficha PDF` muestra toast informativo.
- No se ejecuta IA real.
- No se genera PDF real.
- No se consulta Supabase.

En otras fichas:

- No se muestra nada nuevo.
- No cambia el layout.
- No cambia la lógica de contacto, mapa, PDF existente ni favoritos.

## Razón de diseño

La integración se hace sobre una propiedad específica para validar impacto visual en ficha real sin introducir dependencia de datos productivos ni alterar propiedades que aún no tienen escenarios.

## Próximos pasos

1. Crear hook `useVisualScenarios(propertyId)`.
2. Agregar tabla Supabase `visual_scenarios`.
3. Reemplazar mock data por consulta real.
4. Mantener fallback: si no hay escenarios, no mostrar el viewer.
5. Conectar análisis IA de escenario.
6. Conectar PDF de escenario.
7. Integrar viewer 3D/GLB en una fase posterior.

## QA sugerido

- Abrir ficha Teno y verificar que aparece `Escenarios visuales sobre este terreno`.
- Cambiar entre escenarios.
- Probar `Analizar con IA` y confirmar toast.
- Probar `Descargar ficha PDF` y confirmar toast.
- Abrir otra ficha y confirmar que no aparece el módulo.
- Revisar mobile.
- Confirmar que CTA WhatsApp, contacto, mapa y PDF existente siguen funcionando.

## Riesgo

Medio-bajo: toca `PropertyDetail`, pero la condición limita el cambio a la propiedad Teno. No introduce persistencia ni efectos secundarios productivos.
