# Agent Dashboard Activity Feed

## Objetivo

Responder al comentario P2 de Codex en PR #67: el feed de actividad debe estar montado en un dashboard realmente ruteado.

## Cambio

`TeamActivityFeed` se monta ahora en `DashboardAsesor`, que se renderiza en la ruta viva:

```txt
/asesor/dashboard
```

## Razón

`DashboardInmobiliaria` estaba exportado de forma lazy, pero no aparecía montado en las rutas operativas revisadas. Por eso el feed agregado ahí podía quedar inaccesible en producción.

## QA sugerido

- Entrar como asesor a `/asesor/dashboard`.
- Confirmar que aparece la tarjeta de actividad reciente.
- Confirmar que el feed usa las notificaciones existentes.
- Confirmar que el dashboard carga aunque no existan notificaciones.
