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

export type VisualScenarioMetricUnit =
  | 'm2'
  | 'ha'
  | 'uf'
  | 'clp'
  | 'percent'
  | 'count'
  | 'mw'
  | 'kwp'
  | 'text';

export interface VisualScenarioMetric {
  key: string;
  label: string;
  value: string | number;
  unit?: VisualScenarioMetricUnit;
  description?: string;
}

export interface VisualScenarioAssumption {
  id: string;
  label: string;
  description?: string;
  source?: 'user_input' | 'platform_estimate' | 'ai_estimate' | 'document' | 'mock';
}

export interface VisualScenarioRisk {
  id: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
  description?: string;
}

export interface VisualScenarioAssetRefs {
  baseImageUrl?: string;
  overlayImageUrl?: string;
  thumbnailUrl?: string;
  modelRegistryKeys?: string[];
}

export interface VisualScenarioGeometry {
  propertyGeojson?: unknown;
  scenarioGeojson?: unknown;
  center?: [number, number];
  bearing?: number;
  pitch?: number;
  zoom?: number;
}

export interface VisualScenario {
  id: string;
  propertyId: string;
  type: VisualScenarioType;
  status: VisualScenarioStatus;
  title: string;
  subtitle?: string;
  description?: string;
  assets?: VisualScenarioAssetRefs;
  geometry?: VisualScenarioGeometry;
  metrics?: VisualScenarioMetric[];
  assumptions?: VisualScenarioAssumption[];
  risks?: VisualScenarioRisk[];
  tags?: string[];
  estimatedCapex?: number;
  estimatedRevenue?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VisualScenarioTypeConfig {
  type: VisualScenarioType;
  label: string;
  shortLabel: string;
  description: string;
  recommendedFor: string[];
  defaultTags: string[];
  suggestedMetrics: string[];
}

export interface VisualScenarioStatusConfig {
  status: VisualScenarioStatus;
  label: string;
  description: string;
  isPublicReady: boolean;
  requiresDisclaimer: boolean;
}

export interface VisualScenarioAnalysisResult {
  summary: string;
  commercialPotential: string;
  assumptions: string[];
  risks: string[];
  missingEvidence: string[];
  recommendedNextSteps: string[];
  disclaimer: string;
}
