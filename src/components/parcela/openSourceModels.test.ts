import { describe, it, expect } from 'vitest';
import { OPEN_SOURCE_MODELS, OPEN_SOURCE_LICENSE } from './openSourceModels';

describe('OPEN_SOURCE_MODELS registry', () => {
  it('has entries, all tagged as cc0 category', () => {
    expect(OPEN_SOURCE_MODELS.length).toBeGreaterThan(8);
    expect(OPEN_SOURCE_MODELS.every((m) => m.category === 'cc0')).toBe(true);
  });

  it('serves GLBs over the jsDelivr CDN (CORS-enabled) as .glb', () => {
    for (const m of OPEN_SOURCE_MODELS) {
      expect(m.url).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/gh\//);
      expect(m.url).toMatch(/\.glb$/);
      expect(m.thumbnail).toMatch(/_thumbnail\.png$/);
    }
  });

  it('every model has a display name and a known group', () => {
    for (const m of OPEN_SOURCE_MODELS) {
      expect(m.name.length).toBeGreaterThan(0);
      expect(['naturaleza', 'mobiliario', 'fauna']).toContain(m.group);
    }
  });

  it('model urls are unique', () => {
    const urls = OPEN_SOURCE_MODELS.map((m) => m.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('exposes a CC0 attribution with a source link', () => {
    expect(OPEN_SOURCE_LICENSE.label).toContain('CC0');
    expect(OPEN_SOURCE_LICENSE.url).toMatch(/^https:\/\/github\.com\//);
  });
});
