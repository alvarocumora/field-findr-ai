import type { VisualScenario } from '@/types/visualScenario';
import industrialPackingImg from '@/assets/scenarios/industrial-packing.jpg';
import ruralLotsImg from '@/assets/scenarios/rural-lots.jpg';

export const MOCK_PROPERTY_ID = 'mock-property-industrial-maule';

export const mockVisualScenarios: VisualScenario[] = [
  {
    id: 'scenario-industrial-packing-maule',
    propertyId: MOCK_PROPERTY_ID,
    type: 'industrial_packing',
    status: 'concept',
    title: 'Packing frutícola con cámaras de frío',
    subtitle: 'Escenario conceptual para operación agroindustrial',
    description:
      'Propuesta visual preliminar para un packing frutícola con galpón principal, cámaras de frío, patio de maniobras, oficinas y áreas de circulación interior.',
    assets: {
      baseImageUrl: '/placeholder.svg',
      overlayImageUrl: '/placeholder.svg',
      thumbnailUrl: '/placeholder.svg',
      modelRegistryKeys: ['warehouse', 'street_lamp', 'tree_pine'],
    },
    geometry: {
      center: [-71.0, -35.4],
      bearing: 12,
      pitch: 48,
      zoom: 16,
    },
    metrics: [
      {
        key: 'site_area',
        label: 'Superficie predial referencial',
        value: 7.2,
        unit: 'ha',
      },
      {
        key: 'built_area',
        label: 'Superficie construida conceptual',
        value: 4200,
        unit: 'm2',
      },
      {
        key: 'maneuver_yard',
        label: 'Patio de maniobras',
        value: 9500,
        unit: 'm2',
      },
    ],
    assumptions: [
      {
        id: 'industrial-access',
        label: 'Acceso vial apto para camiones por validar',
        source: 'mock',
      },
      {
        id: 'cold-storage',
        label: 'Cámaras de frío consideradas como volumen conceptual',
        source: 'mock',
      },
    ],
    risks: [
      {
        id: 'permits',
        label: 'Permisos sectoriales no verificados',
        severity: 'high',
      },
      {
        id: 'utilities',
        label: 'Factibilidad eléctrica y sanitaria pendiente',
        severity: 'medium',
      },
    ],
    tags: ['Mock data', 'Industrial', 'Agroindustria', 'Packing'],
    estimatedCapex: 1850000000,
    estimatedRevenue: undefined,
    createdBy: 'system-demo',
    createdAt: '2026-05-12T00:00:00.000Z',
    updatedAt: '2026-05-12T00:00:00.000Z',
  },
  {
    id: 'scenario-rural-lots-maule',
    propertyId: MOCK_PROPERTY_ID,
    type: 'rural_lots',
    status: 'draft',
    title: 'Parcelación de agrado conceptual',
    subtitle: 'Borrador para evaluación interna',
    description:
      'Escenario preliminar para parcelación rural con caminos interiores, áreas comunes y lotes de agrado. Requiere revisión normativa antes de cualquier uso comercial.',
    assets: {
      baseImageUrl: '/placeholder.svg',
      overlayImageUrl: '/placeholder.svg',
      thumbnailUrl: '/placeholder.svg',
      modelRegistryKeys: ['house_a', 'house_b', 'tree_oak'],
    },
    geometry: {
      center: [-71.02, -35.41],
      bearing: -8,
      pitch: 42,
      zoom: 15,
    },
    metrics: [
      {
        key: 'estimated_lots',
        label: 'Parcelas preliminares',
        value: 18,
        unit: 'count',
      },
      {
        key: 'average_lot_area',
        label: 'Superficie promedio referencial',
        value: 5000,
        unit: 'm2',
      },
      {
        key: 'internal_roads',
        label: 'Caminos interiores conceptuales',
        value: 1.2,
        unit: 'ha',
      },
    ],
    assumptions: [
      {
        id: 'lot-size',
        label: 'Lotes referenciales de 5.000 m²',
        source: 'mock',
      },
    ],
    risks: [
      {
        id: 'subdivision',
        label: 'Subdivisión no aprobada ni verificada',
        severity: 'high',
      },
    ],
    tags: ['Mock data', 'Parcelación', 'Rural', 'Borrador'],
    createdBy: 'system-demo',
    createdAt: '2026-05-12T00:00:00.000Z',
    updatedAt: '2026-05-12T00:00:00.000Z',
  },
];

export const getMockVisualScenariosByPropertyId = (propertyId: string) =>
  mockVisualScenarios.filter((scenario) => scenario.propertyId === propertyId);
