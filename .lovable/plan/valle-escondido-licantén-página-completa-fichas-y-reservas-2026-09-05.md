# Valle Escondido Licantén — página completa, fichas y reservas

El proyecto ya existe en `/p/valle-escondido-licanten` con sus 76 parcelas y el plano dibujado. Falta vestirlo: imágenes, entorno, tarjetas más claras, ficha propia por parcela con QR y el flujo de contacto/reserva conectado de punta a punta.

## Qué se va a hacer

**1. Imágenes del proyecto**
- Cuatro imágenes generadas del carácter del lugar (valle y lomajes, camino de acceso, cercanía al lago Vichuquén, atardecer sobre el loteo), con la marca "imagen referencial" visible.
- Portada nueva con una de esas imágenes y el plano satelital de fondo; galería con las demás.
- Cuando envíes fotos reales, se reemplazan sin tocar nada más.

**2. Puntos de interés (entorno)**
- Sección con distancias y tiempos reales desde el loteo: Licantén, Lago Vichuquén, Iloca y playa, Curicó, Santiago, colegios, salud y comercio.
- Cada punto con su ícono, su distancia y su marca en el mapa del proyecto; al tocarlo, el mapa se centra en él.

**3. Tarjetas de parcela mejoradas**
- Tarjeta con número, superficie, precio, precio por m², estado con color (disponible / reservada / no disponible) y una miniatura del contorno de la parcela.
- Filtros por estado, rango de superficie y rango de precio, más orden por precio o tamaño.
- Al tocar una tarjeta se abre el panel de venta con el detalle y los botones de acción.

**4. Ficha propia por parcela + QR**
- Cada una de las 70 parcelas con precio tendrá su página pública indexable, con plano, datos, precio y contacto; el buscador general sigue mostrando el proyecto completo, no las parcelas sueltas.
- Ficha PDF descargable por parcela, con la identidad de OFERTA TERRENOS y QR que lleva a esa página, igual que en los demás proyectos.
- Ficha PDF del proyecto completo con el resumen, el plano y el QR a la página.

**5. Flujo de ventas y reservas conectado**
- Botones "Consultar" y "Reservar" en cada parcela y en la barra fija de la página.
- La consulta entra como lead al panel del proyecto; la reserva crea la reserva real con el estado de la parcela y aparece en reservas, ventas y comisiones.
- Compartir por WhatsApp con el enlace de la parcela y, si el corredor entra con su código, la consulta queda atribuida a él.

**6. Polígonos desde el KMZ**
- Se rehace la extracción desde el archivo de topografía con el proceso estándar (poligonización y normalización), se comparan las superficies resultantes con el cuadro oficial del plano y se corrigen las parcelas que no calcen.
- Queda un reporte con las parcelas cuya numeración es inferida (hoy: 16, 68 y la 76, que sale más grande) para que el topógrafo confirme.

## Detalle técnico

- Landing a medida `src/pages/valleEscondidoLicanten/VelLanding.tsx` registrada en `src/lib/landing/registry.ts` bajo el slug existente, con secciones `VelHero`, `VelEntorno` (POIs), `VelMasterplan`, `VelLotsGrid`, `VelFicha`, `VelGallery`, `VelContacto`, siguiendo el patrón de `src/pages/exploraPark`.
- Datos vivos con `useVelLots` (patrón `useEpLots`: geometría estática + `get_public_lots` para precio/estado); nada hardcodeado en precios.
- Reutilizar `LotSalesSheet`, `LotReserveDialog`, `ProjectConversionBar` y `LandingLeadForm` — sin lógica de ventas nueva.
- Fichas PDF con `src/lib/lotDataCardPdf.ts` y `src/lib/pdf/fichaShell.ts` (`qrUrl` ya genera el QR); tema de marca desde `fichaTheme`.
- Publicación de 70 `listings` por parcela vía el flujo existente `publish-listing` / `sync_listing_from_lot`, marcadas como lotes de loteo para que el explorador siga mostrando solo el proyecto.
- Imágenes generadas guardadas en `src/assets/valle-escondido-licanten/` y `projects.images` / `landing_config` actualizados.
- POIs en `data/poi.ts` con coordenadas, dibujados sobre el mismo mapa Mapbox del masterplan.
- Regenerar `public/sitemap.xml` y verificar `src/routes/navLinks.test.ts` y typecheck.

## Fuera de alcance

- Fotos reales y panorámicas 360 del recorrido virtual (quedan los espacios listos).
- Cambios de esquema en la base de datos.
