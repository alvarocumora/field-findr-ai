/**
 * Lightweight in-memory sliding-window rate limiter for edge functions.
 *
 * State lives per isolate: it resets on cold starts and is not shared across
 * regions, so treat it as best-effort abuse damping (enough to stop naive
 * loops from burning LLM/scraper credits), not a hard quota. For a hard
 * guarantee move the counters to Postgres or KV.
 */
const buckets = new Map<string, number[]>();
const MAX_KEYS = 10_000;

export interface RateLimitOptions {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

/** Returns true when the request is allowed, false when over the limit. */
export function rateLimit(key: string, { limit, windowMs }: RateLimitOptions): boolean {
  const now = Date.now();

  // Cheap protection against unbounded growth from spoofed keys.
  if (buckets.size > MAX_KEYS) buckets.clear();

  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

/** Best-effort client IP (first hop of x-forwarded-for). */
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Standard 429 response with CORS headers. */
export function tooManyRequests(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please retry later." }),
    {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    },
  );
}
