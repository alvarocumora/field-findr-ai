/**
 * Area calculations and normative validations for Chilean lot subdivision.
 */

export interface NormativeProfile {
  name: string;
  minLotArea: number; // m²
  minFrontage: number; // m
  roadPercentage: number;
  greenPercentage: number;
  roadWidth: number; // m
  maxDensity: number; // lots per hectare
  description: string;
}

/**
 * Chilean urban/rural normative profiles
 */
export const NORMATIVE_PROFILES: Record<string, NormativeProfile> = {
  rural_5000: {
    name: 'Rural 5,000 m²',
    minLotArea: 5000,
    minFrontage: 20,
    roadPercentage: 15,
    greenPercentage: 10,
    roadWidth: 8,
    maxDensity: 15,
    description: 'Parcelas rurales DL 3516. Superficie mínima 5,000 m². Uso agrícola/residencial.',
  },
  rural_mixed: {
    name: 'Rural Mixto',
    minLotArea: 2500,
    minFrontage: 15,
    roadPercentage: 18,
    greenPercentage: 12,
    roadWidth: 7,
    maxDensity: 25,
    description: 'Loteo rural con uso mixto. Permite vivienda y proyectos turísticos.',
  },
  urban_residential: {
    name: 'Urbano Residencial',
    minLotArea: 300,
    minFrontage: 10,
    roadPercentage: 25,
    greenPercentage: 15,
    roadWidth: 11,
    maxDensity: 60,
    description: 'Zona urbana residencial. Requiere urbanización completa.',
  },
  condominio: {
    name: 'Condominio',
    minLotArea: 200,
    minFrontage: 8,
    roadPercentage: 20,
    greenPercentage: 20,
    roadWidth: 6,
    maxDensity: 80,
    description: 'Condominio cerrado. Copropiedad inmobiliaria.',
  },
};

export interface AreaBreakdown {
  totalArea: number;
  usableArea: number;
  roadArea: number;
  greenArea: number;
  easementArea: number;
  utilityArea: number;
  percentages: {
    usable: number;
    roads: number;
    green: number;
    easement: number;
    utility: number;
  };
}

/**
 * Calculate complete area breakdown for a subdivision
 */
export function calculateAreaBreakdown(
  totalArea: number,
  roadPct: number,
  greenPct: number,
  easementPct: number = 2,
  utilityPct: number = 1,
): AreaBreakdown {
  const roadArea = totalArea * (roadPct / 100);
  const greenArea = totalArea * (greenPct / 100);
  const easementArea = totalArea * (easementPct / 100);
  const utilityArea = totalArea * (utilityPct / 100);
  const usableArea = totalArea - roadArea - greenArea - easementArea - utilityArea;

  return {
    totalArea,
    usableArea: Math.max(0, usableArea),
    roadArea,
    greenArea,
    easementArea,
    utilityArea,
    percentages: {
      usable: (usableArea / totalArea) * 100,
      roads: roadPct,
      green: greenPct,
      easement: easementPct,
      utility: utilityPct,
    },
  };
}

/**
 * Validate subdivision parameters against normative profile
 */
export function validateSubdivision(
  totalArea: number,
  numLots: number,
  profile: NormativeProfile
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const avgLotArea = totalArea * (1 - (profile.roadPercentage + profile.greenPercentage) / 100) / numLots;

  if (avgLotArea < profile.minLotArea) {
    errors.push(`Área promedio por lote (${Math.round(avgLotArea)} m²) es menor al mínimo normativo (${profile.minLotArea} m²)`);
  }

  const density = (numLots / totalArea) * 10000;
  if (density > profile.maxDensity) {
    errors.push(`Densidad (${Math.round(density)} lotes/ha) excede el máximo (${profile.maxDensity} lotes/ha)`);
  }

  if (avgLotArea < profile.minLotArea * 1.1) {
    warnings.push(`Área promedio por lote está muy cerca del mínimo normativo`);
  }

  if (numLots > 20 && profile.greenPercentage < 10) {
    warnings.push(`Se recomienda al menos 10% de áreas verdes para loteos de más de 20 lotes`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Estimate maximum lots for a given area and profile
 */
export function estimateMaxLots(totalArea: number, profile: NormativeProfile): number {
  const usable = totalArea * (1 - (profile.roadPercentage + profile.greenPercentage) / 100);
  return Math.floor(usable / profile.minLotArea);
}
