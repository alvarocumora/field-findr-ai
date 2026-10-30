# Portada orientada a descubrimiento y captación

## Problema
La portada anterior conservaba una secuencia de módulos grandes independientes: hero, catálogo, calculadora, pilares y cierre comercial. Reducir repeticiones de proyectos no resolvía esa fragmentación ni incorporaba una captación breve en la propia página.

## Referencia y decisión de producto
Se consultó el contenido público de [idealista](https://www.idealista.com/): búsqueda territorial como tarea principal, con servicios complementarios separados. LandSearch, Land.com y Portal Inmobiliario devolvieron HTTP 403 desde este entorno; no se atribuyen hallazgos a páginas que no pudieron consultarse. Esta es una nueva composición propia con los tokens Rural Institutional existentes.

La página tiene tres secciones principales:

1. **Encontrar:** una imagen panorámica local, propuesta breve y búsqueda por ubicación, tipo y presupuesto; esos filtros siguen llegando al explorador del inventario existente. Sin otro proyecto destacado dentro del hero.
2. **Explorar:** una sola colección, hasta seis proyectos activos, ordenados por destacado y fecha. Precio mínimo y disponibilidad provienen de los lotes públicos; tours solo con escenas existentes. Enlace al catálogo completo para continuar.
3. **Dejar una solicitud:** nombre y teléfono obligatorios, zona y presupuesto opcionales y autorización explícita de contacto. Se utiliza `useCreateMeetingRequest` con `reunion_comercial` y fuente `portada_asesoria`; preferencias en `context`, visibles en la bandeja comercial existente. No se abre una segunda base de leads ni se confirma una cita/reserva.

La portada usa navegación de compra y un footer compacto. Los enlaces profesionales quedan en el footer. Las demás páginas conservan el footer y la navegación pública existentes; los accesos autenticados siguen disponibles.

## Simulador bajo demanda
El simulador existente se carga de forma diferida en un diálogo accesible. Se mantienen `/?creditPrice=...&creditLot=...#simula-tu-cuota`, sus límites finitos, PDF, cálculo e intención CRM existentes. El cierre elimina únicamente el hash; conserva precio, lote y campaña. Su contexto sigue identificado como Valle Escondido · Licantén y sus valores son referenciales. No se publican cuotas universales en tarjetas de otros proyectos.

## Verificación
- TypeScript, lint y build de producción locales.
- Pruebas de captación: respuesta aceptada, error con borrador recuperable y bloqueo de envío duplicado mientras existe una solicitud en curso.
- Chromium local en 320/390/1440: CTA inicial dentro del viewport, una colección sin repetición, imagen principal cargada, sin overflow, consentimiento requerido, error/reintento/confirmación y apertura/cierre/reapertura del simulador con contexto.
- La evidencia `docs/audits/2026-10-30-landing-discovery/browser.json` usa inventario y respuestas de envío simulados. No certifica un envío real en producción ni crea leads, reservas o pagos.
- El smoke de CI añade los recorridos de captación con POST interceptado y enlaces históricos al simulador, además de la navegación pública existente.

## Medición posterior
La mejora de conversión es una hipótesis: medir búsquedas iniciadas, apertura de fichas, inicio y envío aceptado del formulario y solicitudes comerciales atendidas antes de afirmar un aumento. La prueba visual no acredita condiciones de financiamiento ni antecedentes legales de proyectos.
