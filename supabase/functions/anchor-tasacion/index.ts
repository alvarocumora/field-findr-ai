// Anchor a published appraisal's SHA-256 to Bitcoin via OpenTimestamps calendar servers.
// Free, no private keys, no on-chain fees. Each calendar will eventually fold the digest
// into a Merkle tree committed in a Bitcoin block (typically within hours).
//
// POST { tasacionId: uuid, hashField?: 'pdf_sha256' | 'pdf_final_sha256' }
// -> updates tasaciones_publicadas.blockchain_anchor with:
//    { network, protocol, digest, calendars: [{ url, ok, proof_b64?, error? }], submitted_at }

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CALENDARS = [
  'https://a.pool.opentimestamps.org',
  'https://b.pool.opentimestamps.org',
  'https://finney.calendar.eternitywall.com',
];

const hexToBytes = (hex: string): Uint8Array => {
  const clean = hex.trim().toLowerCase().replace(/^0x/, '');
  if (clean.length !== 64) throw new Error('SHA-256 hex must be 64 chars');
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
};

const bytesToB64 = (bytes: Uint8Array): string => {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
};

const submitToCalendar = async (url: string, digest: Uint8Array) => {
  try {
    const r = await fetch(`${url}/digest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', 'Accept': 'application/vnd.opentimestamps.v1' },
      body: digest,
    });
    if (!r.ok) return { url, ok: false, error: `HTTP ${r.status}` };
    const buf = new Uint8Array(await r.arrayBuffer());
    return { url, ok: true, proof_b64: bytesToB64(buf), bytes: buf.length };
  } catch (e) {
    return { url, ok: false, error: (e as Error).message };
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Auth: require a logged-in user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: authErr } = await userClient.auth.getClaims(
      authHeader.replace('Bearer ', '')
    );
    if (authErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const tasacionId = body?.tasacionId as string | undefined;
    const hashField = (body?.hashField as 'pdf_sha256' | 'pdf_final_sha256') ?? 'pdf_final_sha256';
    if (!tasacionId || !/^[0-9a-f-]{36}$/i.test(tasacionId)) {
      return new Response(JSON.stringify({ error: 'tasacionId inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!['pdf_sha256', 'pdf_final_sha256'].includes(hashField)) {
      return new Response(JSON.stringify({ error: 'hashField inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: row, error: selErr } = await admin
      .from('tasaciones_publicadas')
      .select('id, publisher_user_id, pdf_sha256, pdf_final_sha256, blockchain_anchor')
      .eq('id', tasacionId)
      .maybeSingle();

    if (selErr || !row) {
      return new Response(JSON.stringify({ error: 'Tasación no encontrada' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Authorization: only publisher (or admin via has_role) can anchor.
    if (row.publisher_user_id !== userId) {
      const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userId, _role: 'admin' });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const hexHash = (row as any)[hashField] as string | null;
    if (!hexHash) {
      return new Response(JSON.stringify({ error: `${hashField} no disponible` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const digest = hexToBytes(hexHash);

    // Submit to all calendars in parallel
    const results = await Promise.all(CALENDARS.map((c) => submitToCalendar(c, digest)));
    const okCount = results.filter((r) => r.ok).length;

    const anchor = {
      network: 'bitcoin',
      protocol: 'opentimestamps',
      hash_field: hashField,
      digest: hexHash,
      submitted_at: new Date().toISOString(),
      calendars: results,
      ok_count: okCount,
      status: okCount > 0 ? 'pending_bitcoin_attestation' : 'failed',
      verify_hint: 'Cualquiera puede re-enviar el SHA-256 a un calendar OpenTimestamps para confirmar inclusión y, tras la confirmación del bloque (~horas), recuperar la prueba Bitcoin.',
    };

    const { error: upErr } = await admin
      .from('tasaciones_publicadas')
      .update({ blockchain_anchor: anchor })
      .eq('id', tasacionId);
    if (upErr) {
      return new Response(JSON.stringify({ error: upErr.message, anchor }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, anchor }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
