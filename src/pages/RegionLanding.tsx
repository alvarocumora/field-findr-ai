import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PublicLayout from '@/components/layouts/PublicLayout';
import ListingCard from '@/components/listings/ListingCard';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, ArrowRight, TrendingUp, Ruler, DollarSign, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Listing, formatPrice, formatArea } from '@/hooks/useListings';
import { LATAM_COUNTRIES } from '@/lib/latam';
import { resolveRegionTerritory } from '@/lib/territories';

// Build region map from all countries
const REGION_MAP: Record<string, string> = {};
LATAM_COUNTRIES.forEach(country => {
  country.regions.forEach(region => {
    const slug = region
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    REGION_MAP[slug] = region;
  });
});

const slugToRegion = (slug: string): string => {
  return REGION_MAP[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const regionToSlug = (region: string): string => resolveRegionTerritory(region, 'Chile').slug;

const REGION_IMAGES: Record<string, string> = {
  'Valparaíso': 'https://images.unsplash.com/photo-1583225173760-36e0e1dd2f12?w=1200&h=400&fit=crop',
  'Biobío': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
  'Los Lagos': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=400&fit=crop',
  'Araucanía': 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&h=400&fit=crop',
  'Maule': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=400&fit=crop',
  "O'Higgins": 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1200&h=400&fit=crop',
  'Coquimbo': 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&h=400&fit=crop',
  'Metropolitana': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&h=400&fit=crop',
};
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&h=400&fit=crop';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } } as const;
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } } as const;

const RegionLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const rawRegionName = slugToRegion(slug || '');
  const territory = resolveRegionTerritory(rawRegionName, 'Chile');
  const regionName = territory.name;
  const regionDisplayName = territory.displayName;

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['region-listings', territory.key],
    queryFn: async () => {
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .in('region', territory.variants)
        .order('created_at', { ascending: false })
        .limit(24);
      return (data || []) as Listing[];
    },
    enabled: !!regionName,
  });

  const { data: allRegions = [] } = useQuery({
    queryKey: ['all-regions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('listings')
        .select('region')
        .eq('status', 'active');
      const regionMap = new Map<string, string>();
      (data || []).forEach((listing) => {
        if (!listing.region) return;
        const candidate = resolveRegionTerritory(listing.region, 'Chile');
        regionMap.set(candidate.key, candidate.displayName);
      });
      return Array.from(regionMap.values()).sort();
    },
    staleTime: 10 * 60 * 1000,
  });

  // Stats
  const totalListings = listings.length;
  const avgPrice = totalListings > 0 ? Math.round(listings.reduce((a, l) => a + l.price, 0) / totalListings) : 0;
  const minPrice = totalListings > 0 ? Math.min(...listings.map(l => l.price)) : 0;
  const totalArea = listings.reduce((a, l) => a + (l.area_ha || 0), 0);

  const heroImg = REGION_IMAGES[regionName] || DEFAULT_IMG;

  // JSON-LD for this regional page
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Terrenos en ${regionDisplayName} - Ofertaterrenos.com`,
    description: `${totalListings} terrenos disponibles en ${regionDisplayName}, Chile. Precios desde ${formatPrice(minPrice)}.`,
    url: `https://ofertaterrenos.com/region/${slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: totalListings,
      itemListElement: listings.slice(0, 10).map((l, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://ofertaterrenos.com/propiedad/${l.id}`,
        name: l.title,
      })),
    },
  };

  useSEO({
    title: `Terrenos en ${regionDisplayName}`,
    description: `Encuentra ${totalListings} terrenos en venta en ${regionDisplayName}, Chile. Parcelas, sitios industriales y campos agrícolas desde ${formatPrice(minPrice)}.`,
    url: `https://ofertaterrenos.com/region/${slug}`,
    canonicalUrl: `https://ofertaterrenos.com/region/${slug}`,
    jsonLd,
  });

  return (
    <PublicLayout>
      {/* Hero Banner */}
      <section className="relative h-[280px] md:h-[360px] overflow-hidden">
        <img src={heroImg} alt={`Terrenos en ${regionDisplayName}`} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative z-10 container px-4 h-full flex flex-col justify-end pb-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:text-foreground transition-colors">Inicio</Link>
            <span>/</span>
            <Link to="/explorar" className="hover:text-foreground transition-colors">Explorar</Link>
            <span>/</span>
            <span className="text-foreground">{regionDisplayName}</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2">
            Terrenos en <span className="gradient-text">{regionName}</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
            {totalListings} propiedades disponibles en la {regionDisplayName}, Chile
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border/50 bg-card/50">
        <div className="container px-4 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: MapPin, label: 'Propiedades', value: totalListings.toString() },
              { icon: DollarSign, label: 'Precio mín.', value: formatPrice(minPrice) },
              { icon: TrendingUp, label: 'Precio promedio', value: formatPrice(avgPrice) },
              { icon: Ruler, label: 'Hectáreas total', value: `${Math.round(totalArea)} ha` },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="font-semibold text-foreground">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      <section className="py-10 md:py-14">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              Terrenos disponibles
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigate(`/explorar?region=${encodeURIComponent(regionName)}`)}>
              <Search className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/3] rounded-xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Sin terrenos en esta región</h3>
              <p className="text-muted-foreground mb-6">Aún no hay propiedades publicadas en {regionDisplayName}.</p>
              <Button asChild>
                <Link to="/explorar">Explorar todas las regiones</Link>
              </Button>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              {listings.map((listing) => (
                <motion.div key={listing.id} variants={fadeUp}>
                  <ListingCard listing={listing} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {listings.length >= 24 && (
            <div className="text-center mt-8">
              <Button onClick={() => navigate(`/explorar?region=${encodeURIComponent(regionName)}`)}>
                Ver más terrenos en {regionDisplayName}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Other Regions */}
      {allRegions.length > 1 && (
        <section className="py-10 md:py-14 border-t border-border/50">
          <div className="container px-4">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
              Otras regiones
            </h2>
            <div className="flex flex-wrap gap-2">
              {allRegions
                .filter((r) => resolveRegionTerritory(r, 'Chile').key !== territory.key)
                .map(r => (
                  <Badge
                    key={r}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors px-4 py-2"
                    onClick={() => navigate(`/region/${regionToSlug(r)}`)}
                  >
                    <MapPin className="h-3 w-3 mr-1.5" />
                    {r}
                  </Badge>
                ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
};

export default RegionLanding;
