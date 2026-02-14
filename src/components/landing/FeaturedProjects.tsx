import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
} as const;
const card = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: 'easeOut' as const } },
} as const;

const FeaturedProjects = () => {
  const prefersReducedMotion = useReducedMotion();

  const { data: projects = [] } = useQuery({
    queryKey: ['featured-projects'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .limit(3);
      return data || [];
    },
  });

  const projectIds = projects.map((p) => p.id);
  const { data: lotPrices = {} } = useQuery({
    queryKey: ['lot-min-prices', projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return {};
      const { data } = await supabase
        .from('lots')
        .select('project_id, price')
        .in('project_id', projectIds)
        .not('price', 'is', null)
        .order('price', { ascending: true });
      const result: Record<string, number> = {};
      (data || []).forEach((lot) => {
        if (!result[lot.project_id]) result[lot.project_id] = lot.price!;
      });
      return result;
    },
    enabled: projectIds.length > 0,
  });

  if (projects.length === 0) return null;

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      <div className="container relative z-10 px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="outline" className="border-primary/30 text-primary mb-4">
            <Sparkles className="h-3 w-3 mr-1.5" />
            Proyectos Destacados
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Invierte en proyectos{' '}
            <span className="gradient-text">exclusivos</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Proyectos verificados con alta rentabilidad y respaldo legal completo
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
          variants={prefersReducedMotion ? {} : container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {projects.map((project) => {
            const total = project.total_lots ?? 0;
            const sold = (project.sold_lots ?? 0) + (project.reserved_lots ?? 0);
            const progress = total > 0 ? Math.round((sold / total) * 100) : 0;
            const minPrice = lotPrices[project.id];

            return (
              <motion.div
                key={project.id}
                variants={prefersReducedMotion ? {} : card}
                whileHover={{ y: -6 }}
                className="group relative glass-strong rounded-3xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />

                <div className="p-6 relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-primary/20 text-primary border-0">
                      {project.available_lots || 0} disponibles
                    </Badge>
                    {progress > 0 && (
                      <Badge variant="outline" className="border-accent/30 text-accent">
                        {progress}% vendido
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{project.city}, {project.region}</span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-5 line-clamp-2">
                    {project.description}
                  </p>

                  {total > 0 && (
                    <div className="mb-5">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>{sold} de {total} lotes vendidos</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {minPrice && (
                    <div className="mb-5 p-3 rounded-xl bg-background/50 text-center">
                      <span className="text-xs text-muted-foreground">Desde</span>
                      <div className="text-lg font-bold text-foreground">
                        ${minPrice.toLocaleString('es-CL')} CLP
                      </div>
                    </div>
                  )}

                  <Button className="w-full group/btn" variant="outline" asChild>
                    <Link to={`/proyecto/${project.id}`}>
                      Ver proyecto
                      <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Button variant="ghost" size="lg" asChild className="group">
            <Link to="/explorar">
              Ver todos los proyectos
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProjects;
