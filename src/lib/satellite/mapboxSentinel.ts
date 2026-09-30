import mapboxgl from "mapbox-gl";
import type { SentinelImageryResult } from "./sentinel";

const SOURCE_PREFIX = "ot-sentinel-current-";
const LAYER_PREFIX = "ot-sentinel-current-layer-";

export const clearSentinelRasterLayers = (map: mapboxgl.Map) => {
  const style = map.getStyle();
  const layers = style.layers ?? [];

  layers
    .filter((layer) => layer.id.startsWith(LAYER_PREFIX))
    .reverse()
    .forEach((layer) => {
      if (map.getLayer(layer.id)) map.removeLayer(layer.id);
    });

  Object.keys(style.sources ?? {})
    .filter((sourceId) => sourceId.startsWith(SOURCE_PREFIX))
    .forEach((sourceId) => {
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    });
};

export const syncSentinelRasterLayers = (
  map: mapboxgl.Map,
  imagery: SentinelImageryResult | null | undefined,
  beforeId?: string,
  opacity = 1,
) => {
  clearSentinelRasterLayers(map);
  if (!imagery?.available || imagery.scenes.length === 0) return;

  imagery.scenes.forEach((scene, index) => {
    const sourceId = SOURCE_PREFIX + index;
    const layerId = LAYER_PREFIX + index;

    map.addSource(sourceId, {
      type: "raster",
      url: scene.tilejson_url,
      tileSize: 256,
      attribution: "Copernicus Sentinel-2 · Microsoft Planetary Computer",
    });

    map.addLayer({
      id: layerId,
      type: "raster",
      source: sourceId,
      paint: {
        "raster-opacity": opacity,
        "raster-fade-duration": 0,
        "raster-resampling": "linear",
      },
    }, beforeId);
  });
};
