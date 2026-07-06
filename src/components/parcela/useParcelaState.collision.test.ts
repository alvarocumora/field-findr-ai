import { describe, it, expect } from 'vitest';
import { checkCollision, OBJECT_CATALOG, type PlacedObject } from './useParcelaState';

const obj = (id: string, type: PlacedObject['type'], x: number, z: number, scale = 1): PlacedObject => ({
  id, type, position: [x, 0, z], rotation: 0, scale,
});

describe('checkCollision', () => {
  const house = obj('a', 'casa_120', 0, 0); // boundingRadius 4.5

  it('detects overlap when two objects are closer than their combined radii', () => {
    const other = obj('b', 'casa_120', 3, 0); // 3m apart, radii 4.5+4.5 → overlap
    expect(checkCollision([house, other], other, 'b')).toBe(true);
  });

  it('allows placement when objects are far enough apart', () => {
    const other = obj('b', 'casa_120', 20, 0);
    expect(checkCollision([house, other], other, 'b')).toBe(false);
  });

  it('excludes the moving object itself from the check', () => {
    // Only the house exists; moving it must not collide with itself
    expect(checkCollision([house], { ...house, position: [1, 0, 1] }, 'a')).toBe(false);
  });

  it('scales the bounding radius with object scale', () => {
    // Threshold = (r1+r2)*0.6. big pino r=1×3=3, small pino r=1 → (3+1)*0.6=2.4
    const big = obj('b', 'arbol_pino', 6, 0, 3);
    expect(OBJECT_CATALOG.arbol_pino.boundingRadius).toBe(1);
    // 2.0m apart → inside 2.4 threshold → collision
    expect(checkCollision([big], obj('c', 'arbol_pino', 8, 0, 1), 'c')).toBe(true);
    // 3.0m apart → outside threshold → no collision (proves scale is applied,
    // since without ×3 scale the threshold would be only (1+1)*0.6=1.2)
    expect(checkCollision([big], obj('d', 'arbol_pino', 9, 0, 1), 'd')).toBe(false);
  });
});
