# PDF comerciales: motor visual compartido

El dossier, el brochure básico y el brochure con contenido IA usan `projectKit`
y el mismo shell de fichas. El panel y las páginas públicas entregan las imágenes
y contactos configurados en la landing. Precios, planos y fichas también heredan
el logo legible y enlaces activos del shell.

## Cambios

- Portada con foto, galería de hasta cuatro imágenes adicionales y logo alineado
  con el portal. Se respetan los logos personalizados del tema de fichas.
- Fotografías proporcionadas por el proyecto tienen prioridad. Valle Escondido
  usa las cuatro ilustraciones ya presentes en su landing solo cuando no hay
  imágenes configuradas; cada una se identifica como imagen referencial.
- Imágenes descargadas con timeout, decodificadas en navegador, limitadas a
  1800 px y comprimidas a JPEG. Los planos mantienen su proporción completa;
  las miniaturas de galería se recortan al marco sin deformación.
- Botones PDF y QR clicable hacia la ficha online, Google Maps y contactos
  configurados. No se incluyen números de contacto inventados.
- Vista previa del dossier con descarga del mismo archivo y liberación de la
  URL temporal al cerrar. Conserva el formulario de captación existente.
- El precio desde considera solo precios positivos y finitos de lotes disponibles.
  Estados desconocidos se muestran como por confirmar.
- Párrafos extensos continúan en nuevas páginas; logo acotado y encabezados
  recurrentes. Si una imagen falla, el dossier informa la omisión y sigue disponible.

## Validación

`src/lib/pdf/projectKit.test.ts` comprueba precios/estados, rutas canónicas,
contactos, rechazo de enlaces ejecutables, anotaciones PDF reales, proporciones,
paginación y generación sin imágenes o QR.

Verificar visualmente dossier con galería, lista de precios y documento sin
imágenes. En la web: abrir la vista previa, cerrar/reabrir y descargar;
confirmar que los contactos corresponden a la configuración del proyecto.

## Límites

El PDF es una instantánea de la fecha de descarga. Sus enlaces abren la web
actualizada; no contiene mapas animados ni inventario que cambie dentro del archivo.
Las imágenes remotas necesitan permitir CORS. No se conecta una carpeta Drive
automáticamente. No se modifican contratos, datos comerciales ni migraciones.
La configuración de branding existente sigue guardándose localmente en el navegador.
