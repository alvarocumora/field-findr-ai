# Portada comercial

Se reemplaza el hero territorial por una entrada comercial: «Tu próxima parcela está aquí», búsqueda por ubicación/tipo/presupuesto y una vitrina fotográfica con precio mínimo y disponibilidad provenientes del inventario público. Cada proyecto abre su ficha canónica. No hay rotación automática; el usuario elige el proyecto.

Los filtros usan el contrato real del explorador: q, type, currency=CLP y clpMax. Sin presupuesto no se limita la moneda. No se añaden precios, promociones, rendimientos ni garantías legales inventados. Una imagen ausente se indica como pendiente en lugar de atribuir una foto de otro proyecto.

El catálogo de proyectos aparece inmediatamente después del hero, antes de promoción y financiamiento. Su acceso por ancla también funciona durante carga, ausencia de proyectos o error, con salida al explorador.

Verificación local: 18 pruebas focalizadas de hero/rutas/rail, TypeScript, lint sin errores y build/PWA. Chromium en 320×740, 390×844 y1440×1000: sin desbordamiento; botón de búsqueda visible. Flujo real de navegador conserva ubicación, tipo y presupuesto al entrar al explorador, sin escrituras sobre inventario ni clientes.

El navegador de QA bloquea escrituras y WebGL; las imágenes /__l5e se sirven desde el dominio canónico mediante proxy. La captura no certifica rendimiento ni despliegue en producción. CI remoto tenía un bloqueo de facturación pendiente.
