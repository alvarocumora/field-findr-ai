import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LockKeyhole } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';
import { cn } from '@/lib/utils';
import { navGroupsFor, type AgentNavContext, type RouteArea } from '@/routes/routeManifest';
import { navIcon } from '@/routes/navIcons';

interface ModulesHubProps {
  area: Extract<RouteArea, 'agent' | 'admin'>;
  plan?: string;
  title?: string;
  className?: string;
  context?: AgentNavContext;
}

/**
 * Índice de módulos derivado del manifiesto único de rutas: garantiza que
 * ninguna sección del panel quede huérfana y que el orden sea el mismo que
 * en la barra lateral.
 */
const ModulesHub = ({ area, plan, title = 'Todos los módulos', className, context }: ModulesHubProps) => {
  const access = useAccess();
  const groups = navGroupsFor(area, plan, context)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        area !== 'agent' || !item.capability || access.can(item.capability)
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <section className={cn('space-y-6', className)} aria-label={title}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">
          Acceso directo a cada herramienta de tu cuenta.
        </p>
      </div>

      {groups.map((group) => (
        <div key={group.group} className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {group.group}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {group.items.map((item) => {
              const Icon = navIcon(item.icon);
              const locked = area === 'agent' && Boolean(item.feature && !access.hasFeature(item.feature));
              return (
                <Card
                  key={item.path}
                  className="group transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <Link
                    to={item.path}
                    className="flex items-center gap-3 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium group-hover:text-foreground">
                        {item.label}
                      </span>
                      {locked && (
                        <Badge variant="outline" className="mt-1 gap-1 text-[10px] font-normal">
                          <LockKeyhole className="h-3 w-3" />
                          Mejorar plan
                        </Badge>
                      )}
                    </span>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
};

export default ModulesHub;
