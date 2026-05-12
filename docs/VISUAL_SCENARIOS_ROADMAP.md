# Visual Scenarios Roadmap

## Objetivo

Convertir OfertaTerrenos en una plataforma capaz de mostrar escenarios de desarrollo sobre imágenes reales del predio, generando impacto visual y soporte comercial para inversionistas, corredores, inmobiliarias y propietarios.

## Concepto central

No vender solo el terreno. Mostrar el proyecto que puede existir sobre él.

El visualizador debe permitir montar escenarios conceptuales sobre predios, subdivisiones o terrenos industriales, conectando la imagen satelital con una narrativa técnica y comercial.

## Escenarios iniciales

1. Industrial / packing frutícola
2. Bodegaje y logística
3. Subdivisión habitacional
4. Parcelación de agrado
5. Proyecto agrícola productivo
6. Energía solar
7. Turismo, lodge o glamping
8. Equipamiento comunitario o mixto

## Módulo sugerido

Nombre interno: `VisualScenarioBuilder`

Funciones esperadas:

- Seleccionar tipo de escenario.
- Guardar geometría del predio.
- Asociar una imagen base, vista Mapbox o imagen satelital.
- Montar assets visuales o modelos simples sobre la vista.
- Calcular métricas preliminares.
- Generar una ficha PDF comercial.
- Enviar la oportunidad a WhatsApp o CRM.
- Permitir análisis con IA sobre cabida, restricciones y potencial.

## Datos mínimos por escenario

- `id`
- `property_id`
- `scenario_type`
- `title`
- `description`
- `status`
- `base_image_url`
- `overlay_image_url`
- `geometry_geojson`
- `estimated_capex`
- `estimated_revenue`
- `assumptions`
- `created_by`
- `created_at`

## Estados sugeridos

- `draft`: escenario preliminar no validado.
- `concept`: escenario conceptual listo para ficha comercial.
- `review`: requiere revisión técnica, normativa o comercial.
- `approved`: validado para publicación o presentación.
- `archived`: escenario reemplazado o descontinuado.

## Integración con IA

El botón `Analizar con IA` debería entregar una respuesta trazable y clara, separando:

- Potencial comercial.
- Supuestos usados.
- Riesgos normativos.
- Restricciones técnicas.
- Preguntas pendientes.
- Recomendación de siguiente acción.

La IA no debe afirmar permisos, IFC, subdivisiones aprobadas o factibilidad normativa si no existe evidencia documental asociada.

## Ficha PDF

Cada escenario debería poder exportar una ficha con:

- portada visual;
- precio;
- superficie;
- ubicación;
- tipo de oportunidad;
- imagen del escenario;
- supuestos comerciales;
- métricas preliminares;
- CTA de contacto;
- disclaimer técnico.

## Disclaimer recomendado

Los escenarios visuales son representaciones conceptuales para análisis comercial preliminar. No reemplazan estudios técnicos, permisos sectoriales, certificados municipales, factibilidades, IFC, subdivisiones aprobadas ni revisión normativa profesional.

## Fases

### Fase 1: Fundamento comercial

- Documentar escenarios.
- Crear modelo de datos.
- Agregar tipos y constantes.
- Integrar ficha manual por propiedad.

### Fase 2: Visualizador

- Crear componente `VisualScenarioViewer`.
- Mostrar imagen base + overlay.
- Agregar selector de escenario.
- Conectar con propiedades.

### Fase 3: IA y PDF

- Generar análisis IA con supuestos trazables.
- Exportar ficha PDF.
- Guardar historial de análisis.

### Fase 4: Builder avanzado

- Permitir edición de geometrías.
- Integrar assets 2D/3D.
- Generar variantes por industria.
- Preparar herramienta premium para corredores e inmobiliarias.
