import { VISUAL_SCENARIO_STATUSES, VISUAL_SCENARIO_TYPES } from '@/config/visualScenarios';
import type {
  VisualScenario,
  VisualScenarioMetric,
  VisualScenarioMetricUnit,
  VisualScenarioStatus,
  VisualScenarioType,
} from '@/types/visualScenario';

export const getVisualScenarioTypeConfig = (type: VisualScenarioType) => VISUAL_SCENARIO_TYPES[type];

export const getVisualScenarioStatusConfig = (status: VisualScenarioStatus) => VISUAL_SCENARIO_STATUSES[status];

export const getVisualScenarioTypeLabel = (type: VisualScenarioType) =>
  getVisualScenarioTypeConfig(type).label;

export const getVisualScenarioStatusLabel = (status: VisualScenarioStatus) =>
  getVisualScenarioStatusConfig(status).label;

export const isVisualScenarioPublicReady = (scenario: VisualScenario) =>
  getVisualScenarioStatusConfig(scenario.status).isPublicReady;

export const visualScenarioRequiresDisclaimer = (scenario: VisualScenario) =>
  getVisualScenarioStatusConfig(scenario.status).requiresDisclaimer;

export const formatVisualScenarioCurrency = (value?: number, currency: 'CLP' | 'UF' = 'CLP') => {
  if (typeof value !== 'number') return 'No informado';

  if (currency === 'UF') {
    return `${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(value)} UF`;
  }

  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatVisualScenarioMetricValue = (
  value: string | number,
  unit?: VisualScenarioMetricUnit,
) => {
  if (typeof value === 'string') return value;

  const number = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(value);

  switch (unit) {
    case 'm2':
      return `${number} m²`;
    case 'ha':
      return `${number} ha`;
    case 'uf':
      return `${number} UF`;
    case 'clp':
      return formatVisualScenarioCurrency(value, 'CLP');
    case 'percent':
      return `${number}%`;
    case 'mw':
      return `${number} MW`;
    case 'kwp':
      return `${number} kWp`;
    case 'count':
    case 'text':
    default:
      return number;
  }
};

export const formatVisualScenarioMetric = (metric: VisualScenarioMetric) => ({
  ...metric,
  formattedValue: formatVisualScenarioMetricValue(metric.value, metric.unit),
});

export const buildVisualScenarioSummary = (scenario: VisualScenario) => {
  const type = getVisualScenarioTypeLabel(scenario.type);
  const status = getVisualScenarioStatusLabel(scenario.status);
  const metrics = scenario.metrics?.slice(0, 3).map(formatVisualScenarioMetric) ?? [];

  return {
    id: scenario.id,
    title: scenario.title,
    type,
    status,
    metrics,
    tags: scenario.tags ?? [],
    isPublicReady: isVisualScenarioPublicReady(scenario),
    requiresDisclaimer: visualScenarioRequiresDisclaimer(scenario),
  };
};
