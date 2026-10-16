// Admin user management: invite, suspend/unsuspend, delete, reset password
// Requires authenticated caller with 'admin' role. Uses service role for auth.admin operations.
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { jsonResponse, handlePreflight, requireRole } from "../_shared/http.ts";

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
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller & role using the caller's JWT
    const caller = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const auth = await requireRole(req, caller, "admin");
    if (auth instanceof Response) return auth;
    const callerId = auth.userId;

    const parsed = ActionSchema.safeParse(await req.json());
    if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, 400);
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
        if (error) return jsonResponse({ error: error.message }, 400);
        // Ensure role is applied (handle_new_user reads account_type, but be defensive)
        if (body.role && data.user) {
          await admin
            .from("user_roles")
            .upsert({ user_id: data.user.id, role: body.role }, { onConflict: "user_id,role" });
        }
        await audit("user.invited", data.user?.id ?? null, { email: body.email, role: body.role });
        return jsonResponse({ ok: true, user_id: data.user?.id });
      }

      case "suspend": {
        const banUntil = `${body.hours}h`;
        const { error } = await admin.auth.admin.updateUserById(body.user_id, { ban_duration: banUntil });
        if (error) return jsonResponse({ error: error.message }, 400);
        await audit("user.suspended", body.user_id, { hours: body.hours, reason: body.reason });
        return jsonResponse({ ok: true });
      }

      case "unsuspend": {
        const { error } = await admin.auth.admin.updateUserById(body.user_id, { ban_duration: "none" });
        if (error) return jsonResponse({ error: error.message }, 400);
        await audit("user.unsuspended", body.user_id, {});
        return jsonResponse({ ok: true });
      }

      case "delete": {
        if (body.user_id === callerId) return jsonResponse({ error: "No puedes eliminarte a ti mismo" }, 400);

        // Keep reviewed documents while removing the restrictive reviewer reference.
        // All user-owned records already use ON DELETE CASCADE or SET NULL.
        const { error: reviewerError } = await admin
          .from("documents")
          .update({ reviewed_by: null })
          .eq("reviewed_by", body.user_id);
        if (reviewerError) return jsonResponse({ error: reviewerError.message }, 400);

        const { error } = await admin.auth.admin.deleteUser(body.user_id);
        if (error) return jsonResponse({ error: error.message }, 400);
        await audit("user.deleted", body.user_id, { reason: body.reason });
        return jsonResponse({ ok: true });
      }

      case "reset_password": {
        const origin = req.headers.get("origin") ?? undefined;
        const { error } = await admin.auth.resetPasswordForEmail(body.email, {
          redirectTo: origin ? `${origin}/reset-password` : undefined,
        });
        if (error) return jsonResponse({ error: error.message }, 400);
        await audit("user.password_reset_sent", body.user_id, { email: body.email });
        return jsonResponse({ ok: true });
      }
    }
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
