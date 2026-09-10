import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import ProjectCommercialCard, { CommercialProject } from './ProjectCommercialCard';

const FeaturedListings = () => {
  const prefersReducedMotion = useReducedMotion();
  const { data: projects = [] } = useQuery({
    queryKey: ['featured-projects-commercial'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, slug, name, description, city, region, images, total_lots, available_lots, featured, created_at')
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      const visible = (data ?? []).filter((project) => Array.isArray(project.images) && project.images.length > 0).slice(0, 6);
      return Promise.all(visible.map(async (project) => {
        const { data: lots } = await supabase.rpc('get_public_lots', { p_project_id: project.id });
        const prices = (lots ?? []).map((lot) => Number(lot.price)).filter((price) => Number.isFinite(price) && price > 0);
        return { ...project, minPrice: prices.length ? Math.min(...prices) : undefined } as CommercialProject;
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  if (projects.length === 0) return null;

  return (
    <section className="py-16 md:py-24" aria-labelledby="featured-title">
      <div className="container px-4">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Terrenos disponibles ahora</p>
            <h2 id="featured-title" className="mt-3 font-heading text-3xl font-bold md:text-5xl">Empieza por el proyecto. Elige después la parcela.</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Compara ubicación, superficie, precio desde y disponibilidad antes de entrar al detalle de cada lote.
            </p>
          </div>
          <Button asChild variant="outline" className="hidden shrink-0 md:inline-flex">
            <Link to="/explorar">Explorar todo el inventario <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>

        <motion.div
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          initial={prefersReducedMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {projects.map((project) => (
            <motion.div key={project.id} variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}>
              <ProjectCommercialCard project={project} />
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-7 md:hidden">
          <Button asChild variant="outline" className="w-full">
            <Link to="/explorar">Explorar todo el inventario <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
