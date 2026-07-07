// Benchmark competitivo de portales inmobiliarios (Chile / LATAM · jul-2026)
// Precios recolectados de páginas públicas de cada portal. Referencia comercial,
// no obliga al competidor. Actualizar cada 6 meses.

export interface CompetitorPlan {
  competitor: string;
  logo?: string;
  entryPriceCLP: number | null;      // null = sales-led / no público
  entryPriceLabel: string;
  publications: string;
  featured: string;
  crm: string;
  map3D: boolean;
  aiValuation: boolean;
  internalFinancing: boolean;
  support: string;
  model: string;
  notes?: string;
}

export const COMPETITOR_BENCHMARK: CompetitorPlan[] = [
  {
    competitor: 'OfertaTerrenos',
    entryPriceCLP: 38000,
    entryPriceLabel: '1 UF (~$38k CLP)',
    publications: '15 → ∞',
    featured: '1 → ∞ incluidas',
    crm: 'Sí, con IA + WhatsApp',
    map3D: true,
    aiValuation: true,
    internalFinancing: true,
    support: 'Email → Dedicado',
    model: 'SaaS mensual · Anual −17%',
    notes: 'Único con mapa 3D, tasación IA y financiamiento directo',
  },
  {
    competitor: 'ChilePropiedades',
    entryPriceCLP: 3990,
    entryPriceLabel: '$3.990 CLP',
    publications: '30 → 10.000',
    featured: '5 → 20 incluidas',
    crm: 'Básico',
    map3D: false,
    aiValuation: false,
    internalFinancing: false,
    support: 'Email',
    model: 'SaaS mensual · Anual 2 meses gratis',
  },
  {
    competitor: 'Portalinmobiliario',
    entryPriceCLP: null,
    entryPriceLabel: 'Sales-led (Plata/Oro/Platino)',
    publications: 'Por paquete',
    featured: 'Add-on',
    crm: 'Limitado',
    map3D: false,
    aiValuation: false,
    internalFinancing: false,
    support: 'Ejecutivo comercial',
    model: 'Enterprise sales · Tienda Oficial',
    notes: 'Sin precios públicos, contratación por ejecutivo',
  },
  {
    competitor: 'TocToc',
    entryPriceCLP: null,
    entryPriceLabel: 'Contactar ejecutiva',
    publications: 'Personalizado',
    featured: 'Incluidas por plan',
    crm: 'Perfil auto-administrado',
    map3D: false,
    aiValuation: false,
    internalFinancing: false,
    support: 'Ejecutivo comercial',
    model: 'Sales-led personalizado',
  },
  {
    competitor: 'Yapo (Pack Inmo)',
    entryPriceCLP: null,
    entryPriceLabel: 'Créditos por cupo',
    publications: 'Pay-per-slot',
    featured: 'Add-on',
    crm: 'No',
    map3D: false,
    aiValuation: false,
    internalFinancing: false,
    support: 'Email',
    model: 'Pay-per-slot (clasificados)',
  },
  {
    competitor: 'Zonaprop (AR)',
    entryPriceCLP: null,
    entryPriceLabel: 'Por aviso (Simple/Destacado/Super)',
    publications: 'Individual',
    featured: 'Tiered por aviso',
    crm: 'Herramientas de listado',
    map3D: false,
    aiValuation: false,
    internalFinancing: false,
    support: 'Ejecutivo',
    model: 'Pay-per-listing',
  },
  {
    competitor: 'EasyBroker (MX)',
    entryPriceCLP: 24000, // ~$490 MXN
    entryPriceLabel: '~$24k CLP (10 anuncios)',
    publications: '10 → 50+',
    featured: 'No incluidas',
    crm: 'Sí, foco CRM',
    map3D: false,
    aiValuation: false,
    internalFinancing: false,
    support: 'Email → dedicado',
    model: 'SaaS CRM + vinculación con portales',
  },
];

// Filas de la tabla comparativa (renderizadas en /pricing)
export interface BenchmarkRow {
  label: string;
  key: keyof CompetitorPlan | 'checkmark';
  format?: (v: unknown) => string;
}

export const BENCHMARK_ROWS: BenchmarkRow[] = [
  { label: 'Precio de entrada', key: 'entryPriceLabel' },
  { label: 'Publicaciones', key: 'publications' },
  { label: 'Destacadas incluidas', key: 'featured' },
  { label: 'CRM', key: 'crm' },
  { label: 'Mapa 3D + planos', key: 'map3D' },
  { label: 'Tasación con IA', key: 'aiValuation' },
  { label: 'Financiamiento directo', key: 'internalFinancing' },
  { label: 'Soporte', key: 'support' },
  { label: 'Modelo comercial', key: 'model' },
];
