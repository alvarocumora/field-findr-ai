import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Layers, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const FeaturedProjects = () => {
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

  if (projects.length === 0) return null;

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="container relative z-10 px-4">
        {/* Header */}
        <div className="text-center mb-12">
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
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="group relative glass-strong rounded-3xl overflow-hidden card-hover"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Top accent bar */}
              <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
              
              <div className="p-6 relative z-10">
                {/* Status badge */}
                <Badge className="mb-4 bg-primary/20 text-primary border-0">
                  {project.available_lots || 0} lotes disponibles
                </Badge>
                
                {/* Title */}
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                
                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{project.city}, {project.region}</span>
                </div>
                
                {/* Description */}
                <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
                  {project.description}
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 rounded-xl bg-background/50">
                    <div className="text-lg font-bold text-foreground">{project.total_lots || 0}</div>
                    <div className="text-xs text-muted-foreground">Lotes totales</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-background/50">
                    <Layers className="h-5 w-5 text-primary mx-auto mb-1" />
                    <div className="text-xs text-muted-foreground">{project.total_area ? `${project.total_area} ha` : 'Ver detalles'}</div>
                  </div>
                </div>
                
                {/* CTA */}
                <Button className="w-full group/btn" variant="outline">
                  Ver proyecto
                  <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* View all link */}
        <div className="text-center mt-10">
          <Button variant="ghost" size="lg" asChild className="group">
            <Link to="/explorar">
              Ver todos los proyectos
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProjects;
