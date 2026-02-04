/**
 * LandData Service - Consulta de datos territoriales para Chile
 * 
 * Integra múltiples fuentes de datos públicos para proporcionar
 * información completa sobre cualquier terreno en Chile.
 */

import { supabase } from '@/integrations/supabase/client';

export interface LandDataReport {
  coordinates: { lat: number; lng: number };
  timestamp: string;
  zoning: ZoningData | null;
  waterRights: WaterRightsData | null;
  environmentalRestrictions: EnvironmentalData | null;
  miningConcessions: MiningData | null;
  riskAssessment: RiskData | null;
  infrastructure: InfrastructureData | null;
  cadastral: CadastralData | null;
}

export interface ZoningData {
  zone: string;
  allowedUses: string[];
  maxHeight: number | null;
  maxDensity: number | null;
  buildingCoefficient: number | null;
  groundOccupancy: number | null;
  planName: string;
  municipality: string;
  lastUpdate: string;
}

export interface WaterRightsData {
  hasWaterRights: boolean;
  type: 'superficial' | 'subterranean' | 'mixed' | null;
  volume: number | null; // liters per second
  source: string | null;
  registrationNumber: string | null;
  owner: string | null;
  nearbyRivers: string[];
  aquiferName: string | null;
  scarcityZone: boolean;
}

export interface EnvironmentalData {
  protectedArea: boolean;
  protectedAreaName: string | null;
  protectedAreaType: string | null;
  wetland: boolean;
  wetlandName: string | null;
  prioritySite: boolean;
  environmentalImpact: 'none' | 'low' | 'medium' | 'high';
  requiredPermits: string[];
  nativeForest: boolean;
  biodiversityValue: 'low' | 'medium' | 'high' | 'critical';
}

export interface MiningData {
  activeConcessions: number;
  concessionTypes: ('exploration' | 'exploitation')[];
  overlapsProperty: boolean;
  nearestConcessionDistance: number | null; // meters
  environmentalLiabilities: number;
  activeMines: boolean;
}

export interface RiskData {
  floodRisk: 'none' | 'low' | 'medium' | 'high';
  landslideRisk: 'none' | 'low' | 'medium' | 'high';
  seismicRisk: 'low' | 'medium' | 'high';
  tsunamiRisk: boolean;
  volcanicRisk: 'none' | 'low' | 'medium' | 'high';
  fireRisk: 'none' | 'low' | 'medium' | 'high';
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
}

export interface InfrastructureData {
  electricity: boolean;
  electricityDistance: number | null;
  water: boolean;
  waterDistance: number | null;
  sewage: boolean;
  sewageDistance: number | null;
  naturalGas: boolean;
  internet: boolean;
  internetType: string | null;
  pavedRoad: boolean;
  roadDistance: number | null;
  publicTransport: boolean;
  nearestCity: string | null;
  nearestCityDistance: number | null;
}

export interface CadastralData {
  rol: string | null;
  comuna: string | null;
  region: string | null;
  surfaceRegistered: number | null; // m2
  surfaceBuilt: number | null;
  fiscalAppraisal: number | null;
  propertyType: string | null;
  ownershipStatus: 'clear' | 'encumbered' | 'unknown';
  liens: string[];
  lastTransaction: string | null;
  lastTransactionValue: number | null;
}

// GIS Layer configurations for enhanced map visualization
export interface GISLayerConfig {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  source: string;
  sourceUrl: string;
  category: 'zoning' | 'water' | 'environment' | 'mining' | 'risk' | 'infrastructure' | 'cadastral';
  color: string;
  icon: string;
  available: boolean;
  premium: boolean;
}

