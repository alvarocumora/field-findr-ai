// Edge function stub for future blockchain anchoring of appraisal hashes.
// Today returns 501 — we intentionally keep no private keys server-side until activated.
// When enabled, this function will:
//   1) take { tasacionId, hash } from the caller
//   2) call OpenTimestamps (free, anchors to Bitcoin via Calendar servers) — default
//      OR submit a tx on Polygon with a mapping(bytes32 => uint256)
//   3) update tasaciones_publicadas.blockchain_anchor with proof + network + tx ref

import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  return new Response(
    JSON.stringify({
      enabled: false,
      message:
        'Anclaje blockchain no activado. Configurar OpenTimestamps o un proveedor EVM en este edge function para habilitarlo.',
      supported_networks: ['bitcoin (OpenTimestamps)', 'polygon', 'base'],
    }),
    { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
