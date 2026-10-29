export interface ExploreSearchState {
  q: string;
  type: string[];
  region: string[];
  country: string[];
  tags: string[];
  slopes: string[];
  valuation: string[];
  currency: 'all' | 'CLP' | 'UF';
  view: 'list' | 'map' | 'swipe';
  clp: [number, number];
  uf: [number, number];
  area: [number, number];
}
const list = (value: string | null) => [...new Set((value || '').split(',').map(v => v.trim()).filter(Boolean))].slice(0, 30);
const range = (params: URLSearchParams, name: string, max: number): [number, number] => {
  const minValue = params.get(`${name}Min`);
  const maxValue = params.get(`${name}Max`);
  const min = minValue === null ? 0 : Number(minValue);
  const upper = maxValue === null ? max : Number(maxValue);
  return Number.isFinite(min) && Number.isFinite(upper) && min >= 0 && min <= upper && upper <= max ? [min, upper] : [0, max];
};

export function readExploreSearch(params: URLSearchParams): ExploreSearchState {
  const currency = params.get('currency');
  const view = params.get('view');
  return {
    q: params.get('q') || '', type: list(params.get('type')), region: list(params.get('region')),
    country: list(params.get('country')), tags: list(params.get('tags')), slopes: list(params.get('slopes')), valuation: list(params.get('valuation')),
    currency: currency === 'CLP' || currency === 'UF' ? currency : 'all',
    view: view === 'map' || view === 'swipe' ? view : 'list',
    clp: range(params, 'clp', 5_000_000_000), uf: range(params, 'uf', 500_000), area: range(params, 'area', 1_000_000),
  };
}

/** Preserve deep-linked listing IDs, campaigns and unrelated query parameters. */
export function writeExploreSearch(current: URLSearchParams, state: ExploreSearchState): URLSearchParams {
  const next = new URLSearchParams(current);
  const set = (key: string, value: string) => value ? next.set(key, value) : next.delete(key);
  set('q', state.q);
  for (const key of ['type', 'region', 'country', 'tags', 'slopes', 'valuation'] as const) set(key, state[key].join(','));
  set('currency', state.currency === 'all' ? '' : state.currency);
  set('view', state.view === 'list' ? '' : state.view);
  for (const [key, max] of [['clp', 5_000_000_000], ['uf', 500_000], ['area', 1_000_000]] as const) {
    set(`${key}Min`, state[key][0] === 0 ? '' : String(state[key][0]));
    set(`${key}Max`, state[key][1] === max ? '' : String(state[key][1]));
  }
  return next;
}

export const SLOPE_TAGS: Record<string, string[]> = {
  flat: ['plano', 'topografia-plana', 'pendiente-plana', 'slope-flat'],
  slight: ['suave', 'topografia-suave', 'pendiente-suave', 'slope-slight'],
  steep: ['fuerte', 'topografia-fuerte', 'pendiente-fuerte', 'slope-steep'],
};
export const VALUATION_TAGS: Record<string, string[]> = {
  low: ['plusvalia-baja', 'valuation-low'], medium: ['plusvalia-media', 'valuation-medium'], high: ['plusvalia-alta', 'valuation-high'],
};
export const expandFilterTags = (values: string[], aliases: Record<string, string[]>) => [...new Set(values.flatMap(value => aliases[value] || [value]))];
