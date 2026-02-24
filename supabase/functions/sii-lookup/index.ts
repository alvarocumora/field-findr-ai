const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SIIData {
  rol: string;
  comuna: string | null;
  direccion: string | null;
  avaluoFiscal: number | null;
  superficieTerreno: number | null;
  superficieConstruida: number | null;
  destinacion: string | null;
  materialPredominante: string | null;
  anoConstruccion: number | null;
  tipoPropiedad: string | null;
  source: 'sii_scraping' | 'demo';
  timestamp: string;
}

function generateDemoData(rol: string): SIIData {
  const comunas = ['Santiago', 'Providencia', 'Las Condes', 'Vitacura', 'Ñuñoa', 'La Florida', 'Maipú', 'Puente Alto'];
  const destinos = ['Habitacional', 'Agrícola', 'Comercial', 'Industrial', 'Sitio eriazo'];
  const materiales = ['Hormigón armado', 'Albañilería', 'Madera', 'Adobe', 'Estructura metálica'];
  const tipos = ['Casa', 'Departamento', 'Sitio', 'Parcela', 'Local comercial', 'Bodega'];

  const hash = rol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  return {
    rol,
    comuna: comunas[hash % comunas.length],
    direccion: `Calle Demo ${100 + (hash % 900)}, ${comunas[hash % comunas.length]}`,
    avaluoFiscal: Math.round((10_000_000 + (hash * 137 % 500_000_000)) / 1000) * 1000,
    superficieTerreno: 200 + (hash % 10_000),
    superficieConstruida: hash % 3 === 0 ? null : 50 + (hash % 500),
    destinacion: destinos[hash % destinos.length],
    materialPredominante: hash % 3 === 0 ? null : materiales[hash % materiales.length],
    anoConstruccion: hash % 3 === 0 ? null : 1960 + (hash % 65),
    tipoPropiedad: tipos[hash % tipos.length],
    source: 'demo',
    timestamp: new Date().toISOString(),
  };
}

async function scrapeSII(rol: string): Promise<SIIData> {
  // Attempt to fetch data from SII's public consultation
  // The SII provides a public endpoint for property tax info
  const parts = rol.split('-');
  if (parts.length !== 2) {
    throw new Error('Formato de rol inválido. Use formato: XXXX-YYY');
  }

  try {
    // Try to fetch from SII avaluos page
    const url = `https://zeus.sii.cl/cvc_cgi/brs/brq_web.sh?numero=${parts[0]}&subnumero=${parts[1]}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PropertyPlatform/1.0)',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      console.log(`SII responded with status ${response.status}, using demo data`);
      return generateDemoData(rol);
    }

    const html = await response.text();

    // Parse basic info from HTML response
    const extractField = (pattern: RegExp): string | null => {
      const match = html.match(pattern);
      return match ? match[1].trim() : null;
    };

    const comuna = extractField(/Comuna\s*[:\-]?\s*<[^>]*>([^<]+)/i);
    const direccion = extractField(/Direcci[oó]n\s*[:\-]?\s*<[^>]*>([^<]+)/i);
    const avaluoStr = extractField(/Aval[uú]o\s*(?:Fiscal|Total)\s*[:\-]?\s*[\$]?\s*([\d.,]+)/i);
    const superfTerr = extractField(/Superficie\s*Terreno\s*[:\-]?\s*([\d.,]+)/i);
    const superfConst = extractField(/Superficie\s*Construida?\s*[:\-]?\s*([\d.,]+)/i);
    const destino = extractField(/Destina?ci[oó]n\s*[:\-]?\s*<[^>]*>([^<]+)/i);

    // If we got meaningful data, return it
    if (comuna || direccion || avaluoStr) {
      return {
        rol,
        comuna,
        direccion,
        avaluoFiscal: avaluoStr ? parseInt(avaluoStr.replace(/[.,]/g, '')) : null,
        superficieTerreno: superfTerr ? parseFloat(superfTerr.replace(/,/g, '.')) : null,
        superficieConstruida: superfConst ? parseFloat(superfConst.replace(/,/g, '.')) : null,
        destinacion: destino,
        materialPredominante: null,
        anoConstruccion: null,
        tipoPropiedad: null,
        source: 'sii_scraping',
        timestamp: new Date().toISOString(),
      };
    }

    // Fallback to demo if parsing yielded nothing useful
    console.log('SII response parsed but no useful data found, using demo');
    return generateDemoData(rol);

  } catch (error) {
    console.error('Error scraping SII:', error);
    return generateDemoData(rol);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rol, useDemoData } = await req.json();

    if (!rol || typeof rol !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Se requiere un número de rol válido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate rol format (XXXX-YYY)
    const rolClean = rol.trim().replace(/\s/g, '');
    if (!/^\d+-\d+$/.test(rolClean)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Formato de rol inválido. Use formato: XXXX-YYY (ej: 1234-56)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let data: SIIData;
    if (useDemoData) {
      data = generateDemoData(rolClean);
    } else {
      data = await scrapeSII(rolClean);
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sii-lookup:', error);
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
