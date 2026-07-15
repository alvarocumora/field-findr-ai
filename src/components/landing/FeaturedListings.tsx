import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Layers, Sparkles } from 'lucide-react';

/**
 * Home "Terrenos destacados" section.
 *
 * Muestra PROYECTOS/LOTEOS destacados (no lotes individuales).
 * Slot pagado: las inmobiliarias que compran el add-on "Súper Destacado"
 * (projects.featured = true) aparecen aquí con la etiqueta "Destacado".
 * Fallback: proyectos activos más recientes si aún no hay pagados.
 */
const FeaturedListings = () => {
  const prefersReducedMotion = useReducedMotion();

  const { data: projects = [] } = useQuery({
    queryKey: ['featured-projects-landing'],
    queryFn: async () => {
      const cols =
        'id, name, description, city, region, images, total_lots, available_lots, featured, created_at';

      const { data: paid } = await supabase
        .from('projects')
        .select(cols)
        .eq('status', 'active')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      const hasImages = (p: any) => Array.isArray(p?.images) && p.images.length > 0;
      const paidWithImages = (paid ?? []).filter(hasImages);
      if (paidWithImages.length >= 3) return paidWithImages;

      const { data: recent } = await supabase
        .from('projects')
        .select(cols)
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(18);

      // Only surface projects with a cover image so the section never looks empty.
      const merged = [
        ...paidWithImages,
        ...(recent ?? []).filter(hasImages).filter((p) => !paidWithImages.some((x) => x.id === p.id)),
      ];
      return merged.slice(0, 6);
    },
    staleTime: 5 * 60 * 1000,
  });

  if (projects.length === 0) return null;


  const container = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
  const item = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
  };

  return (
    <section className="py-12 md:py-24">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 md:mb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary/70 mb-2 md:mb-3">
              Loteos destacados · Slot patrocinado
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold tracking-tight text-foreground">
              Proyectos destacados
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Loteos y desarrollos completos, no lotes sueltos. ¿Eres inmobiliaria?
              <Link to="/pricing" className="text-primary hover:underline ml-1">
                Aparece aquí desde 1.5 UF/mes
              </Link>.
            </p>
          </motion.div>
          <Button variant="ghost" asChild className="hidden md:flex text-primary">
            <Link to="/explorar">
              Ver todos <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
          variants={prefersReducedMotion ? {} : container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >

          {projects.slice(0, 6).map((p: any) => {
            const img = p.images?.[0] || '/placeholder.svg';
            const location = [p.city, p.region].filter(Boolean).join(', ');
            return (
              <motion.div key={p.id} variants={prefersReducedMotion ? {} : item}>
                <Link
                  to={`/proyecto/${p.id}`}
                  className="group block rounded-2xl border border-border/40 bg-card/50 overflow-hidden hover:border-primary/40 hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={img}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {p.featured && (
                      <Badge className="absolute top-3 left-3 bg-amber-500/90 text-white border-0 text-[10px]">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Destacado
                      </Badge>
                    )}
                    <Badge className="absolute top-3 right-3 bg-black/60 text-white border-0 text-[10px] backdrop-blur-sm">
                      <Layers className="h-3 w-3 mr-1" />
                      Loteo
                    </Badge>

                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div>
                        <p className="text-lg font-heading font-bold text-white leading-tight">
                          {p.name}
                        </p>
                        {typeof p.available_lots === 'number' && (
                          <p className="text-xs text-white/80 mt-0.5">
                            {p.available_lots} de {p.total_lots ?? p.available_lots} lotes disponibles
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3 text-primary/60" />
                      <span className="truncate">{location || 'Sin ubicación'}</span>
                    </div>
                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {p.description}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link to="/explorar">Ver todos los proyectos</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
