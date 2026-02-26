import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PublicLayout from '@/components/layouts/PublicLayout';
import ListingCard from '@/components/listings/ListingCard';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, ArrowRight, TrendingUp, Ruler, DollarSign, Search, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { Listing, formatPrice } from '@/hooks/useListings';
import { LATAM_COUNTRIES, getCountryConfig, formatPriceLatam } from '@/lib/latam';

const CODE_TO_NAME: Record<string, string> = {
  cl: 'Chile', ar: 'Argentina', co: 'Colombia', mx: 'México', pe: 'Perú',
};

const COUNTRY_IMAGES: Record<string, string> = {
  cl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=400&fit=crop',
  ar: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1200&h=400&fit=crop',
  co: 'https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?w=1200&h=400&fit=crop',
  mx: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1200&h=400&fit=crop',
  pe: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1200&h=400&fit=crop',
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } } as const;
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } } as const;

const regionToSlug = (region: string): string => {
  return region
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const CountryLanding = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const countryName = CODE_TO_NAME[code || ''] || code || '';
  const config = getCountryConfig((code || '').toUpperCase());

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['country-listings', countryName],
    queryFn: async () => {
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .eq('country', countryName)
        .order('created_at', { ascending: false })
        .limit(24);
      return (data || []) as Listing[];
    },
    enabled: !!countryName,
  });

  // Group listings by region
  const regionStats = listings.reduce<Record<string, { count: number; minPrice: number }>>((acc, l) => {
    const r = l.region || 'Otra';
    if (!acc[r]) acc[r] = { count: 0, minPrice: Infinity };
    acc[r].count++;
    acc[r].minPrice = Math.min(acc[r].minPrice, l.price);
    return acc;
  }, {});

  const totalListings = listings.length;
  const avgPrice = totalListings > 0 ? Math.round(listings.reduce((a, l) => a + l.price, 0) / totalListings) : 0;
  const minPrice = totalListings > 0 ? Math.min(...listings.map(l => l.price)) : 0;
  const currency = config.defaultCurrency;

  const heroImg = COUNTRY_IMAGES[code || ''] || COUNTRY_IMAGES.cl;

  useSEO({
    title: `Terrenos en ${countryName} - Ofertaterrenos.com`,
    description: `${totalListings} terrenos en venta en ${countryName}. Parcelas, campos y sitios desde ${formatPriceLatam(minPrice, currency)}.`,
    url: `https://ofertaterrenos.com/pais/${code}`,
    canonicalUrl: `https://ofertaterrenos.com/pais/${code}`,
  });

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative h-[280px] md:h-[360px] overflow-hidden">
        <img src={heroImg} alt={`Terrenos en ${countryName}`} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative z-10 container px-4 h-full flex flex-col justify-end pb-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:text-foreground transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-foreground">{config.flag} {countryName}</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2">
            Terrenos en <span className="gradient-text">{countryName}</span> {config.flag}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
            {totalListings} propiedades disponibles en {countryName}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border/50 bg-card/50">
        <div className="container px-4 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: MapPin, label: 'Propiedades', value: totalListings.toString() },
              { icon: DollarSign, label: 'Precio mín.', value: formatPriceLatam(minPrice, currency) },
              { icon: TrendingUp, label: 'Precio promedio', value: formatPriceLatam(avgPrice, currency) },
              { icon: Globe, label: 'Moneda', value: currency },
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

      {/* Regions in this country */}
      {Object.keys(regionStats).length > 0 && (
        <section className="py-8 border-b border-border/50">
          <div className="container px-4">
            <h2 className="text-lg font-bold text-foreground mb-4">Regiones con terrenos</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(regionStats)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([region, stats]) => (
                  <Badge
                    key={region}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors px-3 py-2 gap-2"
                    onClick={() => navigate(`/region/${regionToSlug(region)}`)}
                  >
                    <MapPin className="h-3 w-3" />
                    {region}
                    <span className="text-muted-foreground">({stats.count})</span>
                  </Badge>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Listings */}
      <section className="py-10 md:py-14">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Terrenos disponibles</h2>
            <Button variant="outline" size="sm" onClick={() => navigate(`/explorar?country=${encodeURIComponent(countryName)}`)}>
              <Search className="h-4 w-4 mr-2" /> Filtrar
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
              <Globe className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Sin terrenos en {countryName}</h3>
              <p className="text-muted-foreground mb-6">Aún no hay propiedades publicadas en este país.</p>
              <Button asChild><Link to="/explorar">Explorar todos los países</Link></Button>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              variants={stagger} initial="hidden" animate="visible"
            >
              {listings.map((listing) => (
                <motion.div key={listing.id} variants={fadeUp}>
                  <ListingCard listing={listing} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Other countries */}
      <section className="py-10 border-t border-border/50">
        <div className="container px-4">
          <h2 className="text-xl font-bold text-foreground mb-6">Otros países</h2>
          <div className="flex flex-wrap gap-3">
            {LATAM_COUNTRIES
              .filter(c => c.code.toLowerCase() !== code)
              .map(c => (
                <Badge
                  key={c.code}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors px-4 py-2.5 text-sm gap-2"
                  onClick={() => navigate(`/pais/${c.code.toLowerCase()}`)}
                >
                  {c.flag} {c.name}
                </Badge>
              ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default CountryLanding;
