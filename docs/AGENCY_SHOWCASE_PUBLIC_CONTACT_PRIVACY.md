# Agency Showcase Public Contact Privacy

## Objetivo

Corregir el riesgo de privacidad detectado por Codex: la vitrina pública no debe exponer `profiles.phone` porque ese campo puede venir de onboarding o perfil privado.

## Cambio aplicado

Se agrega un campo separado:

```txt
profiles.public_whatsapp
```

Este es el único número que la RPC pública `get_agency_by_slug` retorna para mostrar WhatsApp en `/inmobiliaria/:slug`.

## Campos

- `profiles.phone`: teléfono privado/perfil interno.
- `profiles.public_whatsapp`: teléfono opt-in para publicación en vitrina.

## Archivos modificados

- `supabase/migrations/20260712120000_showcase_featured_whatsapp.sql`
- `src/hooks/useAgencyShowcase.ts`
- `src/components/agency/AgencyShowcaseSettings.tsx`
- `src/pages/AgencyShowcase.tsx`

## Comportamiento esperado

- Si `public_whatsapp` está vacío, no se muestra botón WhatsApp público.
- Si `public_whatsapp` tiene valor, la vitrina muestra el botón WhatsApp.
- `phone` deja de ser retornado por `get_agency_by_slug`.

## QA sugerido

- Aplicar migración con `npx supabase db push`.
- Confirmar que una inmobiliaria pública con `phone` pero sin `public_whatsapp` no muestra WhatsApp.
- Guardar un `public_whatsapp` desde settings.
- Confirmar que aparece el botón WhatsApp en la vitrina pública.
- Confirmar que la RPC no retorna `phone`.
