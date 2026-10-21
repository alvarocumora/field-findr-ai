import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// One-time import for Reserva Huellelhue. Removed after use.
Deno.serve(async (req) => {
  const body = await req.json();
  if (body.token !== "4652e0dd19e2badff03485e776419744") return new Response("no", { status: 403 });
  const s = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const out: Record<string, unknown> = {};
  for (const [t, rows] of [["projects", body.projects], ["listings", body.listings], ["lots", body.lots], ["tour_scenes", body.tour_scenes]] as const) {
    const { error } = await s.from(t).insert(rows as any[]);
    out[t] = error ? error.message : (rows as any[]).length;
    if (error) break;
  }
  return new Response(JSON.stringify(out), { headers: { "content-type": "application/json" } });
});
