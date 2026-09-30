import { describe, expect, it } from "vitest";
import { averageCloudCover, selectLatestSentinelPass } from "./sentinel";

const feature = (id: string, datetime: string, cloud: number, tilejson = true) => ({
  id,
  bbox: [-71.8, -35.0, -71.7, -34.9],
  properties: { datetime, "eo:cloud_cover": cloud },
  assets: tilejson
    ? {
        tilejson: { href: "https://example.test/" + id + "/tilejson.json" },
        rendered_preview: { href: "https://example.test/" + id + "/preview.png" },
      }
    : {},
});

describe("selectLatestSentinelPass", () => {
  it("prefers the newest pass that satisfies the cloud threshold", () => {
    const scenes = selectLatestSentinelPass([
      feature("cloudy-new", "2026-09-28T15:00:00Z", 82),
      feature("clear", "2026-09-26T15:00:00Z", 12),
      feature("older", "2026-09-20T15:00:00Z", 2),
    ], 35);
    expect(scenes.map((scene) => scene.item_id)).toEqual(["clear"]);
  });

  it("keeps adjacent granules from the same orbital pass", () => {
    const scenes = selectLatestSentinelPass([
      feature("tile-a", "2026-09-28T15:00:00Z", 8),
      feature("tile-b", "2026-09-28T15:04:00Z", 14),
      feature("older", "2026-09-26T15:00:00Z", 1),
    ], 35);
    expect(scenes.map((scene) => scene.item_id).sort()).toEqual(["tile-a", "tile-b"]);
  });

  it("falls back to the latest usable scene when every scene is cloudy", () => {
    const scenes = selectLatestSentinelPass([
      feature("latest", "2026-09-28T15:00:00Z", 70),
      feature("older", "2026-09-26T15:00:00Z", 60),
    ], 35);
    expect(scenes[0]?.item_id).toBe("latest");
  });

  it("ignores items without TileJSON visualization assets", () => {
    const scenes = selectLatestSentinelPass([
      feature("no-tiles", "2026-09-29T15:00:00Z", 1, false),
      feature("renderable", "2026-09-28T15:00:00Z", 5),
    ]);
    expect(scenes.map((scene) => scene.item_id)).toEqual(["renderable"]);
  });
});

describe("averageCloudCover", () => {
  it("averages available cloud percentages", () => {
    const scenes = selectLatestSentinelPass([
      feature("a", "2026-09-28T15:00:00Z", 10),
      feature("b", "2026-09-28T15:04:00Z", 20),
    ]);
    expect(averageCloudCover(scenes)).toBe(15);
  });
});
