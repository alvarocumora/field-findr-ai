import { describe, expect, it } from 'vitest';
import { formatProjectArea } from './formatProjectArea';

describe('project area storage contract', () => {
  it('converts the Hualañé square-metre value to hectares', () => {
    expect(formatProjectArea(417_500)).toBe('41,75 ha');
    expect(formatProjectArea(10_000)).toBe('1 ha');
    expect(formatProjectArea(7_500)).toBe('7.500 m²');
  });
  it('does not invent an area for absent or invalid values', () => {
    for (const value of [null, undefined, 0, -1, NaN, Infinity]) expect(formatProjectArea(value)).toBe('No informado');
  });
});
