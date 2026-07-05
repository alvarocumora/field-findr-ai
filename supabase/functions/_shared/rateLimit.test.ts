import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit, clientIp, tooManyRequests } from './rateLimit';

describe('rateLimit', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('allows up to the limit within the window and rejects the excess', () => {
    const key = `t1-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, { limit: 5, windowMs: 60_000 })).toBe(true);
    }
    expect(rateLimit(key, { limit: 5, windowMs: 60_000 })).toBe(false);
  });

  it('frees slots after the window slides past old hits', () => {
    const key = `t2-${Math.random()}`;
    expect(rateLimit(key, { limit: 1, windowMs: 60_000 })).toBe(true);
    expect(rateLimit(key, { limit: 1, windowMs: 60_000 })).toBe(false);

    vi.advanceTimersByTime(61_000);
    expect(rateLimit(key, { limit: 1, windowMs: 60_000 })).toBe(true);
  });

  it('tracks independent keys separately', () => {
    const a = `t3a-${Math.random()}`;
    const b = `t3b-${Math.random()}`;
    expect(rateLimit(a, { limit: 1, windowMs: 60_000 })).toBe(true);
    expect(rateLimit(a, { limit: 1, windowMs: 60_000 })).toBe(false);
    expect(rateLimit(b, { limit: 1, windowMs: 60_000 })).toBe(true);
  });
});

describe('clientIp', () => {
  it('takes the first hop of x-forwarded-for', () => {
    const req = new Request('https://x.test', {
      headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' },
    });
    expect(clientIp(req)).toBe('203.0.113.7');
  });

  it('falls back to "unknown" without the header', () => {
    expect(clientIp(new Request('https://x.test'))).toBe('unknown');
  });
});

describe('tooManyRequests', () => {
  it('returns a 429 with Retry-After and CORS headers', async () => {
    const res = tooManyRequests({ 'Access-Control-Allow-Origin': '*' });
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    const body = await res.json();
    expect(body.error).toMatch(/Too many requests/);
  });
});
