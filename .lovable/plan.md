# Rediseño comercial e identidad social de OFERTA TERRENOS

## Objetivo
Convertir la portada en una experiencia comercial inmediata: entender la oferta, descubrir proyectos reales y agendar o iniciar una compra con el mínimo esfuerzo. Unificar en paralelo la marca digital y entregar un kit de logo con mundo cartográfico listo para redes sociales.

## Dirección visual aprobada
- **Paleta:** cartografía premium: negro profundo, blanco cálido, verde esmeralda y celeste.
- **Tipografía:** Space Grotesk para títulos y marca; DM Sans para lectura y controles.
- **Primera pantalla:** mapa/globo y proyectos visibles como experiencia principal.
- **Logo social:** kit completo, no una sola imagen.
- La interfaz conservará el carácter oscuro, geográfico y tecnológico de la referencia, evitando adornos genéricos, exceso de vidrio y texto explicativo.

## Diagnóstico confirmado
- El globo actual tiene buena presencia, pero ocupa entre 180 y 240% de la altura de pantalla; el buscador y los proyectos quedan demasiado abajo.
- La portada repite proyectos en dos bloques y mezcla la acción de compra con mensajes para corredores y contenido de mercado.
- Las tarjetas destacadas no presentan de forma consistente precio desde, superficie, estado y acción principal.
- La marca usa tres representaciones diferentes: wordmark textual en la interfaz, logo corporativo SVG y símbolo distinto en favicon.
- No existe una imagen social global de marca y el manifiesto de instalación referencia varios iconos e imágenes inexistentes.
- El mapa 3D secundario presenta un riesgo de inicialización/redimensionado que debe corregirse antes de reutilizarlo ampliamente.

## 1. Prototipos antes de construir
Preparar tres composiciones renderizadas con la paleta, tipografía y estructura ya aprobadas. Solo variarán jerarquía, densidad y movimiento:

1. **Atlas comercial:** globo lateral dominante, buscador compacto y carrusel de proyectos visible en la misma pantalla.
2. **Radar de oportunidades:** mapa como fondo útil, proyectos destacados superpuestos en una franja editorial y filtros rápidos.
3. **Territorio cinematográfico:** acercamiento progresivo a Chile con un proyecto protagonista y acceso inmediato al inventario.

Se elegirá una composición y se trasladará fielmente a escritorio y móvil.

## 2. Primera pantalla orientada a conversión
- Reducir el recorrido del globo a una pantalla compacta; no obligar a desplazarse por espacio vacío.
- Mantener **OFERTA TERRENOS** como único H1 y usar una promesa breve, concreta y verificable.
- Integrar búsqueda por ubicación, rango de precio y tipo de terreno en el área principal.
- Mostrar 2–3 proyectos reales desde el primer vistazo con imagen, ubicación, precio desde, disponibilidad y estado.
- Ordenar acciones por intención: **Explorar proyectos** como principal, **Ver mapa** como secundaria y acceso para vender/corredores en navegación.
- Mantener movimiento sutil del mundo y detenerlo con reducción de movimiento, pantalla pequeña o bajo rendimiento.

## 3. Portada comercial en seis bloques
```text
1. Mapa + búsqueda + proyectos visibles
2. Proyectos destacados completos
3. Por qué confiar: documentación, polígonos y datos verificables
4. Compra en tres pasos: explora, visita, reserva
5. Experiencia del proyecto: plano, tour y ficha
6. Agenda una visita / publica tu proyecto
```

- Eliminar duplicación entre proyectos destacados y el recorrido actual.
- Mantener análisis, mercado y contenidos en `/mercado`, enlazados desde navegación secundaria.
- Usar cifras reales de la plataforma; retirar cualquier volumen, satisfacción o transacción no respaldados.
- Retirar testimonios con fotos de stock y logos presentados como aliados; usar reseñas reales verificables o una prueba documental honesta.
- Separar claramente el viaje del comprador del mensaje B2B para inmobiliarias y corredores.

## 4. Sistema de tarjetas y prueba comercial
- Crear una tarjeta canónica de proyecto reutilizable en portada y Explorer.
- Jerarquía fija: imagen real, nombre, comuna/región, precio desde, lotes disponibles, superficie y acción.
- Etiquetas consistentes para destacado pagado, alta demanda y estado del inventario.
- Nunca mostrar lotes individuales en destacados; la entrada comercial es siempre el proyecto completo.
- Incorporar prueba útil: plano real, documentación disponible, visita/tour y ficha descargable, solo cuando existan.

