import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Box, Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProjectCommercialCard, { CommercialProject } from './ProjectCommercialCard';
import velValle from '@/assets/valle-escondido-licanten/vel-valle.jpg';

// Fotos reales locales para proyectos cuyo campo images aún está vacío.
const LOCAL_COVERS: Record<string, string> = {
  'valle-escondido-licanten': velValle,
};

type Zone = 'all' | 'maule' | 'sur' | 'other';
const ZONES: { id: Zone; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'maule', label: 'Maule y costa' },
  { id: 'sur', label: 'Lagos y sur' },
  { id: 'other', label: 'Otras zonas' },
];

const zoneOf = (region?: string | null): Zone => {
  const r = (region ?? '').toLowerCase();
  if (/maule|o'?higgins|valpara/.test(r)) return 'maule';
  if (/lagos|r[ií]os|araucan|biob|ays|magall|ñuble|nuble/.test(r)) return 'sur';
  return 'other';
};

const FeaturedListings = () => {
  const prefersReducedMotion = useReducedMotion();
  const [zone, setZone] = useState<Zone>('all');
  const { data: projects = [] } = useQuery({
    queryKey: ['featured-projects-commercial-v2'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, slug, name, description, city, region, images, total_lots, available_lots, featured, created_at')
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(9);
      if (error) throw error;
      return Promise.all((data ?? []).map(async (project) => {
        const { data: lots } = await supabase.rpc('get_public_lots', { p_project_id: project.id });
        const list = (lots ?? []) as Array<{ price: number | null; status: string | null }>;
        const available = list.filter((l) => l.status === 'available');
        const prices = available.map((l) => Number(l.price)).filter((p) => Number.isFinite(p) && p > 0);
        const images = Array.isArray(project.images) && project.images.length > 0
          ? project.images
          : (project.slug && LOCAL_COVERS[project.slug] ? [LOCAL_COVERS[project.slug]] : []);
        return {
          ...project,
          images,
          total_lots: list.length || project.total_lots,
          available_lots: list.length ? available.length : project.available_lots,
          minPrice: prices.length ? Math.min(...prices) : undefined,
        } as CommercialProject;
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const zonesPresent = useMemo(() => new Set(projects.map((p) => zoneOf(p.region))), [projects]);
  const visible = zone === 'all' ? projects : projects.filter((p) => zoneOf(p.region) === zone);

  if (projects.length === 0) return null;

  return (
    <section className="py-14 md:py-20" aria-labelledby="featured-title">
      <div className="container px-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Loteos insignia</p>
            <h2 id="featured-title" className="mt-3 font-heading text-3xl font-bold md:text-5xl">Los mejores loteos, a un clic.</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Precios desde, parcelas disponibles en vivo y acceso directo al masterplan de cada proyecto.
            </p>
          </div>
          <Button asChild variant="outline" className="hidden shrink-0 md:inline-flex">
            <Link to="/explorar">Ver todo el inventario <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por zona">
          {ZONES.filter((z) => z.id === 'all' || zonesPresent.has(z.id)).map((z) => (
            <button
              key={z.id}
              role="tab"
              aria-selected={zone === z.id}
              onClick={() => setZone(z.id)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                zone === z.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground',
              )}
            >
              {z.label}
            </button>
          ))}
        </div>

        <motion.div
          key={zone}
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          initial={prefersReducedMotion ? false : 'hidden'}
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
        >
          {visible.map((project) => (
            <motion.div key={project.id} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col gap-2">
              <ProjectCommercialCard project={project} />
              <div className="grid grid-cols-2 gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link to={`/proyecto/${project.id}/experiencia`}><Box className="mr-1.5 h-4 w-4" />Masterplan 3D</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/proyecto/${project.id}`}><MapIcon className="mr-1.5 h-4 w-4" />Ver parcelas</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-7 md:hidden">
          <Button asChild variant="outline" className="w-full">
            <Link to="/explorar">Ver todo el inventario <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
