import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Ruler, TrendingUp } from 'lucide-react';

const formatPrice = (price: number) => {
  if (price >= 1_000_000_000) return `$${(price / 1_000_000_000).toFixed(1)}B`;
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(0)}M`;
  return `$${price.toLocaleString('es-CL')}`;
};

const formatArea = (m2: number | null, ha: number | null) => {
  if (ha && ha >= 1) return `${ha.toLocaleString('es-CL')} ha`;
  if (m2) return `${m2.toLocaleString('es-CL')} m²`;
  return null;
};

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

const FeaturedListings = () => {
  const prefersReducedMotion = useReducedMotion();

  const { data: listings = [] } = useQuery({
    queryKey: ['featured-listings-landing'],
    queryFn: async () => {
      // Try featured first, fallback to most recent
      const { data: featured } = await supabase
        .from('listings')
        .select('id, title, price, area_m2, area_ha, location, region, type, images, featured, tags')
        .eq('status', 'active')
        .eq('featured', true)
        .limit(6);

      if (featured && featured.length >= 3) return featured;

      const { data: recent } = await supabase
        .from('listings')
        .select('id, title, price, area_m2, area_ha, location, region, type, images, featured, tags')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6);

      return recent || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (listings.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="container px-4">
        <div className="flex items-end justify-between mb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary/70 mb-3">
              Selección curada
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold tracking-tight text-foreground">
              Terrenos destacados
            </h2>
          </motion.div>
          <Button variant="ghost" asChild className="hidden md:flex text-primary">
            <Link to="/explorar">
              Ver todos <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={prefersReducedMotion ? {} : container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {listings.slice(0, 6).map((listing) => {
            const area = formatArea(listing.area_m2, listing.area_ha);
            const img = listing.images?.[0] || '/placeholder.svg';

            return (
              <motion.div key={listing.id} variants={prefersReducedMotion ? {} : item}>
                <Link
                  to={`/propiedad/${listing.id}`}
                  className="group block rounded-2xl border border-border/40 bg-card/50 overflow-hidden hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={img}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {listing.featured && (
                      <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-[10px]">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Destacado
                      </Badge>
                    )}

                    <div className="absolute bottom-3 left-3">
                      <p className="text-xl font-heading font-bold text-white">
                        {formatPrice(listing.price)}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1 mb-1.5 group-hover:text-primary transition-colors">
                      {listing.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                      <MapPin className="h-3 w-3 text-primary/60" />
                      <span className="truncate">{listing.location}{listing.region ? `, ${listing.region}` : ''}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {area && (
                        <span className="flex items-center gap-1">
                          <Ruler className="h-3 w-3" />
                          {area}
                        </span>
                      )}
                      <Badge variant="secondary" className="text-[10px] px-2 py-0">
                        {listing.type}
                      </Badge>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link to="/explorar">Ver todos los terrenos</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
