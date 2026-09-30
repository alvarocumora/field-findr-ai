import mapboxgl from "mapbox-gl";
import { normalizePolygon } from "@/lib/polygonUtils";
import type { SatelliteLotLike, SentinelImageryResult } from "./sentinel";
import { syncSentinelRasterLayers } from "./mapboxSentinel";

interface SnapshotLot extends SatelliteLotLike {
  id?: string;
}

interface SnapshotOptions {
  mapboxToken?: string | null;
  width?: number;
  height?: number;
}

const waitForEvent = (
  map: mapboxgl.Map,
  event: "load" | "idle",
  timeoutMs: number,
) => new Promise<void>((resolve, reject) => {
  let settled = false;
  const timer = window.setTimeout(() => {
    if (settled) return;
    settled = true;
    if (event === "idle") resolve();
    else reject(new Error("Satellite map timed out"));
  }, timeoutMs);

  map.once(event, () => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timer);
    resolve();
  });
});

export const renderLotSatelliteSnapshot = async (
  lot: SnapshotLot,
  imagery: SentinelImageryResult | null | undefined,
  options: SnapshotOptions = {},
): Promise<string | null> => {
  if (typeof document === "undefined" || !imagery?.available) return null;

  const normalized = normalizePolygon(
    lot.polygon as number[][] | null,
    lot.latitude ?? undefined,
    lot.longitude ?? undefined,
  );
  if (!normalized.valid) return null;

  const container = document.createElement("div");
  const width = options.width ?? 1000;
  const height = options.height ?? 600;
  container.style.cssText =
    "position:fixed;left:-12000px;top:-12000px;width:" + width + "px;height:" + height + "px;pointer-events:none;";
  document.body.appendChild(container);

  if (options.mapboxToken) mapboxgl.accessToken = options.mapboxToken;

  let map: mapboxgl.Map | null = null;
  try {
    map = new mapboxgl.Map({
      container,
      style: {
        version: 8,
        sources: {},
        layers: [{
          id: "background",
          type: "background",
          paint: { "background-color": "#dce3df" },
        }],
      },
      center: [normalized.centroidLng, normalized.centroidLat],
      zoom: 15,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      fadeDuration: 0,
    });

    await waitForEvent(map, "load", 6000);
    syncSentinelRasterLayers(map, imagery);

    const ring = [...normalized.coords, normalized.coords[0]];
    map.addSource("snapshot-lot", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [ring] },
      },
    });

    map.addLayer({
      id: "snapshot-lot-fill",
      type: "fill",
      source: "snapshot-lot",
      paint: {
        "fill-color": "#10b981",
        "fill-opacity": 0.12,
      },
    });
    map.addLayer({
      id: "snapshot-lot-line",
      type: "line",
      source: "snapshot-lot",
      paint: {
        "line-color": "#ffffff",
        "line-width": 4,
        "line-opacity": 1,
      },
    });
    map.addLayer({
      id: "snapshot-lot-line-accent",
      type: "line",
      source: "snapshot-lot",
      paint: {
        "line-color": "#059669",
        "line-width": 2,
        "line-opacity": 1,
      },
    });

    const bounds = new mapboxgl.LngLatBounds();
    normalized.coords.forEach(([lng, lat]) => bounds.extend([lng, lat]));
    map.fitBounds(bounds, {
      padding: Math.round(Math.min(width, height) * 0.16),
      duration: 0,
      maxZoom: 16.5,
    });
    map.resize();

    await waitForEvent(map, "idle", 12000);
    return map.getCanvas().toDataURL("image/png");
  } catch (error) {
    console.warn("Sentinel snapshot render failed; using fallback imagery", error);
    return null;
  } finally {
    map?.remove();
    container.remove();
  }
};
