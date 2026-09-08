import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface CommercialProject {
  id: string;
  slug?: string | null;
  name: string;
  description?: string | null;
  city?: string | null;
  region?: string | null;
  images?: string[] | null;
  total_lots?: number | null;
  available_lots?: number | null;
  featured?: boolean | null;
  minPrice?: number;
}

interface ProjectCommercialCardProps {
  project: CommercialProject;
  compact?: boolean;
  onOpen?: (project: CommercialProject) => void;
}

const formatPrice = (value?: number) =>
  value ? `$${value.toLocaleString('es-CL')}` : 'Consultar valor';

const ProjectCommercialCard = ({ project, compact = false, onOpen }: ProjectCommercialCardProps) => {
  const image = project.images?.[0];
  const location = [project.city, project.region].filter(Boolean).join(', ');
  const href = project.slug ? `/p/${project.slug}` : `/proyecto/${project.id}`;

  return (
    <Link
      to={href}
      onClick={() => onOpen?.(project)}
      className={cn(
        'group block overflow-hidden border border-border/60 bg-card transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        compact ? 'w-[15.5rem] shrink-0 rounded-md' : 'rounded-md',
      )}
    >
      <div className={cn('relative overflow-hidden bg-muted', compact ? 'h-28' : 'aspect-[16/10]')}>
        {image ? (
          <img
            src={image}
            alt={`Vista de ${project.name}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading={compact ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="h-full w-full grid-topo" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
        {project.featured && (
          <Badge className="absolute left-3 top-3 border-0 bg-primary text-primary-foreground">Destacado</Badge>
        )}
        <span className="absolute bottom-3 left-3 text-xs font-semibold text-foreground">
          {project.available_lots ?? 0} disponibles
        </span>
      </div>
      <div className={cn('relative', compact ? 'p-3.5' : 'p-5')}>
        <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
        <h3 className="pr-7 font-heading text-base font-bold text-foreground">{project.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 text-primary" aria-hidden="true" />
          {location || 'Ubicación disponible en la ficha'}
        </p>
        <div className="mt-3 flex items-end justify-between gap-3 border-t border-border/50 pt-3">
          <div>
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">Desde</p>
            <p className="font-heading text-sm font-bold text-foreground">{formatPrice(project.minPrice)}</p>
          </div>
          {project.total_lots ? (
            <p className="text-right text-[10px] text-muted-foreground">{project.total_lots} lotes totales</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
};

export default ProjectCommercialCard;