import { describe, expect, it } from 'vitest';
import {
  getChileCommuneOptions,
  groupByCanonicalRegion,
  resolveChileCommune,
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
    expect(a.regionIso).toBe('CL-ML');
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

  it('resuelve Hualañé con provincia y CUT', () => {
    const result = resolveChileCommune('Hualañe', 'Maule');
    expect(result?.commune).toBe('Hualañé');
    expect(result?.communeCode).toBe('07302');
    expect(result?.province).toBe('Curicó');
    expect(result?.region.regionIso).toBe('CL-ML');
  });

  it('resuelve Licantén dentro de Curicó y Maule', () => {
    const result = resolveChileCommune('Licanten', 'Región del Maule');
    expect(result?.commune).toBe('Licantén');
    expect(result?.communeCode).toBe('07303');
    expect(result?.province).toBe('Curicó');
    expect(result?.region.displayName).toBe('Región del Maule');
  });

  it('entrega comunas canónicas de Maule para formularios', () => {
    const options = getChileCommuneOptions('Maule');
    expect(options.find((option) => option.value === 'Hualañé')?.code).toBe('07302');
    expect(options.find((option) => option.value === 'Licantén')?.code).toBe('07303');
  });
});
