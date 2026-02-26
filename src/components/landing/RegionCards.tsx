import { Badge } from '@/components/ui/badge';
import { MapPin, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLandingStats } from '@/hooks/useLandingStats';
import { motion, useReducedMotion } from 'framer-motion';

const formatPrice = (price: number): string => {
  if (price >= 1000000000) return `${(price / 1000000000).toFixed(1)}B`;
  if (price >= 1000000) return `${Math.round(price / 1000000)}M`;
  if (price >= 1000) return `${Math.round(price / 1000)}K`;
  return price.toString();
};

const REGION_IMAGES: Record<string, string> = {
  'Valparaíso': 'https://images.unsplash.com/photo-1583225173760-36e0e1dd2f12?w=400&h=300&fit=crop',
  'Biobío': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  'Los Lagos': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
  'Araucanía': 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop',
  'Maule': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop',
  "O'Higgins": 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=300&fit=crop',
  'Coquimbo': 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=300&fit=crop',
  'Metropolitana': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop',
};
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop';

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
} as const;
const card = {
  hidden: { opacity: 0, y: 25, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' as const } },
} as const;

const RegionCards = () => {
  const navigate = useNavigate();
  const { data: stats } = useLandingStats();
  const regions = stats?.regionData ?? [];
  const prefersReducedMotion = useReducedMotion();

  if (regions.length === 0) return null;

  return (
    <section className="py-16 md:py-20">
      <div className="container px-4">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="outline" className="border-primary/30 text-primary mb-4">
            <Sparkles className="h-3 w-3 mr-1.5" />
            Regiones Populares
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Explora por <span className="gradient-text">región</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Terrenos disponibles en las principales regiones de Chile
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto"
          variants={prefersReducedMotion ? {} : container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {regions.slice(0, 8).map((region) => {
            const img = REGION_IMAGES[region.region] || DEFAULT_IMG;
            return (
              <motion.button
                key={region.region}
                variants={prefersReducedMotion ? {} : card}
                whileHover={{ y: -4 }}
                onClick={() => {
                  const slug = region.region.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  navigate(`/region/${slug}`);
                }}
                className="group relative text-left rounded-2xl overflow-hidden border border-border/50 h-36 md:h-44"
              >
                {/* Background image */}
                <img
                  src={img}
                  alt={region.region}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />

                <div className="relative z-10 flex flex-col justify-end h-full p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-semibold text-foreground truncate">
                      {region.region}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {region.count} {region.count === 1 ? 'terreno' : 'terrenos'}
                  </div>
                  {region.minPrice > 0 && (
                    <div className="text-xs text-primary/80 mt-0.5">
                      Desde ${formatPrice(region.minPrice)}
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default RegionCards;