export const ENHANCED_GIS_LAYERS: GISLayerConfig[] = [
  // Zoning & Land Use
  {
    id: 'urban-limits',
    name: 'Límite Urbano',
    nameEn: 'Urban Limits',
    description: 'Límites de áreas urbanas según planificación territorial',
    source: 'MINVU',
    sourceUrl: 'https://ide.minvu.cl',
    category: 'zoning',
    color: '#8b5cf6',
    icon: 'Building2',
    available: true,
    premium: false,
  },
  {
    id: 'land-use',
    name: 'Uso de Suelo',
    nameEn: 'Land Use',
    description: 'Clasificación de uso de suelo permitido',
    source: 'MINVU',
    sourceUrl: 'https://ide.minvu.cl',
    category: 'zoning',
    color: '#3b82f6',
    icon: 'Map',
    available: true,
    premium: false,
  },
  {
    id: 'building-coefficients',
    name: 'Coeficientes de Edificación',
    nameEn: 'Building Coefficients',
    description: 'Densidad y altura máxima permitida',
    source: 'MINVU',
    sourceUrl: 'https://ide.minvu.cl',
    category: 'zoning',
    color: '#6366f1',
    icon: 'Building',
    available: true,
    premium: true,
  },
  
  // Water Resources
  {
    id: 'water-rights',
    name: 'Derechos de Agua',
    nameEn: 'Water Rights',
    description: 'Derechos de aprovechamiento de agua otorgados',
    source: 'DGA',
    sourceUrl: 'https://dga.mop.gob.cl',
    category: 'water',
    color: '#06b6d4',
    icon: 'Droplets',
    available: true,
    premium: false,
  },
  {
    id: 'aquifers',
    name: 'Acuíferos Subterráneos',
    nameEn: 'Underground Aquifers',
    description: 'Ubicación y extensión de acuíferos',
    source: 'DGA',
    sourceUrl: 'https://dga.mop.gob.cl',
    category: 'water',
    color: '#0891b2',
    icon: 'Waves',
    available: true,
    premium: false,
  },
  {
    id: 'scarcity-zones',
    name: 'Zonas de Escasez Hídrica',
    nameEn: 'Water Scarcity Zones',
    description: 'Áreas declaradas con escasez hídrica',
    source: 'DGA',
    sourceUrl: 'https://dga.mop.gob.cl',
    category: 'water',
    color: '#dc2626',
    icon: 'AlertTriangle',
    available: true,
    premium: false,
  },
  {
    id: 'rivers-basins',
    name: 'Ríos y Cuencas',
    nameEn: 'Rivers and Basins',
    description: 'Red hidrográfica y delimitación de cuencas',
    source: 'DGA',
    sourceUrl: 'https://dga.mop.gob.cl',
    category: 'water',
    color: '#0ea5e9',
    icon: 'Droplets',
    available: true,
    premium: false,
  },
  
  // Environmental Restrictions
  {
    id: 'protected-areas',
    name: 'Áreas Protegidas',
    nameEn: 'Protected Areas',
    description: 'SNASPE, santuarios de la naturaleza',
    source: 'CONAF/MMA',
    sourceUrl: 'https://ide.mma.gob.cl',
    category: 'environment',
    color: '#22c55e',
    icon: 'TreePine',
    available: true,
    premium: false,
  },
  {
    id: 'wetlands',
    name: 'Humedales',
    nameEn: 'Wetlands',
    description: 'Humedales urbanos y sitios Ramsar',
    source: 'MMA',
    sourceUrl: 'https://ide.mma.gob.cl',
    category: 'environment',
    color: '#14b8a6',
    icon: 'Leaf',
    available: true,
    premium: false,
  },
  {
    id: 'native-forest',
    name: 'Bosque Nativo',
    nameEn: 'Native Forest',
    description: 'Áreas con presencia de bosque nativo',
    source: 'CONAF',
    sourceUrl: 'https://sig.conaf.cl',
    category: 'environment',
    color: '#15803d',
    icon: 'TreeDeciduous',
    available: true,
    premium: false,
  },
  {
    id: 'biodiversity-corridors',
    name: 'Corredores Ecológicos',
    nameEn: 'Biodiversity Corridors',
    description: 'Zonas de conectividad ecológica',
    source: 'MMA',
    sourceUrl: 'https://ide.mma.gob.cl',
    category: 'environment',
    color: '#84cc16',
    icon: 'Leaf',
    available: true,
    premium: true,
  },
  
  // Mining
  {
    id: 'mining-concessions',
    name: 'Concesiones Mineras',
    nameEn: 'Mining Concessions',
    description: 'Concesiones de exploración y explotación',
    source: 'SERNAGEOMIN',
    sourceUrl: 'https://www.sernageomin.cl',
    category: 'mining',
    color: '#a855f7',
    icon: 'Mountain',
    available: true,
    premium: false,
  },
  {
    id: 'mining-liabilities',
    name: 'Pasivos Ambientales Mineros',
    nameEn: 'Mining Environmental Liabilities',
    description: 'Faenas abandonadas con riesgo ambiental',
    source: 'SERNAGEOMIN',
    sourceUrl: 'https://www.sernageomin.cl',
    category: 'mining',
    color: '#ef4444',
    icon: 'AlertTriangle',
    available: true,
    premium: false,
  },
  
  // Natural Risks
  {
    id: 'flood-zones',
    name: 'Zonas de Inundación',
    nameEn: 'Flood Zones',
    description: 'Áreas susceptibles a inundaciones',
    source: 'MOP/SENAPRED',
    sourceUrl: 'https://geomop.mop.gob.cl',
    category: 'risk',
    color: '#0ea5e9',
    icon: 'Waves',
    available: true,
    premium: false,
  },
  {
    id: 'landslide-zones',
    name: 'Zonas de Remoción en Masa',
    nameEn: 'Landslide Zones',
    description: 'Áreas susceptibles a deslizamientos',
    source: 'SERNAGEOMIN',
    sourceUrl: 'https://www.sernageomin.cl',
    category: 'risk',
    color: '#f59e0b',
    icon: 'Mountain',
    available: true,
    premium: false,
  },
  {
    id: 'tsunami-zones',
    name: 'Zonas de Tsunami',
    nameEn: 'Tsunami Zones',
    description: 'Áreas de inundación por tsunami',
    source: 'SHOA',
    sourceUrl: 'https://www.shoa.cl',
    category: 'risk',
    color: '#6366f1',
    icon: 'Waves',
    available: true,
    premium: false,
  },
  {
    id: 'volcanic-zones',
    name: 'Zonas de Amenaza Volcánica',
    nameEn: 'Volcanic Hazard Zones',
    description: 'Áreas de peligro volcánico',
    source: 'SERNAGEOMIN',
    sourceUrl: 'https://www.sernageomin.cl',
    category: 'risk',
    color: '#ef4444',
    icon: 'Mountain',
    available: true,
    premium: false,
  },
  {
    id: 'fire-risk',
    name: 'Riesgo de Incendios',
    nameEn: 'Fire Risk',
    description: 'Zonas con alto riesgo de incendios forestales',
    source: 'CONAF',
    sourceUrl: 'https://sig.conaf.cl',
    category: 'risk',
    color: '#f97316',
    icon: 'Flame',
    available: true,
    premium: false,
  },
  
  // Infrastructure
  {
    id: 'road-network',
    name: 'Red Vial',
    nameEn: 'Road Network',
    description: 'Carreteras, caminos principales y secundarios',
    source: 'MOP',
    sourceUrl: 'https://geomop.mop.gob.cl',
    category: 'infrastructure',
    color: '#64748b',
    icon: 'Route',
    available: true,
    premium: false,
  },
  {
    id: 'utilities',
    name: 'Servicios Básicos',
    nameEn: 'Utilities',
    description: 'Cobertura de agua, luz, alcantarillado',
    source: 'SEC/SISS',
    sourceUrl: 'https://www.sec.cl',
    category: 'infrastructure',
    color: '#f59e0b',
    icon: 'Zap',
    available: true,
    premium: true,
  },
  
  // Cadastral
  {
    id: 'cadastral-parcels',
    name: 'Catastro de Propiedades',
    nameEn: 'Property Cadastre',
    description: 'Límites y datos de propiedades registradas',
    source: 'SII/CBR',
    sourceUrl: 'https://www.sii.cl',
    category: 'cadastral',
    color: '#ec4899',
    icon: 'FileText',
    available: true,
    premium: true,
  },
  {
    id: 'fiscal-appraisal',
    name: 'Avalúo Fiscal',
    nameEn: 'Fiscal Appraisal',
    description: 'Valor fiscal de las propiedades',
    source: 'SII',
    sourceUrl: 'https://www.sii.cl',
    category: 'cadastral',
    color: '#d946ef',
    icon: 'DollarSign',
    available: true,
    premium: true,
  },
];

