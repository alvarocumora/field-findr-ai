import { describe, expect, it } from "vitest";
import { formatSentinelDate, satelliteBoundsFromLots } from "./sentinel";

describe("satelliteBoundsFromLots", () => {
  it("builds padded bounds from parcel polygons", () => {
    const bbox = satelliteBoundsFromLots([
      {
        polygon: [
          [-71.80, -35.00],
          [-71.79, -35.00],
          [-71.79, -34.99],
          [-71.80, -34.99],
        ],
      },
    ]);
    expect(bbox).not.toBeNull();
    expect(bbox![0]).toBeLessThan(-71.80);
    expect(bbox![1]).toBeLessThan(-35.00);
    expect(bbox![2]).toBeGreaterThan(-71.79);
    expect(bbox![3]).toBeGreaterThan(-34.99);
  });

  it("ignores nullable centroids instead of expanding bounds toward zero", () => {
    const bbox = satelliteBoundsFromLots([
      {
        polygon: [
          [-71.80, -35.00],
          [-71.79, -35.00],
          [-71.79, -34.99],
          [-71.80, -34.99],
        ],
        latitude: null,
        longitude: null,
      },
    ]);
    expect(bbox).not.toBeNull();
    expect(bbox![0]).toBeGreaterThan(-72);
    expect(bbox![2]).toBeLessThan(-71);
  });

  it("falls back to a project center", () => {
    expect(satelliteBoundsFromLots([], { lat: -35, lng: -71.8 })).toEqual([
      -71.815,
      -35.015,
      -71.785,
      -34.985,
    ]);
  });
});

describe("formatSentinelDate", () => {
  it("formats the acquisition date for Chilean UI", () => {
    expect(formatSentinelDate("2026-09-28T15:00:00Z")).toMatch(/28-09-2026|28\/09\/2026/);
  });
});
