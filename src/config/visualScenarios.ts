import type {
  VisualScenarioStatus,
  VisualScenarioStatusConfig,
  VisualScenarioType,
  VisualScenarioTypeConfig,
} from '@/types/visualScenario';

export const VISUAL_SCENARIO_DISCLAIMER =
  'Los escenarios visuales son representaciones conceptuales para análisis comercial preliminar. No reemplazan estudios técnicos, permisos sectoriales, certificados municipales, factibilidades, IFC, subdivisiones aprobadas ni revisión normativa profesional.';

export const VISUAL_SCENARIO_TYPES: Record<VisualScenarioType, VisualScenarioTypeConfig> = {
  industrial_packing: {
    type: 'industrial_packing',
    label: 'Packing industrial',
    shortLabel: 'Packing',
    description: 'Escenario para packing frutícola, cámaras de frío, andenes, bodegas y oficinas operativas.',
    recommendedFor: ['Terrenos industriales', 'Predios agrícolas con acceso vial', 'Centros frutícolas'],
    defaultTags: ['Industrial', 'Packing', 'Logística', 'Agroindustria'],
    suggestedMetrics: ['superficie_construida', 'patio_maniobras', 'andenes', 'capex_referencial'],
  },
  warehouse_logistics: {
    type: 'warehouse_logistics',
    label: 'Bodegaje y logística',
    shortLabel: 'Logística',
    description: 'Escenario para bodegas, centros de distribución, patios de maniobra y operación logística.',
    recommendedFor: ['Sitios industriales', 'Terrenos cerca de rutas', 'Predios periurbanos'],
    defaultTags: ['Bodegaje', 'Distribución', 'Patio de maniobras'],
    suggestedMetrics: ['superficie_bodega', 'patio_maniobras', 'accesos', 'capex_referencial'],
  },
  residential_subdivision: {
    type: 'residential_subdivision',
    label: 'Subdivisión habitacional',
    shortLabel: 'Habitacional',
    description: 'Escenario conceptual para loteo o conjunto habitacional, sujeto a validación normativa.',
    recommendedFor: ['Terrenos urbanos', 'Predios periurbanos', 'Paños con expansión habitacional'],
    defaultTags: ['Habitacional', 'Loteo', 'Cabida preliminar'],
    suggestedMetrics: ['lotes_estimados', 'superficie_promedio', 'area_vendible', 'caminos'],
  },
  rural_lots: {
    type: 'rural_lots',
    label: 'Parcelación de agrado',
    shortLabel: 'Parcelación',
    description: 'Escenario para parcelación rural, caminos interiores, áreas comunes y lotes de agrado.',
    recommendedFor: ['Predios rurales', 'Parcelas', 'Campos con atractivo natural'],
    defaultTags: ['Parcelas', 'Rural', 'Áreas comunes'],
    suggestedMetrics: ['parcelas_estimadas', 'superficie_promedio', 'caminos', 'area_comun'],
  },
  agricultural_productive: {
    type: 'agricultural_productive',
    label: 'Agrícola productivo',
    shortLabel: 'Agrícola',
    description: 'Escenario para huertos, invernaderos, riego, bodegas agrícolas e infraestructura productiva.',
    recommendedFor: ['Campos agrícolas', 'Predios con agua', 'Terrenos productivos'],
    defaultTags: ['Agrícola', 'Riego', 'Producción'],
    suggestedMetrics: ['hectareas_utiles', 'cultivo_referencial', 'infraestructura', 'agua'],
  },
  solar_energy: {
    type: 'solar_energy',
    label: 'Energía solar',
    shortLabel: 'Solar',
    description: 'Escenario conceptual para parque solar, autoconsumo o infraestructura energética.',
    recommendedFor: ['Terrenos planos', 'Predios con buena radiación', 'Sitios cercanos a red'],
    defaultTags: ['Solar', 'Energía', 'Autoconsumo'],
    suggestedMetrics: ['hectareas_utiles', 'potencia_referencial', 'cercania_red', 'pendiente'],
  },
  tourism_lodge: {
    type: 'tourism_lodge',
    label: 'Turismo, lodge o glamping',
    shortLabel: 'Turismo',
    description: 'Escenario para lodge, glamping, miradores, senderos y equipamiento turístico liviano.',
    recommendedFor: ['Predios con paisaje', 'Terrenos cercanos a atractivos', 'Campos turísticos'],
    defaultTags: ['Turismo', 'Glamping', 'Lodge', 'Naturaleza'],
    suggestedMetrics: ['unidades_estimadas', 'areas_comunes', 'miradores', 'accesos'],
  },
  mixed_use: {
    type: 'mixed_use',
    label: 'Uso mixto',
    shortLabel: 'Mixto',
    description: 'Escenario que combina más de un uso potencial dentro del mismo predio.',
    recommendedFor: ['Macrolotes', 'Predios estratégicos', 'Terrenos con múltiples frentes'],
    defaultTags: ['Mixto', 'Masterplan', 'Desarrollo por etapas'],
    suggestedMetrics: ['zonas_uso', 'etapas', 'area_vendible', 'capex_referencial'],
  },
};

export const VISUAL_SCENARIO_STATUSES: Record<VisualScenarioStatus, VisualScenarioStatusConfig> = {
  draft: {
    status: 'draft',
    label: 'Borrador',
    description: 'Escenario preliminar interno. No debería publicarse ni usarse como material comercial final.',
    isPublicReady: false,
    requiresDisclaimer: true,
  },
  concept: {
    status: 'concept',
    label: 'Conceptual',
    description: 'Escenario conceptual para visualización comercial preliminar.',
    isPublicReady: true,
    requiresDisclaimer: true,
  },
  review: {
    status: 'review',
    label: 'En revisión',
    description: 'Escenario pendiente de revisión técnica, normativa o comercial.',
    isPublicReady: false,
    requiresDisclaimer: true,
  },
  approved: {
    status: 'approved',
    label: 'Validado internamente',
    description: 'Escenario validado internamente para presentación comercial. No implica aprobación estatal salvo evidencia asociada.',
    isPublicReady: true,
    requiresDisclaimer: true,
  },
  archived: {
    status: 'archived',
    label: 'Archivado',
    description: 'Escenario reemplazado o descontinuado.',
    isPublicReady: false,
    requiresDisclaimer: false,
  },
};

export const VISUAL_SCENARIO_TYPE_OPTIONS = Object.values(VISUAL_SCENARIO_TYPES);
export const VISUAL_SCENARIO_STATUS_OPTIONS = Object.values(VISUAL_SCENARIO_STATUSES);
