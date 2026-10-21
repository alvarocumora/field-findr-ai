# Roadmap

## Avisos de monitoreo: tarjetas y consulta

- [x] Corregir superficie usando `area` y el inventario público existente: cuatro solicitudes correctas, precios y superficies visibles sin sesión
- [x] Consumir la apertura automática de consulta sin perder lote, pestaña ni campaña; cierre y cambio a Lotes comprobados; 9 pruebas pasan

## Mapa del tour en blanco

- [x] Verificar Hualañé con sesión real: satélite, 40 polígonos y estados visibles; solicitudes Mapbox correctas
- [x] Estabilizar ciclo de carga, ajuste de tamaño y recuperación visible; pruebas de ciclo y recorrido/cambio de estilo verificados con sesión real
- [ ] Confirmar la recuperación en el navegador donde apareció la captura original (bloqueo: fallo no reproducido en el entorno de pruebas)

## Oferta Licantén y simulador simple

- [x] Añadir campaña con fotografía real y enlace canónico, sin alterar buscador ni inventario
- [x] Integrar simulador simple CLP y consulta existente en portada y acceso en ficha Licantén
- [x] Validar fórmula, botones y vistas 1440/390/320; dejar preview sin publicar (detalle: docs/LICANTEN_CREDIT_QA.md)

- [x] Construir portada Territorio cinematográfico con búsqueda y proyectos reales
- [x] Unificar navegación, tarjetas, confianza, proceso y CTA comercial
- [x] Crear e integrar símbolo, wordmark, kit social, favicon e iconos PWA
- [x] Corregir estabilidad de mapas, enlaces y metadatos sociales
- [x] Verificar escritorio, móvil, accesibilidad, rutas y archivos visuales

## Globo 3D e identidad terrestre

- [x] Integrar planeta 3D interactivo con foco en Chile y respaldo estático
- [x] Reemplazar símbolo y wordmarks por la identidad globo + OFERTA TERRENOS
- [x] Regenerar favicon, PWA y kit social con la nueva identidad
- [x] Verificar movimiento, WebGL, modo reducido, escritorio y móvil

## Identidad tipográfica

- [x] Unificar el logo visible como OfertaTerrenos.com sin isotipo

## Enlaces públicos

- [x] Normalizar todo enlace compartible a https://ofertaterrenos.com (helper publicUrls), sin tocar URLs de auth

## Panoramas de Hualañé

- [x] Verificar en /explorar las tarjetas de las 38 parcelas disponibles
- [ ] Abrir las tarjetas de parcelas 36 y 37 sin sesión (bloqueo: sus publicaciones reservadas no son visibles públicamente)
- [ ] Publicar el tour disponible

- [x] Integrar las dos panorámicas Potensic al tour existente
- [x] Habilitar marcado visual por lote con plano y capturas de referencia, sin inventar GPS
- [x] Verificar cambio de escena, dibujo asociado a lote y guardado autorizado de orientación
- [ ] Validar correspondencia de los límites reales sobre cada panorama antes de guardar contornos públicos (bloqueo: referencia visual de linderos aún no validada)
