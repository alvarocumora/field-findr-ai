import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Maximize2, DollarSign, ChevronDown, Calendar, TreePine } from 'lucide-react';
import { useRef } from 'react';
import { useTrackEvent } from '@/hooks/useTrackEvent';
import { useEffect } from 'react';

const formatPrice = (price: number | null) => {
  if (!price) return 'Consultar';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(price);
};

const ProjectExperience = () => {
  const { id } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const { track } = useTrackEvent();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project-experience', id],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('*').eq('id', id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: lots } = useQuery({
    queryKey: ['project-lots-exp', id],
    queryFn: async () => {
      const { data } = await supabase.from('lots').select('*').eq('project_id', id!);
      return data || [];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (id) track('view_experience', { project_id: id });
  }, [id]);

  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 1.1]);
  const textY = useTransform(scrollYProgress, [0.1, 0.25], [100, 0]);
  const textOpacity = useTransform(scrollYProgress, [0.1, 0.2], [0, 1]);
  const statsY = useTransform(scrollYProgress, [0.3, 0.45], [80, 0]);
  const statsOpacity = useTransform(scrollYProgress, [0.3, 0.4], [0, 1]);
  const ctaOpacity = useTransform(scrollYProgress, [0.7, 0.85], [0, 1]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-white/50 text-lg">Cargando experiencia...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p>Proyecto no encontrado</p>
      </div>
    );
  }

  const images = (project as any)?.images || [];
  const heroImg = images[0] || '/placeholder.svg';
  const available = lots?.filter((l: any) => l.status === 'available') || [];
  const sold = lots?.filter((l: any) => l.status === 'sold') || [];
  const prices = lots?.map((l: any) => l.price).filter(Boolean) || [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const areas = lots?.map((l: any) => l.area).filter(Boolean) || [];
  const minArea = areas.length > 0 ? Math.min(...areas) : null;
  const maxArea = areas.length > 0 ? Math.max(...areas) : null;

  return (
    <div ref={containerRef} className="relative bg-black text-white" style={{ height: '500vh' }}>
      {/* Fixed back button */}
      <Link
        to={`/proyecto/${id}`}
        className="fixed top-6 left-6 z-50 bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-3 hover:bg-white/20 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 text-white" />
      </Link>

      {/* Section 1: Hero Image */}
      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="fixed inset-0 z-0"
      >
        <img src={heroImg} alt={project.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
        <div className="absolute bottom-1/4 left-0 right-0 text-center">
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <ChevronDown className="h-8 w-8 mx-auto text-white/60" />
          </motion.div>
          <p className="text-white/40 text-sm mt-2">Desplaza para descubrir</p>
        </div>
      </motion.div>

      {/* Section 2: Project Name + Location */}
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none"
      >
        <div className="text-center max-w-3xl px-8">
          <Badge variant="outline" className="border-white/30 text-white/80 mb-4">
            <MapPin className="h-3 w-3 mr-1" />
            {project.location || project.city || 'Chile'}
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
            {project.name}
          </h1>
          <p className="text-xl text-white/70 leading-relaxed">
            {project.description || 'Un proyecto diseñado para quienes buscan calidad de vida y conexión con la naturaleza.'}
          </p>
        </div>
      </motion.div>

      {/* Section 3: Stats */}
      <motion.div
        style={{ y: statsY, opacity: statsOpacity }}
        className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl px-8">
          {[
            { icon: <TreePine className="h-6 w-6" />, label: 'Lotes disponibles', value: `${available.length}` },
            { icon: <DollarSign className="h-6 w-6" />, label: 'Desde', value: formatPrice(minPrice) },
            { icon: <Maximize2 className="h-6 w-6" />, label: 'Superficies', value: minArea && maxArea ? `${minArea} - ${maxArea} m²` : '—' },
            { icon: <Calendar className="h-6 w-6" />, label: 'Vendidos', value: `${sold.length} lotes` },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-primary mb-2 flex justify-center">{stat.icon}</div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-white/50 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Section 4: Gallery */}
      <div className="absolute top-[250vh] left-0 right-0 z-30 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Galería del Proyecto</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {images.slice(0, 6).map((img: string, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl overflow-hidden aspect-video"
              >
                <img src={img} alt={`Vista ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 5: CTA */}
      <motion.div
        style={{ opacity: ctaOpacity }}
        className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-gradient-to-t from-black via-black/90 to-transparent"
      >
        <div className="max-w-xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-3">¿Listo para conocer tu futuro terreno?</h3>
          <div className="flex gap-3 justify-center">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to={`/proyecto/${id}`}>Ver lotes disponibles</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 border-white/30 text-white hover:bg-white/10">
              <a href={`https://wa.me/?text=${encodeURIComponent(`Quiero saber más sobre ${project.name}: ${window.location.href}`)}`} target="_blank" rel="noopener">
                WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectExperience;
