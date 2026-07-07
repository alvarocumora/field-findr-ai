// Server-side enforced listing publishing.
// - Validates JWT of caller.
// - Reads active subscription plan and enforces maxPublications quota.
// - Rejects insert with 403 if quota exceeded (cannot be bypassed from client).
// - Forces user_id to the JWT user id.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Keep in sync with src/hooks/useSubscription.ts PLAN_DETAILS.maxPublications
const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  corredor: 15,
  corredora: 15,
  starter: 15,
  inmobiliaria: 60,
  growth: 60,
  grupo: 200,
  scale: 200,
  enterprise: 9999,
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "authorized"]);
const COUNTED_LISTING_STATUSES = ["active", "pending_review", "reserved"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE || !ANON_KEY) {
    return json({ error: "Server misconfigured" }, 500);
  }

  // Auth: resolve user from bearer token.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing Authorization header" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return json({ error: "Invalid or expired token" }, 401);
  }
  const userId = userData.user.id;

  // Parse body.
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const listing = payload.listing as Record<string, unknown> | undefined;
  if (!listing || typeof listing !== "object") {
    return json({ error: "Missing 'listing' payload" }, 400);
  }

  // Minimal validation of the required fields we rely on downstream.
  const title = String(listing.title ?? "").trim();
  const type = String(listing.type ?? "").trim();
  const location = String(listing.location ?? "").trim();
  const price = Number(listing.price);
  if (!title || !type || !location || !Number.isFinite(price) || price <= 0) {
    return json(
      { error: "Missing required fields: title, type, location, price(>0)" },
      400,
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // Resolve plan (most recent active subscription).
  const { data: subs } = await admin
    .from("subscriptions")
    .select("plan_type, status, current_period_end")
    .eq("user_id", userId)
    .order("current_period_end", { ascending: false, nullsFirst: false })
    .limit(5);

  const activeSub = (subs ?? []).find((s) =>
    ACTIVE_STATUSES.has(String(s.status))
  );
  const planKey = String(activeSub?.plan_type ?? "free").toLowerCase();
  const limit = PLAN_LIMITS[planKey] ?? PLAN_LIMITS.free;

  // Count listings against quota.
  const { count, error: countErr } = await admin
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", COUNTED_LISTING_STATUSES);

  if (countErr) {
    return json({ error: "Quota check failed", detail: countErr.message }, 500);
  }
  const used = count ?? 0;

  if (used >= limit) {
    return json(
      {
        error: "plan_quota_exceeded",
        message:
          `Tu plan permite ${limit} publicaciones y ya tienes ${used}. Mejora tu plan para publicar más.`,
        plan: planKey,
        limit,
        used,
      },
      403,
    );
  }

  // Sanitize + force ownership. Drop any client-provided id/status boost.
  const { id: _drop, user_id: _drop2, ...rest } = listing as Record<
    string,
    unknown
  >;
  const insertRow = {
    ...rest,
    user_id: userId,
    status: "pending_review",
    legal_status: (rest as { legal_status?: unknown }).legal_status ?? "pending",
  };

  const { data: inserted, error: insertErr } = await admin
    .from("listings")
    .insert(insertRow)
    .select()
    .single();

  if (insertErr) {
    return json({ error: "Insert failed", detail: insertErr.message }, 500);
  }

  return json({
    listing: inserted,
    plan: planKey,
    limit,
    used: used + 1,
  }, 201);
});
