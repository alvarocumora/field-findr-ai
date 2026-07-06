import { describe, it, expect } from 'vitest';
import { MAT } from './ParcelaObjects';

describe('MAT material presets', () => {
  it('glass and water are transparent', () => {
    expect(MAT.glass.transparent).toBe(true);
    expect(MAT.glass.opacity).toBeLessThan(1);
    expect(MAT.water.transparent).toBe(true);
    expect(MAT.water.opacity).toBeLessThan(1);
  });

  it('glass is smooth (low roughness) so it reads as glass, not plastic', () => {
    expect(MAT.glass.roughness).toBeLessThan(0.2);
  });

  it('metals are metallic; wood/stone are not', () => {
    expect(MAT.metal.metalness).toBeGreaterThan(0.5);
    expect(MAT.darkMetal.metalness).toBeGreaterThan(0.5);
    expect(MAT.wood.metalness).toBe(0);
    expect(MAT.stone.metalness).toBe(0);
  });

  it('wood and stone are rough (matte)', () => {
    expect(MAT.wood.roughness).toBeGreaterThan(0.7);
    expect(MAT.stone.roughness).toBeGreaterThan(0.9);
  });

  it('every preset defines a colour', () => {
    for (const [name, m] of Object.entries(MAT)) {
      expect(m, name).toHaveProperty('color');
      expect((m as { color: string }).color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
