import { Link, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import PublicLayout from '@/components/layouts/PublicLayout';
import ListingCard from '@/components/listings/ListingCard';
import MiniMap from '@/components/map/MiniMap';
import { useFeaturedListings } from '@/hooks/useListings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowRight, Search, Sparkles, TreePine, Factory, 
  Building2, Waves, Mountain, Landmark, MapPin,
} from 'lucide-react';
import { useState } from 'react';
import HeroStats from '@/components/landing/HeroStats';
import HowItWorks from '@/components/landing/HowItWorks';
import FeaturedProjects from '@/components/landing/FeaturedProjects';
import TrustBadges from '@/components/landing/TrustBadges';
import FloatingCTA from '@/components/landing/FloatingCTA';
import RegionCards from '@/components/landing/RegionCards';
import ParallaxBanner from '@/components/landing/ParallaxBanner';
import heroImg from '@/assets/hero-landscape.jpg';

const CATEGORIES = [
  { name: 'Parcelas', icon: TreePine, type: 'parcela_rural' },
  { name: 'Industrial', icon: Factory, type: 'sitio_industrial' },
  { name: 'Agrícola', icon: Landmark, type: 'campo_agricola' },
  { name: 'Urbano', icon: Building2, type: 'terreno_urbano' },
  { name: 'Costero', icon: Waves, type: 'terreno_costero' },
  { name: 'Montaña', icon: Mountain, type: 'terreno_montana' },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
} as const;
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
} as const;

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { data: featuredListings = [], isLoading } = useFeaturedListings(6);
  const prefersReducedMotion = useReducedMotion();

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroImgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroContentY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);

  const handleSearch = () => {
    navigate(`/explorar${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  return (
    <PublicLayout showFooter={true}>
      {/* Hero Section with Parallax Background */}
      <section ref={heroRef} className="relative min-h-[90vh] md:min-h-screen flex items-center overflow-hidden">
        {/* Background image with parallax */}
        <motion.div
          className="absolute inset-0 -top-[15%] h-[130%]"
          style={prefersReducedMotion ? {} : { y: heroImgY }}
        >
          <img src={heroImg} alt="" className="w-full h-full object-cover" aria-hidden="true" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />

        <motion.div
          className="container relative z-10 px-4 py-20 md:py-32"
          style={prefersReducedMotion ? {} : { y: heroContentY }}
        >
          <motion.div
            className="max-w-4xl mx-auto text-center mb-16"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass border border-primary/15 text-sm mb-8">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Plataforma potenciada por</span>
              <span className="text-primary font-semibold">IA</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.1]">
              Descubre tu{' '}
              <span className="gradient-text-hero">terreno ideal</span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-muted-foreground text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              La plataforma #1 en Chile para inversión en terrenos con análisis predictivo y datos verificados
            </motion.p>

            <motion.div variants={fadeUp} className="glass-strong rounded-2xl p-2 max-w-2xl mx-auto shadow-xl border border-border/50">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Ej: parcela 5.000 m² en Región de Los Lagos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-12 h-14 bg-transparent border-0 focus-visible:ring-0 text-base"
                  />
                </div>
                <Button onClick={handleSearch} size="lg" className="h-14 px-8">
                  <Search className="h-5 w-5 mr-2" />
                  Buscar
                </Button>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2 mt-8">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.type}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/explorar?type=${cat.type}`)}
                  className="h-9 px-4 text-sm rounded-full hover:bg-primary/10 hover:text-primary transition-colors border border-border/50 hover:border-primary/20"
                >
                  <cat.icon className="h-4 w-4 mr-1.5" />
                  {cat.name}
                </Button>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <HeroStats />
          </motion.div>
        </motion.div>
      </section>

      <HowItWorks />
      <RegionCards />
      <ParallaxBanner />
      <FeaturedProjects />

      {/* Featured Properties Section */}
      <section className="py-16 md:py-20">
        <div className="container px-4">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-primary/30 text-primary text-sm px-3 py-1">
                    <Sparkles className="h-3 w-3 mr-1.5" />
                    Terrenos Destacados
                  </Badge>
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {featuredListings.length} propiedades
                  </span>
                </div>
                <Button variant="ghost" size="sm" asChild className="group">
                  <Link to="/explorar">
                    Ver todas
                    <ArrowRight className="h-4 w-4 ml-1.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-[4/3] rounded-xl" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5"
                  variants={stagger}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                >
                  {featuredListings.slice(0, 4).map((listing) => (
                    <motion.div key={listing.id} variants={fadeUp}>
                      <ListingCard listing={listing} />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {featuredListings.length > 4 && (
                <motion.div
                  className="mt-4 md:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5"
                  variants={stagger}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                >
                  {featuredListings.slice(4, 6).map((listing) => (
                    <motion.div key={listing.id} variants={fadeUp}>
                      <ListingCard listing={listing} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Ubicaciones en Chile</span>
                </div>
                <MiniMap 
                  listings={featuredListings} 
                  className="h-[350px] sm:h-[400px] lg:h-[520px] rounded-xl shadow-soft"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustBadges />
      <FloatingCTA />
    </PublicLayout>
  );
};

export default Index;
