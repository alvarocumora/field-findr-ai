import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectDownloads } from '@/components/projects/ProjectDownloads';
import type { KitLot } from '@/lib/pdf/projectKit';

interface Props {
  slug: string;
  className?: string;
  title?: string;
  description?: string;
}

/**
 * Material descargable para las landings a medida: resuelve proyecto y lotes
 * desde la base por slug, de modo que cada experiencia cinematográfica ofrezca
 * el mismo kit (dossier, precios, plano) sin duplicar lógica.
 */
export const ProjectDownloadsBySlug = ({ slug, className, title, description }: Props) => {
  const { data: project } = useQuery({
    queryKey: ['kit-project', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, user_id, name, slug, description, location, region, latitude, longitude, images')
        .eq('slug' as never, slug as never)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as {
        id: string; user_id: string; name: string; slug: string | null;
        description: string | null; location: string | null; region: string | null;
        latitude: number | null; longitude: number | null; images: string[] | null;
      } | null;
    },
  });

  const { data: lots = [] } = useQuery({
    queryKey: ['kit-lots', project?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_lots', { p_project_id: project!.id });
      if (error) throw error;
      return (data ?? []) as unknown as KitLot[];
    },
    enabled: !!project?.id,
  });

  if (!project) return null;

  return (
    <ProjectDownloads
      className={className}
      title={title}
      description={description}
      project={{
        id: project.id,
        name: project.name,
        slug: project.slug ?? slug,
        description: project.description,
        location: project.location,
        region: project.region,
        latitude: project.latitude,
        longitude: project.longitude,
        images: project.images,
      }}
      lots={lots}
      projectOwnerId={project.user_id}
    />
  );
};

export default ProjectDownloadsBySlug;
