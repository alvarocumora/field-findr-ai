# Visual Scenarios Spec — OfertaTerrenos / Field Findr AI

## 1. Propósito

El módulo Visual Scenarios permite representar usos potenciales de un terreno sobre una imagen real, vista satelital o base cartográfica, generando una experiencia comercial de alto impacto.

Su objetivo es transformar una ficha de terreno en una presentación visual de oportunidad.

## 2. Principio central

Un escenario visual es una representación conceptual. No equivale por defecto a permiso, factibilidad, IFC, subdivisión aprobada ni proyecto técnico validado.

La UI debe comunicar claramente el estado del escenario.

## 3. Tipos de escenario

### `industrial_packing`

Uso para packing frutícola, cámaras de frío, andenes, bodegas y oficinas.

### `warehouse_logistics`

Uso para bodegaje, centro logístico, patio de maniobras y distribución.

### `residential_subdivision`

Uso para conjunto habitacional, loteo urbano o expansión residencial.

### `rural_lots`

Uso para parcelación de agrado, caminos interiores y áreas comunes.

### `agricultural_productive`

Uso agrícola productivo, huertos, invernaderos, riego o infraestructura agrícola.

### `solar_energy`

Uso para parque solar, autoconsumo o infraestructura energética.

### `tourism_lodge`

Uso para lodge, glamping, turismo rural, miradores y equipamiento liviano.

### `mixed_use`

Uso mixto cuando combina más de una categoría.

## 4. Estados

### `draft`

Borrador interno. No debería publicarse.

### `concept`

Escenario conceptual para visualización comercial.

### `review`

Escenario requiere revisión técnica, legal, normativa o comercial.

### `approved`

Escenario validado internamente para presentación. No implica aprobación estatal salvo evidencia asociada.

### `archived`

Escenario reemplazado o descontinuado.

## 5. Modelo de datos frontend

```ts
export type VisualScenarioType =
  | 'industrial_packing'
  | 'warehouse_logistics'
  | 'residential_subdivision'
  | 'rural_lots'
  | 'agricultural_productive'
  | 'solar_energy'
  | 'tourism_lodge'
  | 'mixed_use';

export type VisualScenarioStatus =
  | 'draft'
  | 'concept'
  | 'review'
  | 'approved'
  | 'archived';

export interface VisualScenario {
  id: string;
  propertyId: string;
  type: VisualScenarioType;
  status: VisualScenarioStatus;
  title: string;
  description?: string;
  baseImageUrl?: string;
  overlayImageUrl?: string;
  geometryGeojson?: unknown;
  estimatedCapex?: number;
  estimatedRevenue?: number;
  assumptions?: string[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}
```

## 6. UI mínima del viewer

El componente `VisualScenarioViewer` debe mostrar:

- imagen base;
- overlay si existe;
- título;
- tipo de escenario;
- estado;
- superficie o métricas relevantes;
- tags;
- disclaimer;
- selector si hay más de un escenario;
- botón de análisis IA;
- botón de PDF si aplica.

## 7. Comportamiento esperado

### Con escenarios

- Mostrar escenario principal.
- Permitir cambiar escenario.
- Mostrar badges de tipo y estado.
- Permitir abrir vista ampliada.

### Sin escenarios

- Mostrar fallback de mapa, galería o imagen base.
- No romper ficha.
- Mostrar CTA para crear escenario si usuario es agent/admin.

### Mobile

- Mantener imagen principal visible.
- Controles no deben tapar información crítica.
- El selector puede ser horizontal scroll.

## 8. Análisis IA

El análisis de escenario debe responder con estructura:

```json
{
  "summary": "Resumen ejecutivo",
  "commercialPotential": "Potencial comercial",
  "assumptions": [],
  "risks": [],
  "missingEvidence": [],
  "recommendedNextSteps": [],
  "disclaimer": "Texto de limitación"
}
```

Reglas:

- No afirmar permisos si no hay documentos.
- No afirmar factibilidad normativa sin fuente.
- Identificar claramente supuestos.
- Recomendar revisión profesional cuando corresponda.

## 9. PDF del escenario

Debe incluir:

- portada con imagen del escenario;
- título y ubicación;
- precio y superficie;
- tipo de escenario;
- descripción;
- supuestos;
- riesgos o pendientes;
- CTA comercial;
- disclaimer.

## 10. Métricas preliminares sugeridas

Según tipo de escenario:

### Industrial / packing

- superficie predial;
- superficie construida estimada;
- cantidad de galpones;
- área de patio;
- acceso vial;
- cercanía a rutas.

### Subdivisión / parcelación

- número preliminar de lotes;
- superficie promedio;
- caminos interiores;
- área vendible;
- área común estimada.

### Solar

- hectáreas útiles;
- potencia referencial;
- cercanía a red;
- pendiente;
- sombras o restricciones.

### Turismo

- cantidad de unidades;
- accesos;
- atractivos cercanos;
- miradores;
- áreas comunes.

## 11. Integración con ficha de propiedad

La ficha debe priorizar:

1. Visual principal.
2. Precio y CTA.
3. Escenarios.
4. Análisis IA.
5. Detalles técnicos.
6. Documentos.
7. Propiedades similares.

## 12. Fases de implementación

### Fase A

Tipos, constantes y mock data.

### Fase B

Viewer simple en ficha.

### Fase C

Persistencia Supabase.

### Fase D

Análisis IA.

### Fase E

PDF.

### Fase F

Builder visual para asesores.
