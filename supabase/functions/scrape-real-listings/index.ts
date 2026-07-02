// Edge function: scrape real terrenos from LATAM portals via Firecrawl.
// Returns up to ~100 normalized listings, cached 6h in `cached_listings`.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const FIRECRAWL_API = 'https://api.firecrawl.dev/v2';
const TTL_HOURS = 6;

type RealListing = {
  id: string;
  title: string;
  price: number;
  currency: string;
  area_m2: number | null;
  location: string;
  region: string | null;
  country: string;
  type: string;
  image_url: string | null;
  source_url: string;
  source_portal: string;
  lat: number | null;
  lng: number | null;
};

const SEARCH_QUERIES: { portal: string; country: string; query: string; currency: string }[] = [
  { portal: 'Portalinmobiliario', country: 'Chile', currency: 'UF', query: 'site:portalinmobiliario.com terrenos venta Los Lagos OR "Los Ríos" OR Araucanía' },
  { portal: 'Portalinmobiliario', country: 'Chile', currency: 'UF', query: 'site:portalinmobiliario.com parcelas venta Chile' },
  { portal: 'Yapo',               country: 'Chile', currency: 'CLP', query: 'site:yapo.cl terreno venta sur Chile' },
  { portal: 'Mercado Libre',      country: 'Argentina', currency: 'ARS', query: 'site:inmuebles.mercadolibre.com.ar terrenos en venta Patagonia OR Bariloche OR Mendoza' },
  { portal: 'Mercado Libre',      country: 'Colombia',  currency: 'COP', query: 'site:inmuebles.mercadolibre.com.co lotes en venta Antioquia OR Cundinamarca' },
  { portal: 'Mercado Libre',      country: 'México',    currency: 'MXN', query: 'site:inmuebles.mercadolibre.com.mx terrenos en venta Yucatán OR Querétaro' },
];

const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    price: { type: 'number', description: 'Numeric price, no currency symbols' },
    currency: { type: 'string', description: 'UF, CLP, USD, ARS, COP, MXN' },
    area_m2: { type: 'number', description: 'Surface in square meters' },
    location: { type: 'string' },
    region: { type: 'string' },
    image_url: { type: 'string', description: 'Main listing image URL' },
  },
  required: ['title', 'price'],
};

function cacheKey(params: Record<string, unknown>): string {
  return btoa(JSON.stringify(params)).slice(0, 64);
}

async function firecrawlSearch(query: string, apiKey: string): Promise<string[]> {
  try {
    const r = await fetch(`${FIRECRAWL_API}/search`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 8 }),
    });
    const text = await r.text();
    if (!r.ok) {
      console.error('search http error', r.status, query, text.slice(0, 200));
      return [];
    }
    let j: any;
    try { j = JSON.parse(text); } catch { return []; }
    const raw = j?.data ?? j?.web ?? j?.results ?? [];
    const results = Array.isArray(raw) ? raw : (Array.isArray(raw?.results) ? raw.results : []);
    return results
      .map((it: any) => (typeof it === 'string' ? it : it?.url))
      .filter((u: unknown): u is string => typeof u === 'string' && u.length > 0)
      .slice(0, 8);
  } catch (e) {
    console.error('search failed', query, e);
    return [];
  }
}

async function firecrawlExtract(url: string, apiKey: string) {
  try {
    const r = await fetch(`${FIRECRAWL_API}/scrape`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        formats: [{ type: 'json', schema: EXTRACT_SCHEMA }, 'markdown'],
        onlyMainContent: true,
      }),
    });
    const j = await r.json();
    const data = j?.data ?? j;
    return { json: data?.json, metadata: data?.metadata, markdown: data?.markdown };
  } catch (e) {
    console.error('extract failed', url, e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const country = url.searchParams.get('country') ?? 'all';
  const region = url.searchParams.get('region');
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '60', 10), 100);
  const key = cacheKey({ country, region, limit, v: 1 });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // 1. Try cache
  const { data: cached } = await supabase
    .from('cached_listings')
    .select('payload, expires_at')
    .eq('cache_key', key)
    .maybeSingle();

  if (cached && new Date(cached.expires_at) > new Date()) {
    return new Response(JSON.stringify({ listings: cached.payload, cached: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 2. Scrape
  const queries = country === 'all'
    ? SEARCH_QUERIES
    : SEARCH_QUERIES.filter((q) => q.country.toLowerCase().includes(country.toLowerCase()));

  const allListings: RealListing[] = [];
  const portalsUsed = new Set<string>();

  for (const q of queries) {
    if (allListings.length >= limit) break;
    const urls = await firecrawlSearch(q.query, apiKey);
    portalsUsed.add(q.portal);

    // Extract a handful per query (parallel, capped)
    const slice = urls.slice(0, 6);
    const extracted = await Promise.all(slice.map((u) => firecrawlExtract(u, apiKey)));

    for (let i = 0; i < extracted.length; i++) {
      const ext = extracted[i];
      if (!ext?.json?.title || !ext.json.price) continue;
      const j = ext.json;
      allListings.push({
        id: `${q.portal}-${btoa(slice[i]).slice(0, 16)}`,
        title: String(j.title).slice(0, 200),
        price: Number(j.price),
        currency: j.currency || q.currency,
        area_m2: j.area_m2 ? Number(j.area_m2) : null,
        location: j.location || q.country,
        region: j.region || region || null,
        country: q.country,
        type: 'terreno',
        image_url: j.image_url || ext.metadata?.ogImage || null,
        source_url: slice[i],
        source_portal: q.portal,
        lat: null,
        lng: null,
      });
      if (allListings.length >= limit) break;
    }
  }

  // 3. Cache
  if (allListings.length > 0) {
    const expires = new Date(Date.now() + TTL_HOURS * 3600 * 1000).toISOString();
    await supabase.from('cached_listings').upsert(
      {
        cache_key: key,
        payload: allListings,
        source_portals: Array.from(portalsUsed),
        fetched_at: new Date().toISOString(),
        expires_at: expires,
      },
      { onConflict: 'cache_key' },
    );
  }

  return new Response(
    JSON.stringify({ listings: allListings, cached: false, count: allListings.length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
