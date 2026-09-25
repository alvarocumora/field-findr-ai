import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectDownloads } from '@/components/projects/ProjectDownloads';
import type { KitLot, KitProject } from '@/lib/pdf/projectKit';
import { parseLandingConfig } from '@/lib/landing/config';

interface Props {
  slug: string;
  className?: string;
  title?: string;
  description?: string;
  fallbackMedia?: KitProject['media'];
  fallbackContact?: KitProject['contact'];
}

/**
 * Material descargable para las landings a medida: resuelve proyecto y lotes
 * desde la base por slug, de modo que cada experiencia cinematográfica ofrezca
 * el mismo kit (dossier, precios, plano) sin duplicar lógica.
 */
export const ProjectDownloadsBySlug = ({ slug, className, title, description, fallbackMedia, fallbackContact }: Props) => {
  const { data: project } = useQuery({
    queryKey: ['kit-project', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, user_id, name, slug, description, location, region, latitude, longitude, images, landing_config, commercial_conditions')
        .eq('slug' as never, slug as never)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data as unknown as {
        id: string; user_id: string; name: string; slug: string | null;
        description: string | null; location: string | null; region: string | null;
        latitude: number | null; longitude: number | null; images: string[] | null;
        landing_config: unknown; commercial_conditions: KitProject['conditions'];
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
  const cfg = parseLandingConfig(project.landing_config);
  const rawConfig = project.landing_config && typeof project.landing_config === 'object' && !Array.isArray(project.landing_config)
    ? project.landing_config as Record<string, unknown>
    : {};
  const spatial = rawConfig.spatial && typeof rawConfig.spatial === 'object'
    ? rawConfig.spatial as KitProject['spatial']
    : null;
  const images = [cfg.hero.image, ...cfg.gallery, ...(project.images ?? [])].filter((src): src is string => Boolean(src));

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
        images,
        media: images.length ? undefined : fallbackMedia,
        highlights: cfg.highlights,
        conditions: project.commercial_conditions,
        spatial,
        contact: {
          phone: cfg.contact.phone || fallbackContact?.phone,
          whatsapp: cfg.contact.whatsapp || fallbackContact?.whatsapp,
          email: cfg.contact.email || fallbackContact?.email,
        },
      }}
      lots={lots}
      projectOwnerId={project.user_id}
    />
  );
};

export default ProjectDownloadsBySlug;
