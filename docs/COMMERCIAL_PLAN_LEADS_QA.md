# QA — commercial plan leads

Checklist:

- Aplicar migración `20260715154000_create_commercial_plan_leads.sql`.
- Abrir `/contacto-loteos?plan=growth-inmobiliaria&source=qa`.
- Enviar formulario con email válido.
- Confirmar que aparece mensaje de éxito.
- Confirmar registro en `commercial_plan_leads`.
- Confirmar que usuario público no puede leer la tabla.
- Confirmar que admin puede leer y actualizar leads.
