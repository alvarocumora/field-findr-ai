import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PublicLayout from '@/components/layouts/PublicLayout';
import ListingCard from '@/components/listings/ListingCard';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, TrendingUp, DollarSign, Search, Building2, Ruler, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Listing, formatPrice } from '@/hooks/useListings';
import { formatPriceLatam } from '@/lib/latam';

interface CityConfig {
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  currency: string;
  region: string;
  heroImage: string;
  tagline: string;
  description: string;
}

const CITY_CONFIGS: CityConfig[] = [
  {
    slug: 'santiago',
    name: 'Santiago',
    country: 'Chile',
    countryCode: 'cl',
    flag: '🇨🇱',
    currency: 'CLP',
    region: 'Metropolitana',
    heroImage: 'https://images.unsplash.com/photo-1510410899992-52e1ce68f974?w=1200&h=400&fit=crop',
    tagline: 'Capital de oportunidades inmobiliarias',
    description: 'Encuentra terrenos y parcelas en Santiago y la Región Metropolitana. Desde Chicureo hasta Buin, las mejores oportunidades de inversión.',
  },
  {
    slug: 'buenos-aires',
    name: 'Buenos Aires',
    country: 'Argentina',
    countryCode: 'ar',
    flag: '🇦🇷',
    currency: 'USD',
    region: 'Buenos Aires',
    heroImage: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1200&h=400&fit=crop',
    tagline: 'Terrenos en la gran metrópolis del sur',
    description: 'Oportunidades de inversión en terrenos en Buenos Aires y GBA. Desde countries hasta lotes urbanos en zonas de alta valorización.',
  },
  {
    slug: 'bogota',
    name: 'Bogotá',
    country: 'Colombia',
    countryCode: 'co',
    flag: '🇨🇴',
    currency: 'COP',
    region: 'Bogotá D.C.',
    heroImage: 'https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?w=1200&h=400&fit=crop',
    tagline: 'Inversión inmobiliaria en la capital colombiana',
    description: 'Descubre terrenos y lotes en Bogotá y Cundinamarca. Zonas de expansión urbana con alto potencial de valorización.',
  },
  {
    slug: 'ciudad-de-mexico',
    name: 'Ciudad de México',
    country: 'México',
    countryCode: 'mx',
    flag: '🇲🇽',
    currency: 'MXN',
    region: 'CDMX',
    heroImage: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1200&h=400&fit=crop',
    tagline: 'La mayor metrópoli de América Latina',
    description: 'Terrenos y predios en CDMX y Estado de México. Desde Polanco hasta Coyoacán, invierte en la capital mexicana.',
  },
  {
    slug: 'valparaiso',
    name: 'Valparaíso',
    country: 'Chile',
    countryCode: 'cl',
    flag: '🇨🇱',
    currency: 'CLP',
    region: 'Valparaíso',
    heroImage: 'https://images.unsplash.com/photo-1594498653385-d5172c532c00?w=1200&h=400&fit=crop',
    tagline: 'Patrimonio y costa en la joya del Pacífico',
    description: 'Parcelas y terrenos en la Región de Valparaíso. Desde la costa hasta el interior, inversiones con vista al mar.',
  },
  {
    slug: 'medellin',
    name: 'Medellín',
    country: 'Colombia',
    countryCode: 'co',
    flag: '🇨🇴',
    currency: 'COP',
    region: 'Antioquia',
    heroImage: 'https://images.unsplash.com/photo-1599413601750-491c5b3ae926?w=1200&h=400&fit=crop',
    tagline: 'La ciudad de la eterna primavera',
    description: 'Lotes y terrenos en Medellín y Antioquia. Zonas rurales y urbanas con excelente clima y conectividad.',
  },
  {
    slug: 'lima',
    name: 'Lima',
    country: 'Perú',
    countryCode: 'pe',
    flag: '🇵🇪',
    currency: 'PEN',
    region: 'Lima',
    heroImage: 'https://images.unsplash.com/photo-1531968455001-5c5272a67c71?w=1200&h=400&fit=crop',
    tagline: 'Capital gastronómica y de inversión',
    description: 'Terrenos en Lima Metropolitana y provincias cercanas. Desde Cañete hasta Chosica, oportunidades de crecimiento.',
  },
  {
    slug: 'monterrey',
    name: 'Monterrey',
    country: 'México',
    countryCode: 'mx',
    flag: '🇲🇽',
    currency: 'MXN',
    region: 'Nuevo León',
    heroImage: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=1200&h=400&fit=crop',
    tagline: 'Capital industrial del norte de México',
    description: 'Terrenos y predios en Monterrey y Nuevo León. La capital industrial con mayor crecimiento inmobiliario.',
  },
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const CityLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const config = CITY_CONFIGS.find(c => c.slug === slug);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['city-listings', config?.name, config?.country],
    queryFn: async () => {
      if (!config) return [];
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .eq('country', config.country)
        .or(`city.eq.${config.name},region.eq.${config.region}`)
        .order('created_at', { ascending: false })
        .limit(24);
      return (data || []) as Listing[];
    },
    enabled: !!config,
  });

  if (!config) {
    return (
      <PublicLayout>
        <div className="container px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Ciudad no encontrada</h1>
          <Button asChild><Link to="/explorar">Explorar terrenos</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  const totalListings = listings.length;
  const avgPrice = totalListings > 0 ? Math.round(listings.reduce((a, l) => a + l.price, 0) / totalListings) : 0;
  const minPrice = totalListings > 0 ? Math.min(...listings.map(l => l.price)) : 0;
  const totalArea = listings.reduce((a, l) => a + (l.area_m2 || 0), 0);
  const avgPricePerM2 = totalArea > 0 ? Math.round(listings.reduce((a, l) => a + l.price, 0) / totalArea) : 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Terrenos en ${config.name}, ${config.country}`,
    description: config.description,
    url: `https://ofertaterrenos.com/ciudad/${slug}`,
    about: {
      '@type': 'Place',
      name: config.name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: config.name,
        addressRegion: config.region,
        addressCountry: config.countryCode.toUpperCase(),
      },
    },
    numberOfItems: totalListings,
  };

  useSEO({
    title: `Terrenos en ${config.name}, ${config.country}`,
    description: config.description,
    url: `https://ofertaterrenos.com/ciudad/${slug}`,
    canonicalUrl: `https://ofertaterrenos.com/ciudad/${slug}`,
    jsonLd,
  });

  const otherCities = CITY_CONFIGS.filter(c => c.slug !== slug);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative h-[300px] md:h-[380px] overflow-hidden">
        <img src={config.heroImage} alt={`Terrenos en ${config.name}`} className="absolute inset-0 w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative z-10 container px-4 h-full flex flex-col justify-end pb-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:text-foreground transition-colors">Inicio</Link>
            <span>/</span>
            <Link to={`/pais/${config.countryCode}`} className="hover:text-foreground transition-colors">{config.flag} {config.country}</Link>
            <span>/</span>
            <span className="text-foreground">{config.name}</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2">
            Terrenos en <span className="gradient-text">{config.name}</span> {config.flag}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl">{config.tagline}</p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border/50 bg-card/50">
        <div className="container px-4 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Building2, label: 'Propiedades', value: totalListings.toString() },
              { icon: DollarSign, label: 'Desde', value: formatPriceLatam(minPrice, config.currency) },
              { icon: TrendingUp, label: 'Precio promedio', value: formatPriceLatam(avgPrice, config.currency) },
              { icon: BarChart3, label: 'Precio/m²', value: avgPricePerM2 > 0 ? formatPriceLatam(avgPricePerM2, config.currency) : '—' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="font-semibold text-foreground text-sm">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-8 border-b border-border/50">
        <div className="container px-4">
          <h2 className="text-lg font-bold text-foreground mb-3">Sobre {config.name}</h2>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">{config.description}</p>
        </div>
      </section>

      {/* Listings */}
      <section className="py-10 md:py-14">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Terrenos disponibles en {config.name}</h2>
            <Button variant="outline" size="sm" onClick={() => navigate(`/explorar?city=${encodeURIComponent(config.name)}`)}>
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
              <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Sin terrenos en {config.name}</h3>
              <p className="text-muted-foreground mb-6">Aún no hay propiedades publicadas en esta ciudad.</p>
              <Button asChild><Link to="/explorar">Explorar todos</Link></Button>
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

      {/* Other cities */}
      <section className="py-10 border-t border-border/50">
        <div className="container px-4">
          <h2 className="text-xl font-bold text-foreground mb-6">Otras ciudades</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {otherCities.map(c => (
              <Badge
                key={c.slug}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors px-4 py-3 text-sm gap-2 justify-start"
                onClick={() => navigate(`/ciudad/${c.slug}`)}
              >
                {c.flag} {c.name}
                <span className="text-muted-foreground text-xs ml-auto">{c.country}</span>
              </Badge>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default CityLanding;
