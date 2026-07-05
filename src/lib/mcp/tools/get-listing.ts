import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_listing",
  title: "Get listing details",
  description: "Fetch full details for a single approved land listing by its ID.",
  inputSchema: {
    id: z.string().uuid().describe("Listing UUID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      return { content: [{ type: "text", text: `Fetch failed: ${error.message}` }], isError: true };
    }
    if (!data) {
      return { content: [{ type: "text", text: "Listing not found or not public." }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { listing: data },
    };
  },
});
