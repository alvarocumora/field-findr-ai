# Tour virtual, fichas y portada más comercial

Objetivo: que la web venda. Menos texto informativo, más recorrido, imagen y llamada a la acción. Tres frentes: tour virtual real, fichas de parcela con mejor presentación, y una portada comercial unificada.

## 1. Tour virtual de verdad

Hoy el visor 360 muestra una foto por escena con puntos de salto. Queda a medias: no hay recorrido guiado, ni brújula, ni mini-mapa sincronizado, ni galería.

Mejoras:
- Recorrido continuo entre escenas con transición suave, en vez de cambio brusco.
- Brújula y giro automático al entrar, para que se vea vivo sin tocar nada.
- Mini-mapa del loteo dentro del tour: se ve dónde estás parado y hacia dónde miras.
- Al hacer clic en una parcela dentro del panorama, se abre su ficha con precio, superficie y botón de reserva sin salir del tour.
- Vista de pantalla completa pensada para celular, con miniaturas deslizables.
- Cuando un proyecto todavía no tiene fotos 360, se muestra un recorrido aéreo del plano en 3D en vez de un espacio vacío.

## 2. Fichas de parcela más vendedoras

- Portada con imagen grande y el estado (disponible, reservada, vendida) siempre visible.
- Bloque de precio destacado: valor, precio por m², cuota estimada y botón de reserva fijo en el móvil.
- Carrusel de fotos, plano de la parcela y acceso directo al tour desde la ficha.
- Entorno: distancias a pueblo, ruta, agua y servicios en tarjetas cortas, no en párrafos.
- Descarga del kit PDF y compartir por WhatsApp desde el mismo bloque.

## 3. Portada comercial, no informativa

Hoy la portada tiene trece secciones y se lee como un folleto. Se recorta a siete, en orden de venta:

```text
1. Portada con buscador y una promesa clara
2. Proyectos destacados (con precio desde y estado)
3. Cómo comprar en 3 pasos
4. Recorrido: tour 360 / plano 3D del proyecto estrella
5. Confianza: cifras reales, corredores, respaldo legal
6. Testimonios cortos
7. Llamada final: agenda una visita
```

Lo que sale de la portada (mercado, análisis, contenidos editoriales) se agrupa en una página aparte enlazada desde el menú, para no perderlo.

## 4. Unificar la web

- Todas las landings de proyecto siguen pasando por el mismo motor por slug; se les aplica la nueva estructura comercial en bloques comunes, para que un proyecto nuevo salga listo sin página a medida.
- Un solo bloque de contacto/reserva reutilizado en portada, landings y fichas.
- Un solo componente de tour usado en landing, ficha y experiencia de proyecto.

## 5. Repositorios y librerías propuestas

Ya usamos Photo Sphere Viewer; se aprovechan sus complementos oficiales en vez de sumar dependencias nuevas:
- Complementos de recorrido virtual, brújula, galería y giro automático de Photo Sphere Viewer.
- Mapbox estándar en 3D para el mini-mapa del tour y los planos.
- La librería de animación que ya usa el proyecto para las transiciones.

No se propone Three.js adicional, Pannellum ni motores externos: duplicarían peso sin aportar sobre lo que ya está instalado.

## Orden de entrega

1. Portada comercial (impacto inmediato, sin tocar datos).
2. Fichas de parcela.
3. Tour virtual con recorrido, brújula y mini-mapa.
4. Aplicar los bloques comunes a todas las landings de proyecto.

## Detalle técnico

- Tour: incorporar `virtual-tour-plugin`, `compass-plugin`, `gallery-plugin` y `autorotate-plugin` de `@photo-sphere-viewer` en `src/components/tour/TourViewer360.tsx`; sincronizar el yaw con `TourMinimap.tsx`; fallback a vuelo Mapbox cuando `tour_scenes` esté vacío.
- Fichas: reorganizar `src/pages/PropertyDetail.tsx` en bloques (hero, precio pegajoso, galería, entorno, descargas) sin cambiar consultas ni RLS.
- Portada: recomponer `src/pages/Index.tsx` a siete secciones y mover el resto a una ruta declarada en `src/routes/routeManifest.tsx` con su `seo`.
- Landings: extraer los bloques comunes (contacto, descargas, tour) para que `ProjectLanding` los componga por configuración.
- Sin cambios de base de datos ni de lógica de ventas, reservas o comisiones.
