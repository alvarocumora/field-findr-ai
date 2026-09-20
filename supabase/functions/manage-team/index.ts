// Gestión segura del equipo del workspace activo.
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LEGACY_PLAN_MAP: Record<string, string> = {
  starter: "corredora",
  growth: "inmobiliaria",
  scale: "grupo",
};
const TEAM_SEATS: Record<string, number | null> = {
  free: 1, corredor: 1, corredora: 3, inmobiliaria: 8, grupo: 25, enterprise: null,
};
const seatsForPlan = (planType?: string | null): number | null => {
  const normalized = LEGACY_PLAN_MAP[planType ?? ""] ?? planType ?? "free";
  return normalized in TEAM_SEATS ? TEAM_SEATS[normalized] : 1;
};

const AssignableRole = z.enum([
  "org_admin", "commercial_manager", "sales_agent", "operations",
  "finance", "external_broker", "viewer",
]);
const Base = z.object({ organization_id: z.string().uuid() });
const ActionSchema = z.discriminatedUnion("action", [
  Base.extend({
    action: z.literal("invite"),
    email: z.string().email().max(255),
    first_name: z.string().max(100).optional(),
    last_name: z.string().max(100).optional(),
    org_role: AssignableRole.default("sales_agent"),
  }),
  Base.extend({ action: z.literal("remove"), member_user_id: z.string().uuid() }),
  Base.extend({
    action: z.literal("set_role"),
    member_user_id: z.string().uuid(),
    org_role: AssignableRole,
  }),
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const caller = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsError } = await caller.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsError || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const callerId = claims.claims.sub as string;

    const parsed = ActionSchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const body = parsed.data;

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .select("id, owner_id, name")
      .eq("id", body.organization_id)
      .maybeSingle();
    if (orgError) return json({ error: orgError.message }, 500);
    if (!org) return json({ error: "Inmobiliaria no encontrada" }, 404);

    const callerIsOwner = org.owner_id === callerId;
    let callerRole: string | null = callerIsOwner ? "owner" : null;
    if (!callerIsOwner) {
      const { data: membership, error: membershipError } = await admin
        .from("organization_members")
        .select("role")
        .eq("organization_id", org.id)
        .eq("user_id", callerId)
        .maybeSingle();
      if (membershipError) return json({ error: membershipError.message }, 500);
      callerRole = membership?.role ?? null;
    }
    if (!["owner", "admin", "org_admin"].includes(callerRole ?? "")) {
      return json({ error: "No tienes permisos para administrar este equipo" }, 403);
    }

    const audit = async (action: string, details: unknown) => {
      await admin.from("audit_logs").insert({
        user_id: callerId,
        action,
        entity_type: "organization",
        entity_id: org.id,
        details: details as Record<string, unknown>,
      });
    };

    const { data: members, error: membersError } = await admin
      .from("organization_members")
      .select("user_id, role")
      .eq("organization_id", org.id);
    if (membersError) return json({ error: membersError.message }, 500);
    const memberList = members ?? [];

    if (body.action === "invite") {
      if (body.org_role === "org_admin" && !callerIsOwner) {
        return json({ error: "Solo el propietario puede nombrar administradores" }, 403);
      }

      let { data: subscription } = await admin
        .from("subscriptions")
        .select("plan_type")
        .eq("organization_id", org.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!subscription) {
        const legacy = await admin
          .from("subscriptions")
          .select("plan_type")
          .eq("user_id", org.owner_id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        subscription = legacy.data;
      }

      const seats = seatsForPlan(subscription?.plan_type);
      const seatUsers = new Set(memberList.map((member) => member.user_id));
      seatUsers.add(org.owner_id);
      if (seats !== null && seatUsers.size >= seats) {
        return json({
          error: `Alcanzaste el límite de ${seats} asientos de tu plan. Mejora tu plan para invitar más miembros.`,
        }, 400);
      }

      const { data: existingProfile } = await admin
        .from("profiles")
        .select("user_id")
        .eq("email", body.email)
        .maybeSingle();
      let invitedUserId = existingProfile?.user_id as string | undefined;
      if (invitedUserId && seatUsers.has(invitedUserId)) {
        return json({ error: "Esa persona ya es parte de tu equipo" }, 400);
      }

      if (!invitedUserId) {
        const origin = req.headers.get("origin") ?? undefined;
        const { data, error } = await admin.auth.admin.inviteUserByEmail(body.email, {
          data: {
            first_name: body.first_name,
            last_name: body.last_name,
            account_type: "agent",
            invited_to_org: org.id,
          },
          redirectTo: origin ? `${origin}/auth` : undefined,
        });
        if (error) return json({ error: error.message }, 400);
        invitedUserId = data.user?.id;
        if (!invitedUserId) return json({ error: "No se pudo crear la invitación" }, 500);
        await admin.from("user_roles").upsert(
          { user_id: invitedUserId, role: "agent" },
          { onConflict: "user_id,role" },
        );
      }

      const { error } = await admin.from("organization_members").upsert(
        { organization_id: org.id, user_id: invitedUserId, role: body.org_role },
        { onConflict: "organization_id,user_id" },
      );
      if (error) return json({ error: error.message }, 400);
      await audit("team.member_invited", {
        email: body.email, org_role: body.org_role, user_id: invitedUserId,
      });
      return json({ ok: true, user_id: invitedUserId });
    }

    if (body.member_user_id === org.owner_id) {
      return json({ error: "El propietario de la organización no se puede modificar" }, 400);
    }
    const target = memberList.find((member) => member.user_id === body.member_user_id);
    if (!target) return json({ error: "Esa persona no es miembro de tu equipo" }, 404);

    if (body.action === "remove") {
      if (["admin", "org_admin"].includes(target.role) && !callerIsOwner) {
        return json({ error: "Solo el propietario puede remover administradores" }, 403);
      }
      const { error } = await admin
        .from("organization_members")
        .delete()
        .eq("organization_id", org.id)
        .eq("user_id", body.member_user_id);
      if (error) return json({ error: error.message }, 400);
      await audit("team.member_removed", { user_id: body.member_user_id });
      return json({ ok: true });
    }

    if (!callerIsOwner) return json({ error: "Solo el propietario puede cambiar roles" }, 403);
    const { error } = await admin
      .from("organization_members")
      .update({ role: body.org_role })
      .eq("organization_id", org.id)
      .eq("user_id", body.member_user_id);
    if (error) return json({ error: error.message }, 400);
    await audit("team.role_changed", {
      user_id: body.member_user_id, org_role: body.org_role,
    });
    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
