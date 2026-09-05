# Material descargable en PDF para todos los proyectos + mejoras del sistema

Hoy el PDF de proyecto (brochure) sólo existe dentro del panel privado y la ficha PDF de parcela
sólo está enchufada en algunas páginas (Valle Escondido, fichas de lote del panel). En las páginas
públicas de proyecto no hay descargas. La idea es que **cualquier proyecto**, tenga o no página a
medida, ofrezca su material listo para descargar y compartir.

## Qué se va a hacer

**1. Kit de descargas único por proyecto**

Cada proyecto genera, sin configuración previa:

- **Dossier del proyecto (PDF)**: portada con imagen, resumen, indicadores (parcelas, superficies,
  precios desde/hasta, disponibilidad), plano satelital con los polígonos, condiciones comerciales,
  puntos de interés cuando existan, contacto y QR a la página del proyecto.
- **Lista de precios (PDF y Excel/CSV)**: tabla con número de parcela, superficie, precio,
  precio por m² y estado, con fecha de emisión.
- **Ficha de parcela (PDF)**: la que ya existe, disponible ahora en todas las páginas de proyecto
  y en la ficha pública de cada parcela, con su QR.
- **Plano del loteo (PDF)**: lámina con el masterplan y la numeración.

Todo con la identidad de OFERTA TERRENOS y el mismo formato de informes ya definido.

**2. Dónde aparecen**

- Bloque "Material del proyecto" en la página pública de cada proyecto (motor `/p/:slug` y las
  páginas a medida: Explora Park, Huellelhue, Playa Álvaro, Forestal, Valle Escondido).
- Botón de descarga en la ficha pública de cada parcela.
- En el panel: la pestaña de brochure pasa a usar el mismo kit, más un botón de descarga masiva
  de todas las fichas del proyecto.
- Se registra cada descarga como evento (para saber qué proyecto genera interés) y, si el
  visitante no ha dejado datos, se pide nombre + contacto antes de la descarga en la web pública:
  cada descarga entra como lead al proyecto y queda atribuida al corredor si viene con su código.

**3. Mejoras al sistema (basadas en los mejores portales de terrenos)**

Revisadas las referencias del rubro (LandSearch, LandWatch y la red Land.com), lo que nos falta y
tiene más impacto comercial:

- **Búsqueda por uso y estilo de vida**: accesos rápidos tipo "parcelas con agua", "orilla de lago",
  "cerca de playa", "off-grid", "agrícola", "para cabaña" en vez de sólo filtros numéricos.
- **Dibujar en el mapa para buscar** y búsqueda "cerca de mí".
- **Video y recorrido en la tarjeta** del proyecto, no sólo foto fija.
- **Datos del terreno visibles siempre**: superficie, topografía, accesos, servicios y distancias,
  homogéneos en todas las fichas.
- **Comparador y "guardar búsqueda con aviso"** más visibles.
- **Ranking de resultados** que priorice proyectos completos y publicaciones con material completo
  (fotos, plano, PDF), no antigüedad.

Estas mejoras se listan aquí como hoja de ruta; en esta entrega se implementa el kit de descargas
completo y, de las mejoras, las dos más rápidas: accesos rápidos por uso y el orden de resultados
por completitud. El resto queda propuesto para la siguiente iteración.

## Detalle técnico

- Nuevo `src/lib/pdf/projectKit.ts` sobre `fichaShell.ts` + `fichaTheme.ts`, con
  `generateProjectDossierPdf`, `generateProjectPriceListPdf`, `generateProjectMasterplanPdf`
  y `exportProjectPriceListCsv`. Reutiliza `qrUrl`, mapa estático Mapbox (`useStaticMapToken`)
  y `normalizePolygon` para el plano.
- `src/lib/brochurePdfGenerator.ts` queda como envoltorio del nuevo dossier (mantiene el contenido
  IA opcional de `useBrochureGenerator`) para no romper `ProjectBrochureTab`.
- Nuevo componente compartido `src/components/projects/ProjectDownloads.tsx` (+ hook
  `useProjectDownloads`) que recibe proyecto + lotes y renderiza las tarjetas de descarga.
  Se inserta en `ProjectLanding.tsx` y en las 5 landings a medida.
- Gate de lead: `LandingLeadForm` existente en modo compacto antes de la descarga cuando no hay
  sesión ni lead previo (marca en `localStorage`); envío por el flujo actual de leads y
  `useTrackEvent` para el evento `project_pdf_download`.
- Descarga masiva de fichas: iteración sobre `generateLotDataCardPdf` empaquetada con `jszip`
  (dependencia nueva) sólo en el panel.
- Accesos rápidos por uso: chips en `/explorar` mapeados a `tags`/`use` existentes; orden por
  completitud calculado en el hook de listados (sin cambios de esquema).
- Sin migraciones de base de datos.

## Fuera de alcance

- Búsqueda dibujando en el mapa, video en tarjetas y panorámicas 360 (quedan propuestas).
- Fotos reales de los proyectos.
