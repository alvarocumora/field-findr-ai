import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type {
  VisualScenario,
  VisualScenarioAssumption,
  VisualScenarioMetric,
  VisualScenarioRisk,
  VisualScenarioStatus,
  VisualScenarioType,
} from '@/types/visualScenario';

type VisualScenarioRow = {
  id: string;
  property_id: string;
  scenario_type: VisualScenarioType;
  status: VisualScenarioStatus;
  title: string;
  subtitle: string | null;
  description: string | null;
  base_image_url: string | null;
  overlay_image_url: string | null;
  thumbnail_url: string | null;
  model_registry_keys: string[] | null;
  property_geojson: Json | null;
  scenario_geojson: Json | null;
  map_center_lng: number | null;
  map_center_lat: number | null;
  map_bearing: number | null;
  map_pitch: number | null;
  map_zoom: number | null;
  metrics: Json | null;
  assumptions: Json | null;
  risks: Json | null;
  tags: string[] | null;
  estimated_capex: number | null;
  estimated_revenue: number | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const isArray = <T>(value: unknown): value is T[] => Array.isArray(value);

const parseJsonArray = <T>(value: Json | null): T[] => {
  if (!value || !isArray<T>(value)) return [];
  return value;
};

export const mapVisualScenarioRow = (row: VisualScenarioRow): VisualScenario => ({
  id: row.id,
  propertyId: row.property_id,
  type: row.scenario_type,
  status: row.status,
  title: row.title,
  subtitle: row.subtitle ?? undefined,
  description: row.description ?? undefined,
  assets: {
    baseImageUrl: row.base_image_url ?? undefined,
    overlayImageUrl: row.overlay_image_url ?? undefined,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    modelRegistryKeys: row.model_registry_keys ?? undefined,
  },
  geometry: {
    propertyGeojson: row.property_geojson ?? undefined,
    scenarioGeojson: row.scenario_geojson ?? undefined,
    center:
      typeof row.map_center_lng === 'number' && typeof row.map_center_lat === 'number'
        ? [row.map_center_lng, row.map_center_lat]
        : undefined,
    bearing: row.map_bearing ?? undefined,
    pitch: row.map_pitch ?? undefined,
    zoom: row.map_zoom ?? undefined,
  },
  metrics: parseJsonArray<VisualScenarioMetric>(row.metrics),
  assumptions: parseJsonArray<VisualScenarioAssumption>(row.assumptions),
  risks: parseJsonArray<VisualScenarioRisk>(row.risks),
  tags: row.tags ?? [],
  estimatedCapex: row.estimated_capex ?? undefined,
  estimatedRevenue: row.estimated_revenue ?? undefined,
  createdBy: row.created_by ?? undefined,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
});

const visualScenariosTable = () => (supabase as unknown as {
  from: (table: 'visual_scenarios') => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (column: string, options?: { ascending?: boolean }) => Promise<{
          data: VisualScenarioRow[] | null;
          error: Error | null;
        }>;
      };
      order: (column: string, options?: { ascending?: boolean }) => {
        limit: (count: number) => Promise<{
          data: VisualScenarioRow[] | null;
          error: Error | null;
        }>;
      };
    };
  };
}).from('visual_scenarios');

export const useVisualScenarios = (propertyId?: string | null) => {
  return useQuery({
    queryKey: ['visual-scenarios', propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await visualScenariosTable()
        .select('*')
        .eq('property_id', propertyId as string)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data ?? []).map(mapVisualScenarioRow);
    },
  });
};

export const useAdminVisualScenarios = (limit = 100) => {
  return useQuery({
    queryKey: ['visual-scenarios', 'admin', limit],
    queryFn: async () => {
      const { data, error } = await visualScenariosTable()
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data ?? []).map(mapVisualScenarioRow);
    },
  });
};
