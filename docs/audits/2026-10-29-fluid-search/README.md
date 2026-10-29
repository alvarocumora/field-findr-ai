# Continuidad de búsqueda

Las sugerencias descartan respuestas que pertenecen a búsquedas anteriores. Al cambiar, borrar o confirmar la consulta se invalida el trabajo pendiente; al desmontar se elimina el temporizador. Cargar sugerencias no impide borrar la búsqueda.

Un fallo del servicio se explica como tal y permite confirmar la búsqueda del catálogo. El estado sin coincidencias aparece solo después de una respuesta exitosa para la consulta actual. Las sugerencias populares envían la ubicación, no la frase comercial completa.

Abrir una sugerencia de parcela usa el enlace canónico del explorador con listing y conserva filtros, moneda y presupuesto. La resolución individual existente permite cargar la parcela sin depender de las páginas del feed. Los fallos del almacenamiento opcional de búsquedas recientes no bloquean la interacción; se valida el historial leído.

Validación: diez pruebas focalizadas (cinco nuevas de búsqueda, cuatro de hero y una de inventario), TypeScript, lint sin errores y build/PWA. Chromium comprueba la conservación de filtros al abrir una parcela con respuesta simulada; las demás APIs externas se bloquearon, sin escrituras reales. No acredita la disponibilidad del servicio remoto ni un despliegue a producción.
