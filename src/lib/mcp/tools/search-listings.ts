import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "search_listings",
  title: "Search land listings",
  description:
    "Search approved (public) land listings on OFERTA TERRENOS. Filter by free-text query, city/region, price range (CLP), and area range (m²).",
  inputSchema: {
    query: z.string().optional().describe("Free text matched against title/description."),
    city: z.string().optional().describe("City name filter (partial match)."),
    region: z.string().optional().describe("Region filter (partial match)."),
    minPrice: z.number().optional().describe("Minimum price in CLP."),
    maxPrice: z.number().optional().describe("Maximum price in CLP."),
    minAreaM2: z.number().optional().describe("Minimum surface area in m²."),
    maxAreaM2: z.number().optional().describe("Maximum surface area in m²."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 10, max 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, city, region, minPrice, maxPrice, minAreaM2, maxAreaM2, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    let q = supabase
      .from("listings")
      .select("id, title, description, price, currency, area_m2, city, region, status, created_at")
      .eq("status", "active")
      .limit(limit ?? 10);

    if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    if (city) q = q.ilike("city", `%${city}%`);
    if (region) q = q.ilike("region", `%${region}%`);
    if (minPrice != null) q = q.gte("price", minPrice);
    if (maxPrice != null) q = q.lte("price", maxPrice);
    if (minAreaM2 != null) q = q.gte("area_m2", minAreaM2);
    if (maxAreaM2 != null) q = q.lte("area_m2", maxAreaM2);

    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: `Search failed: ${error.message}` }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { items: data ?? [], count: data?.length ?? 0 },
    };
  },
});
