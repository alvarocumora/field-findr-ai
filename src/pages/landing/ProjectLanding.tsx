import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Trees } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PublicLayout from '@/components/layouts/PublicLayout';
import { supabase } from '@/integrations/supabase/client';
import ProjectDetail from '@/pages/ProjectDetail';

/**
 * Motor único de proyecto por slug (/p/:slug y URLs históricas congeladas).
 * Resuelve el slug y monta la misma experiencia que /proyecto/:id —
 * shell público, tour 360, masterplan, ficha de lote, cotizador y reserva.
 * Las landings a medida por proyecto fueron retiradas.
 */
const ProjectLanding = ({ slug: slugProp }: { slug?: string } = {}) => {
  const params = useParams<{ slug: string }>();
  const slug = slugProp ?? params.slug;

  const { data: project, isLoading, isError, refetch } = useQuery({
    queryKey: ['project-by-slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .eq('slug' as never, slug as never)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string } | null;
    },
    enabled: !!slug,
  });

  if (project?.id) return <ProjectDetail projectId={project.id} />;

  return (
    <PublicLayout>
      <div className="theme-rural min-h-[70vh] bg-background">
        {isLoading ? (
          <div className="p-6 space-y-4 max-w-5xl mx-auto">
            <Skeleton className="h-[420px] w-full rounded-2xl" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 p-10 text-center" role={isError ? 'alert' : undefined}>
            <Trees className="h-10 w-10 text-muted-foreground" />
            <h1 className="font-editorial text-3xl text-foreground">
              {isError ? 'No pudimos cargar el proyecto' : 'Proyecto no encontrado'}
            </h1>
            <p className="text-muted-foreground">
              {isError ? 'Es un problema de conexión; el proyecto sigue publicado.' : 'El enlace puede haber cambiado o el proyecto ya no está publicado.'}
            </p>
            {isError ? (
              <Button onClick={() => void refetch()}>Reintentar</Button>
            ) : (
              <Button asChild><Link to="/explorar">Explorar terrenos<ArrowRight className="h-4 w-4 ml-2" /></Link></Button>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default ProjectLanding;
