import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, ChevronDown, Compass, DollarSign, MapPin, Maximize2, TreePine } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTrackEvent } from '@/hooks/useTrackEvent';

const formatPrice = (price: number | null) => {
  if (!price) return 'Consultar';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(price);
};

const ProjectExperience = () => {
  const { id } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
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
      const { data } = await supabase.rpc('get_public_lots', { p_project_id: id! });
      return data || [];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (id) void track('view_experience', { project_id: id, surface: 'atlas' });
  }, [id, track]);

  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 1.1]);
  const textY = useTransform(scrollYProgress, [0.1, 0.25], [100, 0]);
  const textOpacity = useTransform(scrollYProgress, [0.1, 0.2], [0, 1]);
  const statsY = useTransform(scrollYProgress, [0.3, 0.45], [80, 0]);
  const statsOpacity = useTransform(scrollYProgress, [0.3, 0.4], [0, 1]);
  const ctaOpacity = useTransform(scrollYProgress, [0.7, 0.85], [0, 1]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="animate-pulse text-lg text-white/50">Entrando al territorio...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>Proyecto no encontrado</p>
      </div>
    );
  }

  const images = (project as any)?.images || [];
  const heroImg = images[0] || '/placeholder.svg';
  const available = lots?.filter((lot: any) => lot.status === 'available') || [];
  const sold = lots?.filter((lot: any) => lot.status === 'sold') || [];
  const prices = lots?.map((lot: any) => lot.price).filter(Boolean) || [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const areas = lots?.map((lot: any) => lot.area).filter(Boolean) || [];
  const minArea = areas.length > 0 ? Math.min(...areas) : null;
  const maxArea = areas.length > 0 ? Math.max(...areas) : null;
  const location = project.location || project.city || project.region || 'Chile';

  return (
    <div ref={containerRef} className="relative bg-black text-white" style={{ height: '500vh' }}>
      <Link
        to={`/proyecto/${id}`}
        aria-label="Volver a la ficha del proyecto"
        className="fixed left-6 top-6 z-50 rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur-md transition-colors hover:bg-white/20"
      >
        <ArrowLeft className="h-5 w-5 text-white" />
      </Link>

      <div className="fixed right-6 top-6 z-50 hidden items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 backdrop-blur-md sm:flex">
        <Compass className="h-3.5 w-3.5" /> Atlas · Terrain View
      </div>

      <motion.div
        style={prefersReducedMotion ? undefined : { opacity: heroOpacity, scale: heroScale }}
        className="fixed inset-0 z-0"
      >
        <img src={heroImg} alt={project.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/90" />
        <div className="absolute inset-0 grid-topo opacity-[0.08]" aria-hidden="true" />
        <div className="absolute bottom-1/4 left-0 right-0 text-center">
          <motion.div animate={prefersReducedMotion ? undefined : { y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <ChevronDown className="mx-auto h-8 w-8 text-white/60" />
          </motion.div>
          <p className="mt-2 text-sm text-white/45">Desplaza para bajar hasta el proyecto</p>
        </div>
      </motion.div>

      <motion.div
        style={prefersReducedMotion ? undefined : { y: textY, opacity: textOpacity }}
        className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center"
      >
        <div className="max-w-4xl px-8 text-center">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">Chile → {project.region || 'Territorio'} → Proyecto</p>
          <Badge variant="outline" className="mb-4 border-white/30 text-white/80">
            <MapPin className="mr-1 h-3 w-3" />
            {location}
          </Badge>
          <h1 className="mb-4 text-5xl font-bold tracking-tight md:text-7xl">
            {project.name}
          </h1>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-white/70">
            {project.description || 'Explora el proyecto, revisa su inventario real y continúa hasta la parcela que quieres conocer.'}
          </p>
        </div>
      </motion.div>

      <motion.div
        style={prefersReducedMotion ? undefined : { y: statsY, opacity: statsOpacity }}
        className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center"
      >
        <div className="max-w-5xl px-8 text-center">
          <p className="mb-7 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">Inventario vivo</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {[
              { icon: <TreePine className="h-6 w-6" />, label: 'Disponibles ahora', value: `${available.length}` },
              { icon: <DollarSign className="h-6 w-6" />, label: 'Precio desde', value: formatPrice(minPrice) },
              { icon: <Maximize2 className="h-6 w-6" />, label: 'Superficies', value: minArea && maxArea ? `${minArea} – ${maxArea} m²` : '—' },
              { icon: <Calendar className="h-6 w-6" />, label: 'Vendidos', value: `${sold.length} lotes` },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-xl md:p-6">
                <div className="mb-2 flex justify-center text-primary">{stat.icon}</div>
                <p className="text-xl font-bold md:text-2xl">{stat.value}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-7 text-sm text-white/50">La disponibilidad proviene del inventario publicado del proyecto.</p>
        </div>
      </motion.div>

      <div className="absolute left-0 right-0 top-[250vh] z-30 px-5 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">Terrain View</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Conoce el lugar antes de pisarlo.</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {images.slice(0, 6).map((img: string, index: number) => (
              <motion.div
                key={img}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: prefersReducedMotion ? 0 : index * 0.1 }}
                className="aspect-video overflow-hidden rounded-xl border border-white/10"
              >
                <img src={img} alt={`Vista ${index + 1} de ${project.name}`} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <motion.div
        style={prefersReducedMotion ? undefined : { opacity: ctaOpacity }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black via-black/90 to-transparent p-6"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Siguiente destino</p>
          <h3 className="mb-3 text-2xl font-bold">Baja del proyecto a sus parcelas.</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to={`/proyecto/${id}`}>Explorar lotes disponibles</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-white/30 px-8 text-white hover:bg-white/10">
              <a href={`https://wa.me/?text=${encodeURIComponent(`Quiero conocer ${project.name}: ${window.location.href}`)}`} target="_blank" rel="noopener noreferrer">
                Consultar por WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectExperience;
