import mapboxgl from "mapbox-gl";
import type { MapView } from "@/lib/pdf/masterplan";
import type { SentinelImageryResult } from "./sentinel";
import { syncSentinelRasterLayers } from "./mapboxSentinel";

interface SnapshotOptions {
  mapboxToken?: string | null;
}

const waitFor = (
  map: mapboxgl.Map,
  event: "load" | "idle",
  timeoutMs: number,
) => new Promise<void>((resolve, reject) => {
  let settled = false;
  const timer = window.setTimeout(() => {
    if (settled) return;
    settled = true;
    if (event === "idle") resolve();
    else reject(new Error("Sentinel project snapshot timed out"));
  }, timeoutMs);

  map.once(event, () => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timer);
    resolve();
  });
});

/**
 * Render the same center/zoom/viewport used by the vector PDF masterplan.
 * This keeps the satellite raster aligned with projectToBox() coordinates.
 */
export const renderSentinelMapViewSnapshot = async (
  view: MapView,
  imagery: SentinelImageryResult | null | undefined,
  options: SnapshotOptions = {},
): Promise<string | null> => {
  if (typeof document === "undefined" || !imagery?.available) return null;

  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-14000px;top:-14000px;width:" +
    view.wPx + "px;height:" + view.hPx + "px;pointer-events:none;";
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
      center: [view.lng, view.lat],
      zoom: view.zoom,
      pitch: 0,
      bearing: 0,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      fadeDuration: 0,
    });

    await waitFor(map, "load", 6000);
    syncSentinelRasterLayers(map, imagery);
    map.resize();
    map.jumpTo({ center: [view.lng, view.lat], zoom: view.zoom, pitch: 0, bearing: 0 });
    await waitFor(map, "idle", 12000);

    return map.getCanvas().toDataURL("image/jpeg", 0.9);
  } catch (error) {
    console.warn("Sentinel project snapshot failed; using Mapbox fallback", error);
    return null;
  } finally {
    map?.remove();
    container.remove();
  }
};
