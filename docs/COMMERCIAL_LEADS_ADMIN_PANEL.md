# Commercial Leads Admin Panel

## Objetivo

Agregar una vista admin para revisar y gestionar solicitudes comerciales capturadas desde `/contacto-loteos`.

## Ruta

```txt
/admin/commercial-leads
```

## Archivos modificados

- `src/hooks/useCommercialPlanLead.ts`
- `src/pages/admin/CommercialLeadsAdmin.tsx`
- `src/routes/adminRoutes.tsx`
- `docs/COMMERCIAL_LEADS_ADMIN_PANEL.md`

## Funcionalidad incluida

- Listado de leads comerciales.
- Conteo total.
- Conteo de nuevos, contactados y calificados.
- Visualización de plan, source, empresa, contacto, email, teléfono, mensaje y fecha.
- Acciones rápidas:
  - email;
  - llamada;
  - marcar como contactado;
  - marcar como calificado;
  - marcar como cerrado;
  - marcar como perdido.

## Seguridad

La ruta está protegida con:

```tsx
DashboardLayout requiredRole="admin"
```

La consulta depende de las políticas RLS admin de `commercial_plan_leads`.

## QA sugerido

1. Aplicar migración `commercial_plan_leads`.
2. Crear un lead desde `/contacto-loteos?plan=growth-inmobiliaria&source=qa`.
3. Entrar como admin a `/admin/commercial-leads`.
4. Confirmar que el lead aparece.
5. Cambiar estado a `Contactado`.
6. Confirmar que el cambio persiste al refrescar.
7. Probar botones de email y llamada.
8. Confirmar que usuario no admin no accede a la ruta.

## Próximo paso sugerido

Agregar notificaciones internas cuando entra un lead nuevo y enviar email automático al equipo comercial.
