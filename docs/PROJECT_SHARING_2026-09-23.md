# Compartir y convertir — proyectos

## Cambios

- `projectSocial` centraliza título, foto, URL, precio mínimo y disponibilidad. Solo los lotes con estado `available` aportan al precio y conteo; datos aún no cargados no se presentan como cero.
- El build genera HTML inicial para `/proyecto/:uuid`, `/p/:slug` y canónicas históricas. Conserva el bundle React: los enlaces antiguos siguen abriendo la ficha, mientras compartir y canonical apuntan a la landing comercial.
- Se consulta únicamente la API pública con clave publicable y el RPC sin datos de compradores `get_public_lots`. Solo se exportan proyectos `active`; no se usa service role ni se persiste el JSON completo del proyecto.
- Una respuesta fallida de la API hace fallar el build, evitando publicar tarjetas con inventario inventado. Los slugs se validan antes de escribir rutas y los metadatos escapan HTML.
- La landing genérica permite compartir la parcela seleccionada con `?lote=UUID`; al abrir el enlace recupera su ficha, incluso si ya está reservada o vendida. La tarjeta del enlace sigue siendo la del proyecto y el texto compartido incluye los datos del lote.
- La ficha de proyecto reutiliza `LandingLeadForm` / `submit-interest` para agendar o consultar. Las consultas enviadas se guardan en el CRM existente con proyecto, lote cuando corresponde y parámetros de campaña permitidos. Abrir WhatsApp no se registra como lead ni como conversación enviada.
- Copiar enlace solo confirma éxito cuando el portapapeles responde correctamente.

## Publicación y vigencia

Las tarjetas sociales son una instantánea del último build, no inventario en tiempo real. Después de editar foto, precio, estado o publicación, ejecutar un nuevo build/deploy. El sitio continúa consultando el inventario vivo. WhatsApp puede conservar tarjetas anteriores en su propia caché.

`dist/project-previews.json` informa fecha y rutas generadas. El hosting debe servir los archivos `ruta/index.html` antes del fallback SPA; Apache ya conserva archivos y directorios físicos. Al desplegar se debe reemplazar el bundle completo o eliminar rutas retiradas, para no conservar tarjetas de proyectos despublicados. Confirmar esta resolución en el hosting efectivo (Lovable) antes de dar la mejora por validada en producción.

## Validación

1. CI: pruebas unitarias y build; revisar el mensaje `Project social HTML` y el reporte generado.
2. HTTP sin JavaScript: abrir `/p/:slug` y `/proyecto/:uuid` y confirmar un solo `og:title`, `og:image`, `og:description` y canonical específicos.
3. Abrir ambas URLs en móvil y comprobar que React carga y mantiene el inventario funcional.
4. Compartir un lote desde una landing genérica y abrir el enlace en otra sesión. Debe mostrar exactamente ese lote.
5. En staging enviar una consulta identificable y comprobar proyecto/lote/campaña en el CRM, sin crear registros de prueba en producción.
6. Tras desplegar, compartir un enlace en una conversación nueva de WhatsApp. No asumir que una tarjeta antigua se refresca inmediatamente.

## Límites deliberados

No reemplaza landings a medida ni rediseña CRM/ERP. No migra datos ni envía correos/WhatsApp. Las URLs con `?lote=` no tienen imagen Open Graph independiente del proyecto. Actualización inmediata de metadatos al editar inventario requiere renderizado en servidor o un disparador de publicación; queda fuera de esta entrega estática.
