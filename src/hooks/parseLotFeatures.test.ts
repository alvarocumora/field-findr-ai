import { describe, expect, it } from 'vitest';
import { parseLotFeatures } from './useLots';

describe('parseLotFeatures: rol SII', () => {
  it('reads a valid SII rol and certificate', () => {
    expect(parseLotFeatures({ rolSii: '08022-00001', rolCertificate: '934308' })).toMatchObject({
      rolSii: '08022-00001',
      rolCertificate: '934308',
    });
  });

  it('ignores malformed values instead of showing them', () => {
    const f = parseLotFeatures({ rolSii: '<script>', rolCertificate: 'abc' });
    expect(f.rolSii).toBeUndefined();
    expect(f.rolCertificate).toBeUndefined();
  });

  it('keeps lots without a rol unchanged', () => {
    expect(parseLotFeatures(null).rolSii).toBeUndefined();
    expect(parseLotFeatures({ hasWater: true }).hasWater).toBe(true);
  });
});
