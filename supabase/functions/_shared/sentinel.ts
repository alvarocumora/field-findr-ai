export interface SentinelStacAsset {
  href?: string;
}

export interface SentinelStacLink {
  rel?: string;
  href?: string;
}

export interface SentinelStacFeature {
  id?: string;
  bbox?: number[];
  properties?: {
    datetime?: string;
    "eo:cloud_cover"?: number;
    [key: string]: unknown;
  };
  assets?: Record<string, SentinelStacAsset | undefined>;
  links?: SentinelStacLink[];
}

export interface SelectedSentinelScene {
  item_id: string;
  datetime: string;
  cloud_cover: number | null;
  bbox: number[] | null;
  tilejson_url: string;
  preview_url: string | null;
}

const hrefFor = (feature: SentinelStacFeature, key: string, rel?: string): string | null =>
  feature.assets?.[key]?.href
  ?? feature.links?.find((link) => link.rel === (rel ?? key))?.href
  ?? null;

const toScene = (feature: SentinelStacFeature): SelectedSentinelScene | null => {
  const datetime = feature.properties?.datetime;
  const tilejsonUrl = hrefFor(feature, "tilejson");
  if (!feature.id || !datetime || !tilejsonUrl || Number.isNaN(Date.parse(datetime))) return null;

  const rawCloud = feature.properties?.["eo:cloud_cover"];
  return {
    item_id: feature.id,
    datetime,
    cloud_cover: typeof rawCloud === "number" && Number.isFinite(rawCloud) ? rawCloud : null,
    bbox: Array.isArray(feature.bbox) ? feature.bbox : null,
    tilejson_url: tilejsonUrl,
    preview_url: hrefFor(feature, "rendered_preview"),
  };
};

/**
 * Select the newest usable Sentinel-2 pass. Cloud cover chooses the anchor
 * acquisition, but once that pass is selected every adjacent renderable
 * granule from the same pass is kept so project edges do not disappear.
 */
export const selectLatestSentinelPass = (
  features: SentinelStacFeature[],
  maxCloudCover = 35,
  maxScenes = 8,
): SelectedSentinelScene[] => {
  const scenes = features
    .map(toScene)
    .filter((scene): scene is SelectedSentinelScene => Boolean(scene))
    .sort((a, b) => Date.parse(b.datetime) - Date.parse(a.datetime));

  if (scenes.length === 0) return [];

  const lowCloudAnchor = scenes.find(
    (scene) => scene.cloud_cover !== null && scene.cloud_cover <= maxCloudCover,
  );
  const anchor = lowCloudAnchor ?? scenes[0];
  const anchorAt = Date.parse(anchor.datetime);
  const samePassMs = 90 * 60 * 1000;

  return scenes
    .filter((scene) => Math.abs(Date.parse(scene.datetime) - anchorAt) <= samePassMs)
    .slice(0, maxScenes);
};

export const averageCloudCover = (scenes: SelectedSentinelScene[]): number | null => {
  const values = scenes
    .map((scene) => scene.cloud_cover)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};
