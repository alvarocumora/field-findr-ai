# Valle Escondido Licantén — proyecto completo

Nuevo loteo en Licantén (Curicó, Región del Maule): 76 parcelas sobre 44,00 hectáreas, con página propia, plano interactivo, ficha por parcela y tour virtual listo para cargar fotos 360.

## Qué tendrá el proyecto

**Página pública** en `ofertaterrenos.com/p/valle-escondido-licanten`
- Portada cinematográfica con el nombre, ubicación (Licantén, camino al Lago Vichuquén) y precio "desde $19.990.000".
- Bloque de identidad: 44 hectáreas, 76 parcelas, acceso asfaltado, ruta principal hacia Lago Vichuquén, subdivisión inscrita en el Conservador de Bienes Raíces de Licantén (Insc. Fs. 243 N° 133, año 2012 / plano N° 192 del año 2023).
- **Plano maestro interactivo**: cada parcela dibujada sobre imagen satelital, coloreada por estado (disponible / reservada / vendida), con clic para ver su ficha.
- **Listado de parcelas** filtrable por estado, superficie y precio.
- Sección de ubicación con mapa y distancias, preguntas frecuentes y formulario de contacto que entra directo al panel de leads.
- Tour virtual 360 incorporado en la página (aparece automáticamente cuando cargues las fotos).

**Ficha por parcela** (una URL propia por parcela, indexable en Google)
- Número de parcela, superficie parcial + servidumbre de tránsito + superficie total (según el cuadro oficial del plano), precio en pesos, estado.
- Mini plano con la parcela destacada dentro del loteo.
- Botones de contacto y de reserva (usa el flujo de reservas ya existente).

**Tour virtual**
- El proyecto queda habilitado en el editor de tours: subes las fotos 360, defines la vista inicial y los saltos entre escenas, y aparecen solas en la página. Sin fotos cargadas, la sección simplemente no se muestra.

**Panel interno**
- El proyecto y sus 76 parcelas aparecen en el inventario, en el mapa de `/panel/inventario` y en la red comercial como oportunidad con su comisión por venta.
- La comisión de cada parcela queda registrada según tu lista ($1.500.000 a $3.000.000 según la parcela) y solo la ven corredores y administración, nunca el público.

## Datos que se cargan

- **Precios públicos** tal cual tu listado: parcelas 5 a 74, entre $19.990.000 y $42.990.000.
- **Superficies** desde el cuadro de superficie del plano oficial (0,50 a 2,38 ha por parcela; total 44,00 ha).
- **Estados iniciales**: todas disponibles, salvo las que me indiques como reservadas. Las parcelas 1–4, 75 y 76 (no incluidas en tu lista de precios) quedan fuera de venta, visibles en el plano pero sin precio. Puedes cambiar cualquier estado desde el panel en cualquier momento.
- **Documentos**: el plano de subdivisión (láminas) queda adjunto y descargable desde la página.

Antes de publicar te muestro el plano dibujado sobre el satélite para que confirmes que calza con el plano oficial.

## Detalle técnico

1. **Geometría**: el archivo `Altos_de_Licanten.kml` es un levantamiento CAD (3.527 líneas, sin nombres de lote). Script `scripts/generateLicantenLots.ts` que:
   - poligoniza la red de líneas (shapely `polygonize`) para obtener los recintos cerrados;
   - descarta caminos/servidumbres y polígonos-símbolo (< 500 m²);
   - normaliza cada anillo con `normalizePolygon` (`src/lib/polygonUtils.ts`);
   - asigna número de parcela cruzando superficie calculada contra el cuadro de superficie del plano (tolerancia ±8 %) y orden geográfico N→S del plano;
   - emite `src/pages/valleEscondidoLicanten/data/lots.ts` + `project.ts` con el mismo contrato que `EpLot`.
   - Validación obligatoria: superficie total reconstruida ≈ 44,00 ha y 76 recintos. Si la poligonización no cierra todos los recintos, se completa con partición Voronoi acotada al perímetro (mismo criterio usado en Parque Mirador) y se marca en el reporte.
2. **Backend**: `projects` (slug `valle-escondido-licanten`, region Maule, comuna Licantén, `landing_config`) + 76 filas en `lots` (lot_number, area, price, status, polygon, features con servidumbre y rol 151-104) + `listings` de tipo loteo por parcela vía el flujo existente `publish-listing`/`sync_listing_from_lot`. Sin cambios de esquema.
3. **Frontend**: landing a medida bajo el motor único — `src/pages/valleEscondidoLicanten/VelLanding.tsx` con secciones `VelHero`, `VelProyecto`, `VelMasterplan`, `VelLotsGrid`, `VelUbicacion`, `VelTour`, `VelFaqs`, `VelContacto`, registrada en `src/lib/landing/registry.ts` con canónica `/p/valle-escondido-licanten`. Datos en vivo con un hook `useVelLots` (patrón `useEpLots`: geometría estática + estado/precio desde `get_public_lots`).
4. **Tour**: reutiliza `tour_scenes` y `useTourScenes`; la sección se renderiza solo si hay escenas.
5. **SEO**: `useSEO` con título/descripción propios, canónica, JSON-LD `RealEstateListing`, y las fichas de parcela heredan los metadatos dinámicos ya existentes en `PropertyDetail`. Regenerar `public/sitemap.xml` con `scripts/generate-sitemap.ts`.
6. **Assets**: las láminas PDF del plano se suben como assets (pointer JSON), no se copian binarios al repositorio.

## Fuera de alcance

- Fotos reales del campo y panorámicas 360 (las cargas tú desde el panel).
- Renders o imágenes generadas: la página usa satélite y plano oficial hasta que subas fotografías.
