import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Server-authoritative pricing (CLP) for the "Destacado" add-on.
// Keep aligned with the /pricing page and the memory `visibility-add-ons`.
const PLANS: Record<string, { days: number; amount: number; label: string }> = {
  "featured-7": { days: 7, amount: 19990, label: "Destacado — 7 días" },
  "featured-30": { days: 30, amount: 59990, label: "Destacado — 30 días" },
  "featured-90": { days: 90, amount: 149990, label: "Destacado — 90 días" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth: verify caller is signed in and owns the project ─────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const projectId = String(body?.project_id ?? "");
    const planKey = String(body?.plan ?? "");
    const plan = PLANS[planKey];
    if (!projectId || !plan) return json({ error: "Invalid plan or project_id" }, 400);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: project } = await admin
      .from("projects")
      .select("id, name, user_id, status")
      .eq("id", projectId)
      .maybeSingle();

    if (!project) return json({ error: "Project not found" }, 404);
    if (project.user_id !== userId) return json({ error: "Not the project owner" }, 403);
    if (project.status !== "active") {
      return json({ error: "Project must be active to be featured" }, 400);
    }

    // ── Create MercadoPago preference ────────────────────────────────────
    const origin = req.headers.get("origin") || "https://ofertaterrenos.com";
    const externalReference = JSON.stringify({
      type: "featured",
      project_id: projectId,
      user_id: userId,
      plan: planKey,
      days: plan.days,
    });

    const preference = {
      items: [
        {
          id: planKey,
          title: `${plan.label} · ${project.name}`,
          description: `Slot destacado en la home por ${plan.days} días`,
          quantity: 1,
          unit_price: plan.amount,
          currency_id: "CLP",
        },
      ],
      external_reference: externalReference,
      back_urls: {
        success: `${origin}/asesor/projects?featured=success`,
        failure: `${origin}/asesor/projects?featured=failure`,
        pending: `${origin}/asesor/projects?featured=pending`,
      },
      auto_return: "approved",
      notification_url: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`,
      statement_descriptor: "OFERTA TERRENOS",
      metadata: { project_id: projectId, plan: planKey, days: plan.days },
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });
    if (!mpRes.ok) {
      const details = await mpRes.text();
      console.error("MP preference failed", mpRes.status, details);
      return json({ error: "Payment provider error", status: mpRes.status, details }, 502);
    }
    const pref = await mpRes.json();

    return json({
      preference_id: pref.id,
      init_point: pref.init_point,
      sandbox_init_point: pref.sandbox_init_point,
      amount: plan.amount,
      days: plan.days,
    });
  } catch (err) {
    console.error("create-featured-checkout error", err);
    return json({ error: (err as Error).message ?? "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
