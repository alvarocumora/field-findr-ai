export type VisualScenarioModelKey =
  | 'house_a'
  | 'house_b'
  | 'warehouse'
  | 'tree_pine'
  | 'tree_oak'
  | 'street_lamp';

export type VisualScenarioModelRegistry = Partial<Record<VisualScenarioModelKey, string>>;

export const DEFAULT_VISUAL_SCENARIO_MODEL_REGISTRY: VisualScenarioModelRegistry = {
  house_a: '/models/quaternius/house_a.glb',
  house_b: '/models/quaternius/house_b.glb',
  warehouse: '/models/quaternius/warehouse.glb',
  tree_pine: '/models/quaternius/tree_pine.glb',
  tree_oak: '/models/quaternius/tree_oak.glb',
  street_lamp: '/models/quaternius/street_lamp.glb',
};

let modelRegistry: VisualScenarioModelRegistry = {
  ...DEFAULT_VISUAL_SCENARIO_MODEL_REGISTRY,
};

export const getVisualScenarioModelRegistry = () => ({ ...modelRegistry });

export const getVisualScenarioModelUrl = (key: VisualScenarioModelKey) => modelRegistry[key] ?? null;

export const setVisualScenarioModelRegistry = (partial: VisualScenarioModelRegistry) => {
  modelRegistry = {
    ...modelRegistry,
    ...partial,
  };
};

export const resetVisualScenarioModelRegistry = () => {
  modelRegistry = {
    ...DEFAULT_VISUAL_SCENARIO_MODEL_REGISTRY,
  };
};
