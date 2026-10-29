# Rural Finder — pipeline maestro de assets

## Fuente de verdad

Google Drive maestro:
https://drive.google.com/drive/folders/1gMII9e43F-lPA0tWSr8EW-yggBIL74S2

Esta carpeta es la fuente de verdad para originales y material comercial de Rural Finder. La web no debe tratar archivos optimizados o assets importados dentro del bundle como originales maestros.

## Estructura

- `00_Marca`: logos, isotipos, versiones de marca y recursos corporativos.
- `01_Proyectos`: material organizado por proyecto.
- `02_Fotografias_Originales`: fotografías en resolución original.
- `03_Videos_Originales`: videos fuente.
- `04_Masterplans`: planos, KMZ/KML, renders y material territorial.
- `05_Brochures`: brochures vigentes y versiones editables.
- `06_Documentos_Comerciales`: fichas, tablas, presentaciones y material comercial.
- `90_Derivados_Web`: versiones optimizadas para web, Open Graph, WhatsApp y PDF.
- `99_Legacy_Referencia`: material anterior conservado solo como referencia.

## Carpetas anteriores

### `oferta terrenos` — 2026
https://drive.google.com/drive/folders/1kiTPgZoRc6ScOPe3RU8EZxcBAFgZ5H69

Contiene piezas gráficas recientes de campaña y redes sociales. Se considera una fuente de material vigente a clasificar, pero no el maestro estructural.

### `Oferta Terrenos web` — 2024
https://drive.google.com/drive/folders/150fCW5Tlwk5u2xs3vDtKDNot_MeW_h9N

Contiene fotografías, Logos e Iconos de la etapa anterior. Se considera fuente legacy hasta que los archivos sean revisados y copiados/mapeados al maestro.

No mover ni borrar estos archivos durante la migración inicial.

## Regla de publicación

Flujo recomendado:

`Drive original → selección/aprobación → optimización → web/PDF/OG`

Los originales no se sobrescriben. Cada derivado debe poder rastrearse al archivo maestro.

## Convención de nombres

Para proyectos:

`<slug-proyecto>__<tipo>__<descripcion>__vNN.<ext>`

Ejemplos:

- `explora-park__hero__vista-norte__v01.jpg`
- `valle-escondido-licanten__gallery__acceso__v02.webp`
- `parque-mirador__masterplan__comercial__v03.pdf`

Tipos sugeridos: `logo`, `hero`, `gallery`, `og`, `masterplan`, `brochure`, `video`, `document`.

## Derivados objetivo

### Web
- Preferir WebP/AVIF cuando el flujo lo soporte.
- Mantener proporciones sin recortes destructivos.
- No usar el archivo original de alta resolución directamente en runtime.

### Open Graph / WhatsApp
- Mantener una imagen explícita por proyecto.
- Formato horizontal estable y liviano.
- La misma fuente lógica debe alimentar metadata social y landing.

### PDF
- Usar la galería oficial del proyecto.
- Comprimir imágenes antes de embutirlas.
- Evitar que el PDF invente o tome imágenes legacy si existe una fuente oficial.

## Integración con producto

La fuente lógica de imágenes de cada proyecto debe alimentar:

1. landing pública;
2. tarjeta social / WhatsApp;
3. dossier y brochure PDF;
4. CRM cuando se adjunta o comparte material;
5. futuros flujos de shortlist y cotización.

No duplicar listas de assets por feature.

## Migración inicial

1. Mantener intactas las dos carpetas existentes.
2. Mapear primero los proyectos activos: Explora Park, Parque Mirador, Valle Escondido Licantén y Brisas de Caone.
3. Identificar logo, hero, galería, masterplan y brochure oficial de cada proyecto.
4. Copiar o referenciar los originales dentro de la estructura maestra.
5. Generar derivados en `90_Derivados_Web`.
6. Actualizar `landing_config` / fuente de media canónica para que web, OG y PDF usen el mismo conjunto.
7. Marcar el material anterior como legacy cuando exista reemplazo confirmado.

## Definition of Done de #142

- Existe una carpeta maestra documentada.
- Los originales y derivados tienen destinos separados.
- Los proyectos activos quedan mapeados a media oficial.
- Web, PDFs y previews sociales comparten la misma fuente lógica.
- La guía de naming/versionado queda en el repositorio.
