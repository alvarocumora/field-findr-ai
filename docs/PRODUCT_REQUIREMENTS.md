# Product Requirements — OfertaTerrenos / Field Findr AI

## 1. Objetivo del producto

Construir una plataforma web para buscar, publicar, analizar y comercializar terrenos mediante mapas, IA, dashboards y escenarios visuales de desarrollo.

## 2. Alcance funcional

### Marketplace público

Debe permitir:

- ver landing premium;
- buscar terrenos;
- filtrar por ubicación, precio, superficie y tipo;
- ver fichas de propiedad;
- comparar propiedades;
- consultar por WhatsApp;
- agendar visita;
- descargar ficha PDF;
- usar búsqueda conversacional con IA.

### Ficha de propiedad

Debe mostrar:

- título;
- ubicación;
- precio en UF y moneda local cuando corresponda;
- superficie;
- precio por metro cuadrado o hectárea;
- imágenes;
- mapa o vista satelital;
- escenarios visuales disponibles;
- etiquetas de uso potencial;
- estado de verificación;
- CTA de contacto;
- análisis IA;
- PDF descargable.

### Visual Scenarios

Debe permitir mostrar y comparar usos potenciales del predio:

- industrial / packing;
- bodegaje;
- subdivisión;
- parcelación;
- agrícola;
- solar;
- turismo;
- mixto.

Cada escenario debe tener estado conceptual o validado.

### Búsqueda conversacional

El usuario debe poder escribir una búsqueda en lenguaje natural.

Ejemplos:

- Terreno industrial cerca de Ruta 5 en Maule.
- Parcela con bosque nativo en Los Lagos.
- Sitio para bodegaje sobre una hectárea.
- Terreno agrícola bajo 30 millones.

La IA debe devolver:

- resultados;
- explicación;
- filtros interpretados cuando exista soporte;
- limitaciones o supuestos.

### Panel comprador

Debe permitir:

- ver inicio comprador;
- guardar favoritos;
- ver Mi Terreno;
- administrar perfil;
- revisar alertas;
- consultar suscripción.

### Panel asesor / corredor

Debe permitir:

- publicar propiedades;
- administrar inventario;
- gestionar leads;
- gestionar proyectos y lotes;
- usar CRM;
- revisar ventas;
- revisar reservas;
- revisar reportes;
- gestionar mensajes;
- revisar oportunidades de suelo.

### Panel admin

Debe permitir:

- administrar usuarios;
- administrar agentes;
- aprobar propiedades;
- revisar documentos;
- revisar auditoría;
- revisar analytics;
- administrar proyectos y reservas.

## 3. Roles

### `buyer`

Comprador o inversionista.

Permisos:

- navegar;
- guardar favoritos;
- ver panel comprador;
- consultar y solicitar visitas.

### `agent`

Asesor o corredor.

Permisos:

- acceder a panel asesor;
- publicar y gestionar propiedades;
- gestionar leads y CRM;
- generar fichas;
- revisar reportes de sus propiedades.

### `admin`

Administrador de plataforma.

Permisos:

- acceso completo;
- aprobar publicaciones;
- gestionar usuarios;
- revisar auditoría;
- administrar configuración global.

## 4. Reglas de negocio

1. Una propiedad puede tener múltiples escenarios visuales.
2. Un escenario puede estar en estado `draft`, `concept`, `review`, `approved` o `archived`.
3. Los escenarios conceptuales no deben comunicarse como permiso aprobado.
4. Los análisis IA deben separar evidencia, supuestos y recomendaciones.
5. Las fichas PDF deben incluir disclaimer técnico.
6. Una publicación verificada debe tener evidencia mínima asociada.
7. Los precios deben mostrar unidad principal y contexto.
8. Los datos de contacto deben generar acción directa.

## 5. Criterios de aceptación principales

### Ficha de propiedad

- Carga sin romper en desktop y móvil.
- Muestra precio, ubicación, superficie y CTA.
- Si hay escenario visual, lo muestra en la galería o hero.
- Si no hay escenario, muestra imagen o mapa base.
- Botón WhatsApp funciona.
- Botón PDF no falla silenciosamente.

### Búsqueda IA

- No ejecuta búsqueda vacía.
- Muestra loader.
- Maneja error de Edge Function.
- Muestra resultados con título, ubicación, precio y superficie.
- Si no hay resultados, muestra mensaje claro.

### Panel asesor

- Requiere sesión.
- Requiere rol `agent` o `admin`.
- Usuario no autorizado ve mensaje de acceso denegado.

### Panel admin

- Requiere sesión.
- Requiere rol `admin`.
- Usuario no autorizado ve mensaje de acceso denegado.

## 6. No objetivos inmediatos

No abordar todavía:

- simulación normativa automática completa;
- generación automática 3D avanzada;
- tasación bancaria formal;
- integración directa con conservador, SII o DOM;
- promesas de compraventa;
- pagos finales de propiedades.

## 7. Diferenciadores

- Escenarios visuales sobre terreno real.
- Búsqueda conversacional.
- Fichas comerciales generadas desde la plataforma.
- Panel corredor/inmobiliaria.
- IA como copiloto comercial y territorial.
- Experiencia visual premium.

## 8. Mensaje comercial base

OfertaTerrenos transforma terrenos en oportunidades visuales de inversión, mostrando escenarios de desarrollo sobre imágenes reales del predio y entregando análisis comercial accionable con IA.
