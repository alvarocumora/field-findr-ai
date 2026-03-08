import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase.from("leads").insert({
      user_id: projectOwnerId,
      first_name: firstName,
      last_name: lastName || null,
      email: email.trim(),
      phone: phone || null,
      project_id: projectId,
      lot_id: lotId || null,
      source: source || "cotizador_publico",
      status: "new",
      notes: notes || null,
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
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
