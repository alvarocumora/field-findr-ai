/**
 * Shared CORS + auth boilerplate for Edge Functions.
 *
 * Before this module, each function redefined its own `corsHeaders` object
 * and its own Bearer-token/`getClaims` check inline (27+ copies across
 * `supabase/functions/*`, one of them importing a `/cors` subpath that
 * `@supabase/supabase-js` doesn't actually export). Centralizing it means a
 * fix or a stricter check only has to happen once.
 *
 * Kept dependency-free (no `Deno.*`, no `createClient`) so it stays
 * testable under Vitest like `rateLimit.ts` — callers pass in whatever
 * Supabase client they already built from their own env vars.
 */

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

/** Handles an OPTIONS preflight; returns null for every other method. */
export function handlePreflight(req: Request): Response | null {
  return req.method === "OPTIONS" ? new Response(null, { headers: corsHeaders }) : null;
}

export interface AuthContext {
  userId: string;
  token: string;
}

interface ClaimsClient {
  auth: {
    getClaims(token: string): Promise<{ data: { claims?: { sub?: string } } | null; error: unknown }>;
  };
}

/**
 * Validates `Authorization: Bearer <jwt>` and resolves the caller's user id
 * via `callerClient.auth.getClaims`. `callerClient` must already be scoped
 * to the caller's JWT (created with that Authorization header).
 *
 * Returns a ready-to-send 401 Response on failure, so call sites just do
 * `const auth = await requireAuth(req, callerClient); if (auth instanceof Response) return auth;`.
 */
export async function requireAuth(
  req: Request,
  callerClient: ClaimsClient,
): Promise<AuthContext | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice("Bearer ".length);
  const { data, error } = await callerClient.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || !userId) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  return { userId, token };
}

interface RoleClient extends ClaimsClient {
  // PromiseLike, not Promise: Supabase's `rpc()` returns a thenable
  // PostgrestFilterBuilder (awaitable, but structurally not a full Promise).
  rpc(fn: "has_role", args: { _user_id: string; _role: string }): PromiseLike<{ data: unknown }>;
}

/** `requireAuth` plus a role check via the `has_role` RPC (admin-only endpoints). */
export async function requireRole(
  req: Request,
  callerClient: RoleClient,
  role: string,
): Promise<AuthContext | Response> {
  const auth = await requireAuth(req, callerClient);
  if (auth instanceof Response) return auth;

  const { data: hasRole } = await callerClient.rpc("has_role", { _user_id: auth.userId, _role: role });
  if (!hasRole) return jsonResponse({ error: "Forbidden" }, 403);

  return auth;
}
