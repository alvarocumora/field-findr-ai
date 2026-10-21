import { describe, expect, it } from 'vitest';
import { overlayCropBox, yawPitchToPixel } from './quoteImage';

describe('quoteImage projection', () => {
  it('maps yaw 0 / pitch 0 to the panorama centre', () => {
    expect(yawPitchToPixel(0, 0, 2000, 1000)).toEqual({ x: 1000, y: 500 });
  });
  it('maps pitch -π/2 to the bottom edge', () => {
    expect(yawPitchToPixel(0, -Math.PI / 2, 2000, 1000).y).toBe(1000);
  });
  it('crop box contains every overlay point in the banner frame', () => {
    const box = overlayCropBox({ points: [{ yaw: 0.4, pitch: -0.8 }, { yaw: 0.6, pitch: -0.9 }, { yaw: 0.5, pitch: -1 }] }, 6144, 3072);
    expect(box.sw / box.sh).toBeCloseTo(1280 / 516, 1);
    for (const p of box.points) {
      expect(p.x).toBeGreaterThanOrEqual(box.sx);
      expect(p.x).toBeLessThanOrEqual(box.sx + box.sw);
    }
  });
});
