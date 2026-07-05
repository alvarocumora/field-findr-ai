import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_projects",
  title: "List active projects",
  description: "List active land development projects (loteos) with lot availability summary.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data, error } = await supabase
      .from("projects")
      .select("id, name, description, total_lots, available_lots, sold_lots, city, region, status")
      .eq("status", "active")
      .limit(limit ?? 10);

    if (error) {
      return { content: [{ type: "text", text: `Fetch failed: ${error.message}` }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { items: data ?? [], count: data?.length ?? 0 },
    };
  },
});
