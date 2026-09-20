import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/brand/Logo';
import LogoIcon from '@/components/brand/LogoIcon';
import { useSmartRedirect } from '@/hooks/useSmartRedirect';
import { useSidebarCounts } from '@/hooks/useSidebarCounts';
import { useCurrentPlan } from '@/hooks/useSubscription';
import { usePanelContext } from '@/hooks/usePanelContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronLeft, ChevronRight, MapPin, Sparkles, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navGroupsFor, type NavLink } from '@/routes/routeManifest';
import { navIcon } from '@/routes/navIcons';

interface ModernSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

/** Accesos comunes a la parte pública, siempre al pie del menú. */
const commonLinks: NavLink[] = [
  { path: '/explorar', label: 'Explorar mapa', group: 'común', icon: 'map-pin' },
  { path: '/tools', label: 'Herramientas IA', group: 'común', icon: 'sparkles' },
  { path: '/perfil', label: 'Mi perfil', group: 'común', icon: 'user' },
];

const commonIcons = { '/explorar': MapPin, '/tools': Sparkles, '/perfil': UserCircle } as const;

const ModernSidebar = ({ collapsed = false, onToggle }: ModernSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isAgent } = useSmartRedirect();
  const { plan } = useCurrentPlan();
  const counts = useSidebarCounts();
  const { context, options, setContext, planIsAgency } = usePanelContext();

  // Toda la navegación sale del manifiesto único de rutas.
  const agentGroups = useMemo(() => navGroupsFor('agent', plan ?? undefined), [plan]);
  const adminGroups = useMemo(() => navGroupsFor('admin'), []);

  // Un solo contexto visible a la vez: se acabó el menú con dos
  // "Administración" apiladas.
  const activeArea: 'agent' | 'admin' = context === 'plataforma' ? 'admin' : 'agent';
  const activeGroups = activeArea === 'admin' ? adminGroups : agentGroups;

  const isActive = (path: string) => location.pathname === path;

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const open = new Set<string>();
    [...agentGroups.map((g) => ['agent', g] as const), ...adminGroups.map((g) => ['admin', g] as const)].forEach(
      ([area, g]) => {
        if (g.items.some((i) => location.pathname === i.path)) open.add(`${area}:${g.group}`);
      },
    );
    return open;
  });

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const badgeMap: Record<string, number> = {
    '/asesor/reservations': counts.pendingReservations,
    '/asesor/leads': counts.newLeads,
    '/asesor/credits': counts.overduePayments,
    '/admin/reservations': counts.pendingReservations,
  };

  const NavItemRow = ({ item }: { item: NavLink }) => {
    const Icon = commonIcons[item.path as keyof typeof commonIcons] ?? navIcon(item.icon);
    const badgeCount = badgeMap[item.path] || 0;
    return (
      <Link
        to={item.path}
        className={cn(
          'relative flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150',
          isActive(item.path)
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          collapsed ? 'justify-center' : 'justify-start',
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon className={cn('h-4.5 w-4.5 flex-shrink-0', !collapsed && 'mr-3')} />
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!collapsed && badgeCount > 0 && (
          <Badge
            variant="destructive"
            className="ml-auto text-[10px] h-5 min-w-[20px] px-1.5 flex items-center justify-center"
          >
            {badgeCount}
          </Badge>
        )}
        {collapsed && badgeCount > 0 && (
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive" />
        )}
      </Link>
    );
  };

  const GroupedNav = ({
    area,
    title,
    groups,
  }: {
    area: 'agent' | 'admin';
    title: string;
    groups: { group: string; items: NavLink[] }[];
  }) => {
    const primary = groups.flatMap((g) => g.items).filter((i) => i.primary);
    const rest = groups
      .map((g) => ({ ...g, items: g.items.filter((i) => !i.primary) }))
      .filter((g) => g.items.length > 0);

    if (collapsed) {
      return (
        <div className="space-y-0.5">
          {[...primary, ...rest.flatMap((g) => g.items)].map((item) => (
            <NavItemRow key={item.path} item={item} />
          ))}
        </div>
      );
    }

    return (
      <>
        <span className="block px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div className="space-y-0.5">
          {primary.map((item) => (
            <NavItemRow key={item.path} item={item} />
          ))}
        </div>
        {rest.map((group) => {
          const key = `${area}:${group.group}`;
          const open = openGroups.has(key);
          return (
            <Collapsible key={key} open={open} onOpenChange={() => toggleGroup(key)}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-1.5 mt-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                <span className="truncate">{group.group}</span>
                <ChevronDown
                  className={cn('h-3 w-3 flex-shrink-0 transition-transform', open && 'rotate-180')}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 mt-0.5">
                {group.items.map((item) => (
                  <NavItemRow key={item.path} item={item} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </>
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-200 z-40',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-3 mb-2">
          {!collapsed ? (
            <Link to="/">
              <Logo size="sm" />
            </Link>
          ) : (
            <Link to="/" className="mx-auto">
              <LogoIcon size="sm" />
            </Link>
          )}
        </div>

        {/* Toggle */}
        <div className="px-3 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn('h-8 w-8 p-0', collapsed ? 'mx-auto' : 'ml-auto')}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Contexto activo: un solo menú por rol, con selector si hay varios */}
        {!collapsed && (isAdmin || isAgent) && (
          <div className="px-3 mb-2 space-y-2">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {context === 'plataforma' ? 'ADMIN' : planIsAgency ? 'INMOBILIARIA' : 'CORREDOR'}
            </Badge>
            {options.length > 1 && (
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/40 p-1">
                {options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setContext(option.id);
                      navigate(option.home);
                    }}
                    className={cn(
                      'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                      context === option.id
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {option.id === 'plataforma' ? 'Plataforma' : option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1" aria-label="Navegación del panel">
          {(isAgent || isAdmin) && (
            <GroupedNav
              area={activeArea}
              title={activeArea === 'admin' ? 'Administración' : planIsAgency ? 'Inmobiliaria' : 'Corredor'}
              groups={activeGroups}
            />
          )}


          <Separator className="my-2" />
          <div className="space-y-0.5 pb-4">
            {commonLinks.map((item) => (
              <NavItemRow key={item.path} item={item} />
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default ModernSidebar;
