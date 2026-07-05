import { describe, it, expect } from 'vitest';
import { computeMethods } from './tasacionMethodsV12';
import { buildTasacionData } from './buildTasacionData';

describe('computeMethods (IVS 2022, 5 métodos)', () => {
  const base = { areaM2: 50_000, compAUFm2: 1.0, compBUFm2: 0.9, costoSueloUFm2: 0.85 };

  it('returns 5 methods whose weights sum to 1', () => {
    const r = computeMethods(base);
    expect(r.methods).toHaveLength(5);
    const totalWeight = r.methods.reduce((a, m) => a + m.weight, 0);
    expect(totalWeight).toBeCloseTo(1, 5);
  });

  it('FMV equals the weighted sum of the methods', () => {
    const r = computeMethods(base);
    const weighted = Math.round(r.methods.reduce((a, m) => a + m.resultUF * m.weight, 0));
    expect(r.fmvUF).toBe(weighted);
  });

  it('negotiation range is ±5% around FMV and per-m² is consistent', () => {
    const r = computeMethods(base);
    expect(r.fmvRangeMinUF).toBe(Math.round(r.fmvUF * 0.95));
    expect(r.fmvRangeMaxUF).toBe(Math.round(r.fmvUF * 1.05));
    expect(r.ufPerM2).toBeCloseTo(r.fmvUF / base.areaM2, 3);
  });

  it('is deterministic for identical inputs', () => {
    expect(computeMethods(base)).toEqual(computeMethods({ ...base }));
  });

  it('dispersion reflects min/max across methods', () => {
    const r = computeMethods(base);
    const values = r.methods.map((m) => m.resultUF);
    expect(r.dispersion.min).toBe(Math.min(...values));
    expect(r.dispersion.max).toBe(Math.max(...values));
    expect(r.dispersion.coefVarPct).toBeGreaterThan(0);
  });

  it('income method respects the 300 m² floor and 35% cap on rentable area', () => {
    // Tiny lot: 5% of 1.000 m² = 50 → floor 300, but cap 35% = 350 → 300 applies
    const small = computeMethods({ ...base, areaM2: 1_000 });
    const arrRow = small.methods[2].inputs.find((i) => i.label === 'Sup. arrendable');
    expect(arrRow?.result).toBe('300 m²');
    // 500 m² lot: floor 300 vs cap 35% = 175 → cap wins
    const tiny = computeMethods({ ...base, areaM2: 500 });
    const tinyRow = tiny.methods[2].inputs.find((i) => i.label === 'Sup. arrendable');
    expect(tinyRow?.result).toBe('175 m²');
  });

  it('uses generic sector labels by default (no broker-specific narrative)', () => {
    const r = computeMethods(base);
    const allText = JSON.stringify(r.methods);
    expect(allText).not.toMatch(/Engel|Vivax|E&V/);
  });
});

describe('buildTasacionData + IVS integration', () => {
  const listing = {
    id: 'l1',
    title: 'Parcela test',
    price: 200_000_000, // CLP
    currency: 'CLP',
    area_m2: 50_000,
    region: 'Maule',
    city: 'Teno',
    type: 'agricola',
    tags: ['plano'],
  };

  it('attaches metodosIVS and adopts the weighted FMV as the report value', () => {
    const ufRate = 40_000;
    const d = buildTasacionData(listing, ufRate);
    expect(d.metodosIVS).toBeDefined();
    expect(d.valorComercialUF).toBe(d.metodosIVS!.fmvUF);
    expect(d.valorComercialCLP).toBe(Math.round(d.metodosIVS!.fmvUF * ufRate));
    expect(d.valorM2UF).toBe(d.metodosIVS!.ufPerM2);
    expect(d.observaciones).toContain('IVS 2022');
  });

  it('anchors comparables to the listing price per m²', () => {
    const ufRate = 40_000;
    const d = buildTasacionData(listing, ufRate);
    const askUF = Math.round(listing.price / ufRate); // 5.000 UF
    const askM2 = +(askUF / listing.area_m2).toFixed(3); // 0.1 UF/m²
    const compA = d.metodosIVS!.methods[0].inputs[0].result;
    expect(compA).toContain((askM2 * 1.05).toFixed(3));
  });

  it('falls back to asking price without metodosIVS when price is missing', () => {
    const d = buildTasacionData({ ...listing, price: 0 }, 40_000);
    expect(d.metodosIVS).toBeUndefined();
    expect(d.valorComercialUF).toBe(0);
  });
});