## 5. Identidad y logo con mundo de fondo
Crear un sistema único partiendo de la geometría cartográfica existente y la paleta oficial:

- **Símbolo principal:** monograma simple y grueso, legible a 32 px, sin subtítulos ni detalles frágiles.
- **Wordmark:** OFERTA TERRENOS en Space Grotesk con relación y espaciado propios.
- **Fondo social:** globo cartográfico oscuro, con Chile/LATAM reconocible y contraste controlado; el mundo apoya al símbolo, no compite con él.
- Generar primero propuestas y aprobar una antes de reemplazar los activos actuales.

### Entregables del kit
- Avatar cuadrado: 1080×1080 PNG.
- Publicación cuadrada: 1080×1080 PNG.
- Portada horizontal: 1500×500 PNG.
- Vista previa social/OG: 1200×630 PNG.
- Símbolo SVG y PNG transparente.
- Wordmark horizontal claro y oscuro en SVG/PNG.
- Iconos PWA reales de 72 a 512 px y apple-touch-icon.
- Mini guía MD con usos, área de seguridad, fondos y tamaños mínimos.

## 6. Navegación, móvil y accesibilidad
- Navegación pública breve: Explorar, Vender, Comunidad y acceso; ofertas B2B bajo un menú contextual.
- Corregir destinos inconsistentes (`/explorar` frente a `/search`) y retirar enlaces sociales o legales sin destino real.
- En móvil: proyectos deslizables, búsqueda de una sola columna y CTA de visita/reserva siempre accesible sin tapar contenido.
- Contraste AA, foco visible, controles con nombre, texto ampliable y navegación completa por teclado.
- Mantener dimensiones estables para evitar saltos durante la carga de mapas e imágenes.

## 7. Rendimiento y estabilidad
- Corregir el ciclo de vida de Mapbox antes de reutilizar escenas 3D: montaje único, observación de tamaño, limpieza segura y ausencia de `resize` tras desmontaje.
- Cargar el mapa avanzado y el tour bajo demanda; ofrecer imagen cartográfica estática mientras cargan o si fallan.
- Optimizar imágenes a WebP/AVIF con tamaños responsivos y carga prioritaria solo para la primera pantalla.
- Evitar que la portada dependa de una animación o token externo para mostrar mensaje, búsqueda y proyectos.

## 8. SEO y distribución social
- Conservar título, descripción, canonical y datos estructurados existentes, ajustando el texto a la nueva promesa comercial.
- Incorporar la imagen OG 1200×630 y su equivalente para Twitter/X.
- Unificar favicon, logo declarado y marca visible.
- Reparar las referencias inexistentes del manifiesto y generar capturas PWA reales de portada y Explorer.

## 9. Medición de negocio
Registrar sin cambiar la lógica comercial:
- búsqueda iniciada;
- proyecto abierto desde portada;
- plano/tour visualizado;
- visita agendada;
- reserva iniciada;
- contacto de corredor/inmobiliaria.

La portada se evaluará por avance hacia proyecto, visita y reserva, no por tiempo de permanencia aislado.

## Orden de ejecución
1. Prototipos y elección visual.
2. Logo y kit social; aprobación antes de adopción.
3. Primera pantalla y navegación.
4. Tarjeta canónica y bloque de proyectos.
5. Prueba, proceso de compra y CTA final.
6. Móvil, accesibilidad, rendimiento y estabilidad de mapas.
7. SEO, OG, iconos PWA y medición.
8. Verificación completa en escritorio y móvil.

## Validación final
- Comparación visual con el prototipo elegido en escritorio y móvil.
- Flujo completo: portada → proyecto → ficha/plano/tour → visita o reserva.
- Sin textos cortados, solapamientos, espacios muertos ni controles tapados.
- Sin errores de consola o mapas; carga útil aun cuando Mapbox no responda.
- Metadatos, imagen social, favicon e instalación PWA verificados.
- Ventas, reservas, comisiones, permisos y datos existentes permanecen sin cambios.

## Alcance técnico
- Trabajo de presentación en la portada, navegación pública, tarjetas compartidas, sistema de marca, metadatos e imágenes públicas.
- Se respetan el manifiesto único de rutas y el motor compartido `/p/:slug`.
- No se modifican base de datos, reglas de acceso, precios, reservas, comisiones ni lógica de negocio.
