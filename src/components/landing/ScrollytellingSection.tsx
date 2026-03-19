import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, ArrowUpRight, Layers } from 'lucide-react';
import ProjectScene3D from './ProjectScene3D';

const ScrollytellingSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['scrollytelling-projects'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .limit(6);
      return data || [];
    },
  });

  const { data: lotPrices = {} } = useQuery({
    queryKey: ['scrolly-lot-prices', projects.map(p => p.id)],
    queryFn: async () => {
      const ids = projects.map(p => p.id);
      if (!ids.length) return {};
      const { data } = await supabase
        .from('lots')
        .select('project_id, price')
        .in('project_id', ids)
        .not('price', 'is', null)
        .order('price', { ascending: true });
      const result: Record<string, number> = {};
      (data || []).forEach((lot) => {
        if (!result[lot.project_id]) result[lot.project_id] = lot.price!;
      });
      return result;
    },
    enabled: projects.length > 0,
  });

  if (projects.length === 0) return null;

  return (
    <section ref={containerRef} className="relative py-20 md:py-32">
      {/* Section header */}
      <div className="container px-4 mb-16">
        <motion.div
          className="max-w-3xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.4em] text-primary/70 mb-4">
            Proyectos Activos
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-foreground leading-tight mb-4">
            Terrenos con{' '}
            <span className="gradient-text-hero">visión de futuro</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl">
            Cada proyecto incluye análisis legal, topografía verificada y simulación 3D interactiva.
          </p>
        </motion.div>
      </div>

      {/* Project cards grid */}
      <div className="container px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {projects.map((project, i) => {
            const total = project.total_lots ?? 0;
            const sold = (project.sold_lots ?? 0) + (project.reserved_lots ?? 0);
            const progress = total > 0 ? Math.round((sold / total) * 100) : 0;
            const minPrice = lotPrices[project.id];

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{
                  duration: 0.6,
                  delay: prefersReducedMotion ? 0 : i * 0.1,
                  ease: 'easeOut',
                }}
              >
                <Link
                  to={`/proyecto/${project.id}`}
                  className="group block relative rounded-2xl overflow-hidden border border-border/50 bg-card hover:border-primary/30 transition-all duration-500"
                >
                  {/* 3D Preview viewport */}
                  <div className="relative h-52 bg-background overflow-hidden">
                    <ProjectScene3D
                      latitude={project.latitude}
                      longitude={project.longitude}
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    
                    {/* Coordinate badge */}
                    {project.latitude && project.longitude && (
                      <div className="absolute top-3 left-3 font-mono text-[9px] tracking-[0.2em] text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
                        {project.latitude.toFixed(2)}° S, {Math.abs(project.longitude ?? 0).toFixed(2)}° W
                      </div>
                    )}

                    {/* Arrow icon */}
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full border border-border/50 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </div>

                  {/* Card content */}
                  <div className="p-5">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase tracking-wider font-mono">
                        <Layers className="h-2.5 w-2.5 mr-1" />
                        {project.available_lots || 0} disponibles
                      </Badge>
                      {progress > 50 && (
                        <Badge variant="outline" className="text-[10px] border-warning/30 text-warning uppercase tracking-wider font-mono">
                          Alta demanda
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-heading font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                      <MapPin className="h-3.5 w-3.5 text-primary/60" />
                      <span>{project.city}{project.region ? `, ${project.region}` : ''}</span>
                    </div>

                    {/* Progress */}
                    {total > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between font-mono text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">
                          <span>{sold}/{total} vendidos</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1" />
                      </div>
                    )}

                    {/* Price */}
                    {minPrice && (
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Desde</span>
                        <span className="text-xl font-heading font-bold text-foreground">
                          ${minPrice.toLocaleString('es-CL')}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">CLP</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom accent line */}
                  <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ScrollytellingSection;
