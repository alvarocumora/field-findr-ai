import { describe, expect, it } from 'vitest';
import {
  groupByCanonicalRegion,
  resolveRegionTerritory,
  sameRegion,
  territorySlug,
} from './territories';

describe('territories', () => {
  it('normaliza Maule y Región del Maule como el mismo territorio', () => {
    const a = resolveRegionTerritory('Maule');
    const b = resolveRegionTerritory('Región del Maule');

    expect(a.key).toBe('maule');
    expect(b.key).toBe('maule');
    expect(a.displayName).toBe('Región del Maule');
    expect(sameRegion('Maule', 'Región del Maule')).toBe(true);
  });

  it('mantiene un slug canónico estable', () => {
    expect(territorySlug('Región del Biobío')).toBe('region-del-biobio');
    expect(resolveRegionTerritory('Región del Biobío').slug).toBe('biobio');
  });

  it('agrupa proyectos que usan variantes históricas de región', () => {
    const groups = groupByCanonicalRegion([
      { id: 'a', region: 'Maule', country: 'Chile' },
      { id: 'b', region: 'Región del Maule', country: 'Chile' },
      { id: 'c', region: 'Valparaíso', country: 'Chile' },
    ]);

    expect(groups).toHaveLength(2);
    const maule = groups.find((group) => group.territory.key === 'maule');
    expect(maule?.items).toHaveLength(2);
  });
});
