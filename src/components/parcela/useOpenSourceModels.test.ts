import { describe, it, expect } from 'vitest';
import { toCdn, prettyName, normalize } from './useOpenSourceModels';

describe('toCdn', () => {
  it('rewrites raw.githubusercontent URLs to the jsDelivr CORS CDN', () => {
    const raw = 'https://raw.githubusercontent.com/ToxSam/cc0-models-Polygonal-Mind/main/projects/MomusPark/Bench_01_Art.glb';
    expect(toCdn(raw)).toBe(
      'https://cdn.jsdelivr.net/gh/ToxSam/cc0-models-Polygonal-Mind@main/projects/MomusPark/Bench_01_Art.glb',
    );
  });
  it('leaves non-github URLs untouched', () => {
    const u = 'https://example.com/model.glb';
    expect(toCdn(u)).toBe(u);
  });
});

describe('prettyName', () => {
  it('strips suffixes and underscores', () => {
    expect(prettyName('Bench_01_Art')).toBe('Bench 01');
    expect(prettyName('DeerArmature')).toBe('Deer');
    expect(prettyName('Tree_02_Art.glb')).toBe('Tree 02');
  });
});

describe('normalize', () => {
  const asset = (name: string, category: string) => ({
    name,
    model_file_url: `https://raw.githubusercontent.com/ToxSam/cc0-models-Polygonal-Mind/main/projects/MomusPark/${name}.glb`,
    thumbnail_url: `https://raw.githubusercontent.com/ToxSam/cc0-models-Polygonal-Mind/main/projects/MomusPark/${name}_thumbnail.png`,
    format: 'GLB',
    metadata: { attributes: [{ trait_type: 'Category', value: category }] },
  });

  it('maps relevant categories to Spanish groups and CDN urls', () => {
    const out = normalize([asset('Bench_01_Art', 'Park Furniture'), asset('Rock_02_Art', 'Nature')]);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ category: 'cc0', group: 'mobiliario' });
    expect(out[0].url).toContain('cdn.jsdelivr.net/gh/');
    expect(out[1].group).toBe('naturaleza');
  });

  it('drops irrelevant categories (avatars, wearables, food)', () => {
    const out = normalize([asset('Pants', 'Wearable'), asset('Beer', 'Food & Drink')]);
    expect(out).toHaveLength(0);
  });

  it('skips assets without a GLB url', () => {
    const out = normalize([{ name: 'x', metadata: { attributes: [{ trait_type: 'Category', value: 'Nature' }] } }]);
    expect(out).toHaveLength(0);
  });
});
