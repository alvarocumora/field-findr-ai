// Admin user management: invite, suspend/unsuspend, delete, reset password
// Requires authenticated caller with 'admin' role. Uses service role for auth.admin operations.
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("invite"),
    email: z.string().email().max(255),
    first_name: z.string().max(100).optional(),
    last_name: z.string().max(100).optional(),
    role: z.enum(["admin", "agent", "buyer"]).optional(),
  }),
  z.object({
    action: z.literal("suspend"),
    user_id: z.string().uuid(),
    hours: z.number().int().min(1).max(24 * 365).default(24 * 30),
    reason: z.string().max(500).optional(),
  }),
  z.object({ action: z.literal("unsuspend"), user_id: z.string().uuid() }),
  z.object({
    action: z.literal("delete"),
    user_id: z.string().uuid(),
    reason: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("reset_password"),
    user_id: z.string().uuid(),
    email: z.string().email(),
  }),
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller & role using the caller's JWT
    const caller = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await caller.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const callerId = claims.claims.sub as string;

    const { data: isAdmin } = await caller.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const parsed = ActionSchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const body = parsed.data;

    // Service-role client for privileged ops
    const admin = createClient(SUPABASE_URL, SERVICE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const audit = async (action: string, target: string | null, details: unknown) => {
      await admin.from("audit_logs").insert({
        user_id: callerId,
        action,
        entity_type: "user",
        entity_id: target,
        details: details as Record<string, unknown>,
      });
    };

    switch (body.action) {
      case "invite": {
        const origin = req.headers.get("origin") ?? undefined;
        const { data, error } = await admin.auth.admin.inviteUserByEmail(body.email, {
          data: { first_name: body.first_name, last_name: body.last_name, account_type: body.role ?? "buyer" },
          redirectTo: origin ? `${origin}/auth` : undefined,
        });
        if (error) return json({ error: error.message }, 400);
        // Ensure role is applied (handle_new_user reads account_type, but be defensive)
        if (body.role && data.user) {
          await admin
            .from("user_roles")
            .upsert({ user_id: data.user.id, role: body.role }, { onConflict: "user_id,role" });
        }
        await audit("user.invited", data.user?.id ?? null, { email: body.email, role: body.role });
        return json({ ok: true, user_id: data.user?.id });
      }

      case "suspend": {
        const banUntil = `${body.hours}h`;
        // @ts-expect-error ban_duration is supported by GoTrue admin API
        const { error } = await admin.auth.admin.updateUserById(body.user_id, { ban_duration: banUntil });
        if (error) return json({ error: error.message }, 400);
        await audit("user.suspended", body.user_id, { hours: body.hours, reason: body.reason });
        return json({ ok: true });
      }

      case "unsuspend": {
        // @ts-expect-error ban_duration:"none" lifts the ban
        const { error } = await admin.auth.admin.updateUserById(body.user_id, { ban_duration: "none" });
        if (error) return json({ error: error.message }, 400);
        await audit("user.unsuspended", body.user_id, {});
        return json({ ok: true });
      }

      case "delete": {
        if (body.user_id === callerId) return json({ error: "No puedes eliminarte a ti mismo" }, 400);
        const { error } = await admin.auth.admin.deleteUser(body.user_id);
        if (error) return json({ error: error.message }, 400);
        await audit("user.deleted", body.user_id, { reason: body.reason });
        return json({ ok: true });
      }

      case "reset_password": {
        const origin = req.headers.get("origin") ?? undefined;
        const { error } = await admin.auth.resetPasswordForEmail(body.email, {
          redirectTo: origin ? `${origin}/reset-password` : undefined,
        });
        if (error) return json({ error: error.message }, 400);
        await audit("user.password_reset_sent", body.user_id, { email: body.email });
        return json({ ok: true });
      }
    }
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