// Get layers by category
export function getLayersByCategory(category: GISLayerConfig['category']): GISLayerConfig[] {
  return ENHANCED_GIS_LAYERS.filter(layer => layer.category === category);
}

// Get all available free layers
export function getFreeLayers(): GISLayerConfig[] {
  return ENHANCED_GIS_LAYERS.filter(layer => layer.available && !layer.premium);
}

// Get premium layers
export function getPremiumLayers(): GISLayerConfig[] {
  return ENHANCED_GIS_LAYERS.filter(layer => layer.premium);
}

// Fetch land data report from edge function
export async function fetchLandDataReport(lat: number, lng: number): Promise<LandDataReport | null> {
  try {
    const { data, error } = await supabase.functions.invoke('land-data-report', {
      body: { lat, lng },
    });
    
    if (error) throw error;
    return data as LandDataReport;
  } catch (error) {
    console.error('Error fetching land data report:', error);
    return null;
  }
}

// Generate demo land data for development
export function generateDemoLandData(lat: number, lng: number): LandDataReport {
  const isUrban = Math.abs(lat + 33.45) < 0.1 && Math.abs(lng + 70.65) < 0.1;
  const isCoastal = lng < -71.5;
  
  return {
    coordinates: { lat, lng },
    timestamp: new Date().toISOString(),
    zoning: {
      zone: isUrban ? 'ZU-2' : 'ZR-1',
      allowedUses: isUrban 
        ? ['Residencial', 'Comercio menor', 'Equipamiento'] 
        : ['Agrícola', 'Residencial rural'],
      maxHeight: isUrban ? 12 : 7,
      maxDensity: isUrban ? 400 : 50,
      buildingCoefficient: isUrban ? 2.5 : 0.3,
      groundOccupancy: isUrban ? 0.6 : 0.1,
      planName: isUrban ? 'Plan Regulador Comunal' : 'Plan Regulador Intercomunal',
      municipality: 'Municipalidad Demo',
      lastUpdate: '2023-06-15',
    },
    waterRights: {
      hasWaterRights: Math.random() > 0.4,
      type: Math.random() > 0.5 ? 'superficial' : 'subterranean',
      volume: Math.floor(Math.random() * 10) + 1,
      source: 'Río Demo',
      registrationNumber: `DAA-${Math.floor(Math.random() * 100000)}`,
      owner: null,
      nearbyRivers: ['Río Mapocho', 'Estero Demo'],
      aquiferName: 'Acuífero Santiago Norte',
      scarcityZone: Math.random() > 0.7,
    },
    environmentalRestrictions: {
      protectedArea: Math.random() > 0.85,
      protectedAreaName: Math.random() > 0.85 ? 'Santuario de la Naturaleza Demo' : null,
      protectedAreaType: Math.random() > 0.85 ? 'Santuario de la Naturaleza' : null,
      wetland: Math.random() > 0.9,
      wetlandName: null,
      prioritySite: Math.random() > 0.8,
      environmentalImpact: ['none', 'low', 'medium'][Math.floor(Math.random() * 3)] as 'none' | 'low' | 'medium',
      requiredPermits: Math.random() > 0.7 ? ['Permiso Ambiental Sectorial'] : [],
      nativeForest: Math.random() > 0.7,
      biodiversityValue: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
    },
    miningConcessions: {
      activeConcessions: Math.floor(Math.random() * 3),
      concessionTypes: Math.random() > 0.7 ? ['exploration'] : [],
      overlapsProperty: Math.random() > 0.9,
      nearestConcessionDistance: Math.floor(Math.random() * 5000) + 500,
      environmentalLiabilities: Math.floor(Math.random() * 2),
      activeMines: Math.random() > 0.95,
    },
    riskAssessment: {
      floodRisk: ['none', 'low', 'medium', 'high'][Math.floor(Math.random() * 4)] as 'none' | 'low' | 'medium' | 'high',
      landslideRisk: ['none', 'low', 'medium'][Math.floor(Math.random() * 3)] as 'none' | 'low' | 'medium',
      seismicRisk: 'medium',
      tsunamiRisk: isCoastal,
      volcanicRisk: 'none',
      fireRisk: ['none', 'low', 'medium'][Math.floor(Math.random() * 3)] as 'none' | 'low' | 'medium',
      overallRisk: ['low', 'medium'][Math.floor(Math.random() * 2)] as 'low' | 'medium',
    },
    infrastructure: {
      electricity: isUrban || Math.random() > 0.3,
      electricityDistance: isUrban ? 0 : Math.floor(Math.random() * 500),
      water: isUrban || Math.random() > 0.5,
      waterDistance: isUrban ? 0 : Math.floor(Math.random() * 1000),
      sewage: isUrban,
      sewageDistance: isUrban ? 0 : Math.floor(Math.random() * 2000),
      naturalGas: isUrban && Math.random() > 0.5,
      internet: isUrban || Math.random() > 0.4,
      internetType: isUrban ? 'Fibra óptica' : 'Satelital',
      pavedRoad: isUrban || Math.random() > 0.5,
      roadDistance: isUrban ? 0 : Math.floor(Math.random() * 500),
      publicTransport: isUrban,
      nearestCity: 'Santiago',
      nearestCityDistance: Math.floor(Math.random() * 50) + 5,
    },
    cadastral: {
      rol: `${Math.floor(Math.random() * 9999)}-${Math.floor(Math.random() * 999)}`,
      comuna: 'Comuna Demo',
      region: 'Región Metropolitana',
      surfaceRegistered: Math.floor(Math.random() * 10000) + 500,
      surfaceBuilt: Math.floor(Math.random() * 200),
      fiscalAppraisal: Math.floor(Math.random() * 500000000) + 50000000,
      propertyType: isUrban ? 'Sitio' : 'Parcela',
      ownershipStatus: 'clear',
      liens: [],
      lastTransaction: '2022-03-15',
      lastTransactionValue: Math.floor(Math.random() * 300000000) + 50000000,
    },
  };
}

export default {
  ENHANCED_GIS_LAYERS,
  getLayersByCategory,
  getFreeLayers,
  getPremiumLayers,
  fetchLandDataReport,
  generateDemoLandData,
};
