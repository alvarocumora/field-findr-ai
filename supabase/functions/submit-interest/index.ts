import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimit, clientIp, tooManyRequests } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Public lead-capture endpoint: throttle to stop CRM spam floods.
  if (!rateLimit(`interest:${clientIp(req)}`, { limit: 5, windowMs: 60_000 })) {
    return tooManyRequests(corsHeaders);
  }

  try {
    const body = await req.json();
    const { projectOwnerId, firstName, lastName, email, phone, projectId, lotId, source, notes, budgetMin, budgetMax, preferredAreaMin, preferredAreaMax } = body;

    if (!projectOwnerId || !firstName || !email || !projectId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: projectOwnerId, firstName, email, projectId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!UUID_RE.test(projectOwnerId) || !UUID_RE.test(projectId) || (lotId && !UUID_RE.test(lotId))) {
      return new Response(
        JSON.stringify({ error: "Invalid id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!EMAIL_RE.test(String(email).trim())) {
      return new Response(
        JSON.stringify({ error: "Invalid email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // The lead is attributed to caller-supplied owner/project ids — verify they
    // actually belong together so nobody can attach spam leads to arbitrary
    // owners or mismatched projects.
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .eq("user_id", projectOwnerId)
      .maybeSingle();

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found for that owner" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (lotId) {
      const { data: lot } = await supabase
        .from("lots")
        .select("id")
        .eq("id", lotId)
        .eq("project_id", projectId)
        .maybeSingle();
      if (!lot) {
        return new Response(
          JSON.stringify({ error: "Lot does not belong to that project" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { data, error } = await supabase.from("leads").insert({
      user_id: projectOwnerId,
      first_name: String(firstName).slice(0, 100),
      last_name: lastName ? String(lastName).slice(0, 100) : null,
      email: String(email).trim().slice(0, 200),
      phone: phone ? String(phone).slice(0, 40) : null,
      project_id: projectId,
      lot_id: lotId || null,
      source: source ? String(source).slice(0, 60) : "cotizador_publico",
      status: "new",
      notes: notes ? String(notes).slice(0, 2000) : null,
      budget_min: budgetMin || null,
      budget_max: budgetMax || null,
      preferred_area_min: preferredAreaMin || null,
      preferred_area_max: preferredAreaMax || null,
    }).select().single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, leadId: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("submit-interest error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to submit interest" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
