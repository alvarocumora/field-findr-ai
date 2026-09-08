# Plan: globo 3D real y nueva identidad terrestre

## Objetivo
Convertir la primera pantalla en una experiencia espacial realista con un planeta 3D interactivo centrado en Sudamérica y reconstruir la identidad de OFERTA TERRENOS alrededor de un globo reconocible, manteniendo claridad comercial, velocidad y buena experiencia móvil.

## 1. Mundo 3D interactivo
- Reemplazar la imagen fija actual por una escena React Three Fiber integrada al fondo de la portada.
- Crear una Tierra esférica con mapas locales de superficie, relieve visual, nubes, brillo atmosférico y luz solar lateral; no depender de imágenes remotas durante la visita.
- Orientar la vista inicial hacia Sudamérica y destacar Chile con un pulso cartográfico sutil, sin convertir el fondo en un mapa técnico.
- Incorporar rotación automática lenta y respuesta amortiguada al cursor, arrastre y gesto táctil; al soltar, el planeta recuperará suavemente su encuadre comercial.
- Mantener el texto, buscador y proyectos siempre legibles sobre el planeta, sin bloquear botones ni desplazamiento de la página.
- Respetar “reducir movimiento”: planeta estático, sin autorrotación ni seguimiento del puntero.

## 2. Rendimiento y continuidad visual
- Cargar la escena 3D de forma diferida y conservar la imagen cartográfica actual como portada inmediata y respaldo.
- Limitar resolución, geometría y densidad de píxeles según el dispositivo; pausar la animación cuando la pestaña o la portada no estén visibles.
- Mostrar automáticamente el respaldo estático si WebGL no está disponible o falla la carga.
- Evitar Mapbox en esta escena: el planeta será autónomo para eliminar consumo de token, errores de ciclo de vida y carga innecesaria.

## 3. Logo oficial “globo + wordmark”
- Diseñar un isotipo terrestre simplificado: esfera, líneas cartográficas esenciales y Sudamérica/Chile como gesto distintivo.
- Construir el wordmark horizontal `OFERTA TERRENOS` con Space Grotesk y el sistema verde–turquesa vigente.
- Preparar variantes claras y oscuras, horizontal, símbolo aislado y una versión monocroma.
- Sustituir el símbolo geométrico actual en navegación, pie, favicon, iconos PWA y metadatos sociales.
- Mantener una versión simplificada para tamaños pequeños, evitando que el planeta pierda legibilidad como favicon o avatar.

## 4. Kit para redes sociales
- Regenerar avatar cuadrado, portada horizontal y tarjeta OpenGraph con el nuevo globo y wordmark.
- Entregar versiones PNG de alta resolución y archivos vectoriales del símbolo y wordmark.
- Actualizar la guía de marca con área de seguridad, tamaños mínimos, fondos permitidos y usos incorrectos.

## 5. Integración y validación
- Verificar que la portada siga mostrando búsqueda, proyectos reales y acciones comerciales en el primer vistazo.
- Probar interacción, encuadre y legibilidad en escritorio y móvil; comparar capturas separadas para confirmar que el planeta realmente gira.
- Comprobar carga lenta, WebGL desactivado, movimiento reducido, navegación por teclado y contraste.
- Validar compilación, rutas, consola, metadatos, favicon, PWA y archivos sociales antes de cerrar.

## Detalles técnicos
- Motor existente: React Three Fiber 8 + Drei 9 + Three.js, compatible con React 18.
- La animación usará tiempo por frame con amortiguación y límites, no velocidades ligadas a la frecuencia de pantalla.
- Presupuesto: una esfera principal, capas atmosféricas ligeras, menos de 100 llamadas de dibujo, densidad de píxel limitada a 1–1.5 en móvil y 2 en escritorio.
- Los mapas terrestres quedarán almacenados dentro del proyecto con licencia compatible y atribución documentada.
- No se modificarán ventas, reservas, comisiones, inventario, rutas ni datos de proyectos.
