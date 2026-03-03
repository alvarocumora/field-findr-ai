import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query, limit = 10 } = await req.json()

    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Full-text search using the generated tsvector column
    const tsQuery = query
      .trim()
      .split(/\s+/)
      .map((w: string) => `${w}:*`)
      .join(' & ')

    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, title, location, region, city, country, price, currency, type, area_m2, images')
      .eq('status', 'active')
      .textSearch('search_vector', tsQuery)
      .limit(limit)

    if (error) throw error

    // Group results by type
    const locations = new Set<string>()
    const properties: typeof listings = []

    for (const l of listings || []) {
      if (l.region) locations.add(l.region)
      if (l.city) locations.add(l.city)
      properties.push(l)
    }

    return new Response(
      JSON.stringify({
        properties,
        locations: Array.from(locations).slice(0, 5),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
