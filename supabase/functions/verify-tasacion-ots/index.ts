// Public verification of an OpenTimestamps anchor for a published appraisal.
// Public (no auth): given a tasacionId, fetches stored digest + calendars and asks
// each calendar for the upgraded proof at /timestamp/{digest_hex}.
// - 200 with body  => calendar has an upgraded proof (likely Bitcoin-attested)
// - 404            => still pending inclusion in a Bitcoin block
// Returns aggregate status + per-calendar detail. We never call user resources here.

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

type CalendarResult = {
  url: string;
  ok: boolean;
  status: 'confirmed' | 'pending' | 'error';
  http?: number;
  proof_bytes?: number;
  error?: string;
};

const checkCalendar = async (url: string, hexDigest: string): Promise<CalendarResult> => {
  try {
    const r = await fetch(`${url}/timestamp/${hexDigest}`, {
      method: 'GET',
      headers: { Accept: 'application/vnd.opentimestamps.v1' },
    });
    if (r.status === 404) {
      await r.body?.cancel();
      return { url, ok: true, status: 'pending', http: 404 };
    }
    if (!r.ok) {
      await r.body?.cancel();
      return { url, ok: false, status: 'error', http: r.status, error: `HTTP ${r.status}` };
    }
    const buf = new Uint8Array(await r.arrayBuffer());
    return { url, ok: true, status: 'confirmed', http: 200, proof_bytes: buf.length };
  } catch (e) {
    return { url, ok: false, status: 'error', error: (e as Error).message };
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let tasacionId: string | null = url.searchParams.get('tasacionId');
    if (!tasacionId && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      tasacionId = (body?.tasacionId as string | undefined) ?? null;
    }
    if (!tasacionId || !/^[0-9a-f-]{36}$/i.test(tasacionId)) {
      return json(400, { error: 'tasacionId inválido' });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
    const sb = createClient(SUPABASE_URL, ANON);

    const { data: row, error } = await sb
      .from('tasaciones_publicadas')
      .select('id, blockchain_anchor, revoked_at')
      .eq('id', tasacionId)
      .maybeSingle();

    if (error || !row) return json(404, { error: 'Tasación no encontrada' });

    const anchor = row.blockchain_anchor;
    if (!anchor || anchor.protocol !== 'opentimestamps' || !anchor.digest) {
      return json(200, {
        ok: true,
        anchored: false,
        message: 'Esta tasación aún no ha sido anclada con OpenTimestamps.',
      });
    }

    const calendars: string[] =
      Array.isArray(anchor.calendars) && anchor.calendars.length > 0
        ? anchor.calendars.map((c) => c.url).filter(Boolean)
        : ['https://a.pool.opentimestamps.org', 'https://b.pool.opentimestamps.org', 'https://finney.calendar.eternitywall.com'];

    const checks = await Promise.all(calendars.map((u) => checkCalendar(u, anchor.digest)));
    const confirmed = checks.filter((c) => c.status === 'confirmed').length;
    const pending = checks.filter((c) => c.status === 'pending').length;
    const errors = checks.filter((c) => c.status === 'error').length;

    let aggregate: 'confirmed' | 'pending' | 'unknown';
    if (confirmed > 0) aggregate = 'confirmed';
    else if (pending > 0) aggregate = 'pending';
    else aggregate = 'unknown';

    return json(200, {
      ok: true,
      anchored: true,
      revoked: !!row.revoked_at,
      aggregate,
      confirmed_count: confirmed,
      pending_count: pending,
      error_count: errors,
      digest: anchor.digest,
      submitted_at: anchor.submitted_at,
      checks,
      verify_hint:
        aggregate === 'confirmed'
          ? 'Al menos un calendar tiene la prueba actualizada. El SHA-256 ya quedó comprometido en un bloque Bitcoin.'
          : aggregate === 'pending'
            ? 'El digest fue recibido por los calendarios, esperando inclusión en un bloque Bitcoin (~horas).'
            : 'No se pudo confirmar el estado en este momento. Intenta nuevamente más tarde.',
    });
  } catch (e) {
    return json(500, { error: (e as Error).message });
  }
});
