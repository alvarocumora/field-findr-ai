# Pricing Loteos — CTAs hacia captura comercial

## Objetivo

Conectar los CTAs principales de `/planes-loteos` con el formulario comercial `/contacto-loteos`, enviando parámetros `plan` y `source` para trazabilidad.

## Cambios

- Hero principal apunta a:
  - `/contacto-loteos?plan=growth-inmobiliaria&source=planes-loteos-hero`
- Hero secundario apunta a:
  - `/contacto-loteos?plan=enterprise-loteos&source=planes-loteos-hero-secondary`
- Cada card de plan apunta a:
  - `/contacto-loteos?plan=<plan-key>&source=planes-loteos-card`
- CTA final apunta a:
  - `/contacto-loteos?plan=growth-inmobiliaria&source=planes-loteos-footer`

## Plan keys

- `starter-loteo`
- `growth-inmobiliaria`
- `enterprise-loteos`

## QA sugerido

- Abrir `/planes-loteos`.
- Click en CTA principal y confirmar query params.
- Click en cada plan y confirmar plan correcto.
- Enviar formulario desde cada plan.
- Confirmar que `commercial_plan_leads.plan_key` y `source` quedan persistidos.

## Próximo paso

Crear panel admin para revisar y gestionar leads comerciales capturados.
