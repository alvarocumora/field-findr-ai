import { describe, it, expect, vi } from 'vitest';
import { corsHeaders, jsonResponse, handlePreflight, requireAuth, requireRole } from './http';

describe('jsonResponse', () => {
  it('serializes the body and sets CORS + content-type headers', async () => {
    const res = jsonResponse({ ok: true }, 201);
    expect(res.status).toBe(201);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(await res.json()).toEqual({ ok: true });
  });

  it('merges extra headers without dropping CORS', () => {
    const res = jsonResponse({ a: 1 }, 200, { 'Retry-After': '60' });
    expect(res.headers.get('Retry-After')).toBe('60');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});

describe('handlePreflight', () => {
  it('answers OPTIONS with CORS headers and an empty body', async () => {
    const res = handlePreflight(new Request('https://x.test', { method: 'OPTIONS' }));
    expect(res).not.toBeNull();
    expect(res!.headers.get('Access-Control-Allow-Origin')).toBe(corsHeaders['Access-Control-Allow-Origin']);
    expect(await res!.text()).toBe('');
  });

  it('returns null for non-OPTIONS requests', () => {
    expect(handlePreflight(new Request('https://x.test', { method: 'POST' }))).toBeNull();
  });
});

const clientWithClaims = (claims: { sub?: string } | null, error: unknown = null) => ({
  auth: { getClaims: vi.fn().mockResolvedValue({ data: claims ? { claims } : null, error }) },
});

describe('requireAuth', () => {
  it('rejects a missing Authorization header', async () => {
    const res = await requireAuth(new Request('https://x.test'), clientWithClaims({ sub: 'u1' }));
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(401);
  });

  it('rejects a header without the Bearer scheme', async () => {
    const req = new Request('https://x.test', { headers: { Authorization: 'Basic abc' } });
    const res = await requireAuth(req, clientWithClaims({ sub: 'u1' }));
    expect((res as Response).status).toBe(401);
  });

  it('rejects when getClaims errors or returns no sub', async () => {
    const req = new Request('https://x.test', { headers: { Authorization: 'Bearer t1' } });
    expect(((await requireAuth(req, clientWithClaims(null))) as Response).status).toBe(401);
    expect(((await requireAuth(req, clientWithClaims({}))) as Response).status).toBe(401);
    expect(((await requireAuth(req, clientWithClaims({ sub: 'u1' }, 'boom'))) as Response).status).toBe(401);
  });

  it('resolves userId and token on success', async () => {
    const req = new Request('https://x.test', { headers: { Authorization: 'Bearer t1' } });
    const client = clientWithClaims({ sub: 'u1' });
    const auth = await requireAuth(req, client);
    expect(auth).toEqual({ userId: 'u1', token: 't1' });
    expect(client.auth.getClaims).toHaveBeenCalledWith('t1');
  });
});

describe('requireRole', () => {
  const req = new Request('https://x.test', { headers: { Authorization: 'Bearer t1' } });

  it('propagates the 401 from requireAuth without calling the RPC', async () => {
    const rpc = vi.fn();
    const client = { ...clientWithClaims(null), rpc };
    const res = await requireRole(req, client, 'admin');
    expect((res as Response).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('returns 403 when has_role is false', async () => {
    const client = { ...clientWithClaims({ sub: 'u1' }), rpc: vi.fn().mockResolvedValue({ data: false }) };
    const res = await requireRole(req, client, 'admin');
    expect((res as Response).status).toBe(403);
    expect(client.rpc).toHaveBeenCalledWith('has_role', { _user_id: 'u1', _role: 'admin' });
  });

  it('returns the auth context when has_role is true', async () => {
    const client = { ...clientWithClaims({ sub: 'u1' }), rpc: vi.fn().mockResolvedValue({ data: true }) };
    const auth = await requireRole(req, client, 'admin');
    expect(auth).toEqual({ userId: 'u1', token: 't1' });
  });
});
