import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get profiles with onboarding data
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, onboarding_data")
      .eq("onboarding_completed", true)
      .not("onboarding_data", "is", null);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ matched: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get recently published lots (last 24h)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const { data: newLots } = await supabase
      .from("lots")
      .select("id, area, price, features, project_id")
      .eq("status", "available")
      .gte("created_at", oneDayAgo.toISOString());

    if (!newLots || newLots.length === 0) {
      return new Response(JSON.stringify({ matched: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let notificationCount = 0;

    for (const profile of profiles) {
      const prefs = profile.onboarding_data as Record<string, string>;
      if (!prefs || !prefs.budget) continue;

      for (const lot of newLots) {
        let score = 0;
        const price = lot.price || 0;

        // Budget match
        if (prefs.budget === "low" && price <= 15_000_000) score += 30;
        else if (prefs.budget === "mid" && price > 15_000_000 && price <= 50_000_000) score += 30;
        else if (prefs.budget === "high" && price > 50_000_000 && price <= 150_000_000) score += 30;
        else if (prefs.budget === "premium" && price > 150_000_000) score += 30;

        // Size match
        const area = lot.area || 0;
        if (prefs.size === "small" && area <= 500) score += 25;
        else if (prefs.size === "medium" && area > 500 && area <= 2000) score += 25;
        else if (prefs.size === "large" && area > 2000 && area <= 10000) score += 25;
        else if (prefs.size === "xlarge" && area > 10000) score += 25;

        // Services match
        const features = (lot.features || {}) as Record<string, any>;
        if (prefs.services === "all" && features.hasWater && features.hasElectricity && features.hasRoad) score += 25;
        else if (prefs.services === "basic" && (features.hasWater || features.hasElectricity)) score += 20;
        else if (prefs.services === "none") score += 20;
        else score += 10;

        if (score >= 60) {
          await supabase.from("notifications").insert({
            user_id: profile.user_id,
            type: "match",
            title: "¡Nuevo terreno compatible! 🎯",
            message: `Un terreno de ${area} m² acaba de publicarse y tiene ${score}% de compatibilidad con tu perfil.`,
            link: `/proyecto/${lot.project_id}`,
            metadata: { lot_id: lot.id, score },
          });
          notificationCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ matched: notificationCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("smart-match error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
