# Master Plan — OfertaTerrenos / Field Findr AI

## 1. Visión

OfertaTerrenos / Field Findr AI será una plataforma PropTech de inteligencia territorial para descubrir, visualizar, analizar y comercializar terrenos con una capa diferencial: escenarios visuales de desarrollo montados sobre imágenes reales, mapas y geometrías del predio.

La plataforma debe ayudar a compradores, corredores, inmobiliarias, propietarios e inversionistas a entender rápidamente el potencial de un terreno antes de visitarlo o evaluarlo técnicamente.

## 2. Tesis central

El mercado no necesita otro portal de publicaciones inmobiliarias. Necesita una herramienta que transforme un terreno abstracto en una oportunidad visual, técnica y comercialmente entendible.

La propuesta central es:

> No vendas solo el terreno. Muestra el proyecto que puede existir sobre él.

## 3. Posicionamiento

OfertaTerrenos debe posicionarse como:

- Marketplace de terrenos.
- Plataforma de inteligencia territorial.
- Generador de escenarios visuales de desarrollo.
- Herramienta comercial para corredores e inmobiliarias.
- Motor de análisis con IA para oportunidades inmobiliarias y rurales.

## 4. Usuarios objetivo

### Compradores e inversionistas

Buscan oportunidades claras, comparables y fáciles de entender.

Necesitan:

- visualizar el terreno;
- entender ubicación, precio y superficie;
- comparar alternativas;
- analizar potencial de uso;
- contactar rápidamente;
- descargar fichas.

### Corredores y asesores

Necesitan publicar, presentar y cerrar oportunidades más rápido.

Necesitan:

- publicar terrenos;
- generar fichas visuales;
- gestionar leads;
- responder consultas;
- mostrar escenarios de desarrollo;
- demostrar valor agregado frente a portales tradicionales.

### Inmobiliarias y desarrolladores

Necesitan evaluar terrenos para proyectos futuros.

Necesitan:

- análisis de cabida preliminar;
- escenarios de subdivisión;
- rutas de factibilidad;
- reportes para comités internos;
- información territorial ordenada.

### Propietarios

Necesitan mostrar mejor el potencial de sus predios.

Necesitan:

- valorización preliminar;
- visualización profesional;
- acceso a compradores;
- soporte de corredores o asesores.

## 5. Líneas de producto

### Marketplace territorial

Publicación, búsqueda, filtros, fichas y contacto.

### Visual Scenarios

Montaje de escenarios sobre predios: industrial, parcelación, habitacional, agrícola, solar, turismo, bodegaje.

### AI Land Analyst

Análisis con IA de oportunidades, riesgos, supuestos, restricciones y potencial comercial.

### Broker OS

Panel para corredores: publicaciones, leads, CRM, reservas, documentos, reportes y performance.

### Investor Pack

Ficha PDF, resumen ejecutivo, imágenes, indicadores preliminares y CTA comercial.

## 6. Principios de producto

1. Visual primero.
2. IA con supuestos explícitos.
3. No inventar permisos ni factibilidades.
4. Cada oportunidad debe poder convertirse en ficha comercial.
5. Cada escenario debe ser conceptual salvo evidencia documental.
6. La experiencia debe sentirse premium, rápida y confiable.
7. El corredor debe ahorrar tiempo y vender mejor.
8. El comprador debe entender el potencial en menos de 60 segundos.

## 7. Prioridades estratégicas

### Corto plazo

- Ordenar arquitectura y documentación.
- Consolidar rutas y roles.
- Formalizar módulo Visual Scenarios.
- Mejorar fichas de propiedad.
- Preparar primer flujo de escenario industrial / packing.

### Mediano plazo

- Builder de escenarios.
- Fichas PDF por escenario.
- Análisis IA trazable.
- Alertas inteligentes.
- CRM y lead scoring.

### Largo plazo

- Marketplace premium para corredores.
- Análisis normativo automatizado con fuentes verificables.
- Integración con catastros y capas GIS.
- Motor de valorización territorial.
- Herramientas white-label para inmobiliarias.

## 8. Métricas clave

### Producto

- Propiedades publicadas.
- Propiedades con escenario visual.
- Fichas PDF generadas.
- Consultas por WhatsApp.
- Análisis IA ejecutados.
- Comparaciones realizadas.

### Comercial

- Leads por propiedad.
- Tasa de contacto.
- Tasa de agenda de visita.
- Propiedades destacadas vendidas.
- Corredores activos.
- Suscripciones pagadas.

### Técnica

- Build exitoso.
- Tiempo de carga inicial.
- Errores en Edge Functions.
- Errores de auth.
- Performance móvil.
- Tamaño de bundles.

## 9. Riesgos

### Riesgo de sobrepromesa

La app no debe afirmar factibilidades, permisos, IFC, subdivisiones o cambios de uso de suelo sin respaldo documental.

### Riesgo de complejidad visual

Mapbox, overlays, 3D y assets pueden volver pesada la app. Se requiere carga diferida por ruta.

### Riesgo de arquitectura Lovable

Lovable puede generar archivos grandes y acoplamientos. Se requiere refactor progresivo y PRs pequeños.

### Riesgo de datos

Los análisis con IA dependen de información confiable. Se deben diferenciar datos reales, supuestos y estimaciones.

## 10. Estrategia de ejecución

Trabajar en sprints pequeños. Cada sprint debe cerrar con PR mergeable, QA manual y documentación actualizada.

Regla operativa:

- Un PR = un objetivo claro.
- No mezclar refactor de rutas con cambios visuales complejos.
- No tocar Supabase, auth o permisos sin checklist.
- Mantener Lovable sincronizable.
