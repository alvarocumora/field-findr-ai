import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './errorMessage';

describe('unknown caught error messages', () => {
  it('preserves Error, PostgREST object and string messages', () => {
    expect(getErrorMessage(new Error('Failed'))).toBe('Failed');
    expect(getErrorMessage({ message: 'Access denied', code: '42501' })).toBe('Access denied');
    expect(getErrorMessage('Network unavailable')).toBe('Network unavailable');
  });
  it('uses a readable fallback for malformed values', () => {
    for (const value of [null, undefined, 500, {}, { message: 500 }]) expect(getErrorMessage(value)).toBe('Error desconocido');
  });
});
