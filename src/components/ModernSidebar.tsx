import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/brand/Logo';
import LogoIcon from '@/components/brand/LogoIcon';
import OrganizationSwitcher from '@/components/organization/OrganizationSwitcher';
import { useSidebarCounts } from '@/hooks/useSidebarCounts';
import { useAccess } from '@/hooks/useAccess';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronLeft, ChevronRight, LockKeyhole, MapPin, Home, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navGroupsFor, type NavLink } from '@/routes/routeManifest';
import { navIcon } from '@/routes/navIcons';

interface ModernSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
}

/** Accesos comunes a la parte pública, siempre al pie del menú. */
const commonLinks: NavLink[] = [
  { path: '/explorar', label: 'Explorar mapa', group: 'común', icon: 'map-pin' },
  { path: '/', label: 'Ver sitio público', group: 'común', icon: 'home' },
];

const commonIcons = { '/explorar': MapPin, '/': Home } as const;

const ModernSidebar = ({ collapsed = false, onToggle, mobile = false, onNavigate }: ModernSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const counts = useSidebarCounts();
  const [menuQuery, setMenuQuery] = useState('');
  useEffect(() => setMenuQuery(''), [location.pathname]);
  const access = useAccess();
  const {
    isAdmin,
    isAgent,
    plan,
    context,
    contexts: options,
    setContext,
    planIsAgency,
  } = access;

  // Toda la navegación sale del manifiesto único de rutas.
  const agentContext = context === 'broker' ? 'broker' : 'empresa';
  const agentGroups = useMemo(
    () => navGroupsFor('agent', plan ?? undefined, agentContext)
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.capability || access.can(item.capability)),
      }))
      .filter((group) => group.items.length > 0),
    [access, agentContext, plan],
  );
  const adminGroups = useMemo(() => navGroupsFor('admin'), []);

  // Un solo contexto visible a la vez: se acabó el menú con dos
  // "Administración" apiladas.
  const activeArea: 'agent' | 'admin' = context === 'plataforma' ? 'admin' : 'agent';
  const allGroups = activeArea === 'admin' ? adminGroups : agentGroups;
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const search = normalize(menuQuery.trim());
  const activeGroups = allGroups.map((group) => ({ ...group, items: group.items.filter((item) => !search || normalize(`${item.label} ${group.group}`).includes(search)) })).filter((group) => group.items.length);

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

  // A route change must reveal its navigation group without closing other groups.
  useEffect(() => {
    setOpenGroups((previous) => {
      const next = new Set(previous);
      activeGroups.forEach((group) => {
        if (group.items.some((item) => item.path === location.pathname)) {
          next.add(`${activeArea}:${group.group}`);
        }
      });
      return next.size === previous.size ? previous : next;
    });
  }, [location.pathname, activeArea, activeGroups]);

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
    const locked = Boolean(item.feature && !access.hasFeature(item.feature));
    return (
      <Link
        to={item.path}
        onClick={onNavigate}
        aria-current={isActive(item.path) ? 'page' : undefined}
        className={cn(
          'relative flex min-h-11 items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150',
          isActive(item.path)
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          collapsed ? 'justify-center' : 'justify-start',
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon className={cn('h-4.5 w-4.5 flex-shrink-0', !collapsed && 'mr-3')} />
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!collapsed && locked && (
          <LockKeyhole className="ml-auto h-3.5 w-3.5 text-muted-foreground/70" aria-label="Requiere mejorar plan" />
        )}
        {!collapsed && badgeCount > 0 && (
          <Badge
            variant="destructive"
            className="ml-auto text-[10px] h-5 min-w-[20px] px-1.5 flex items-center justify-center"
          >
            {badgeCount}
          </Badge>
        )}
        {collapsed && locked && (
          <LockKeyhole className="absolute right-0 top-0 h-3 w-3 text-muted-foreground" />
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
          const open = Boolean(search) || openGroups.has(key);
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
        'h-full bg-sidebar border-r border-sidebar-border transition-all duration-200',
        mobile ? 'relative w-full' : 'fixed left-0 top-0 z-40',
        !mobile && (collapsed ? 'w-16' : 'w-60'),
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-3 mb-2">
          {!collapsed ? (
            <Link to="/" onClick={onNavigate}>
              <Logo size="sm" />
            </Link>
          ) : (
            <Link to="/" className="mx-auto" onClick={onNavigate}>
              <LogoIcon size="sm" />
            </Link>
          )}
        </div>

        {/* Toggle */}
        {!mobile && <div className="px-3 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn('h-8 w-8 p-0', collapsed ? 'mx-auto' : 'ml-auto')}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>}

        {/* Contexto activo: un solo menú por rol, con selector si hay varios */}
        {!collapsed && (isAdmin || isAgent) && (
          <div className="px-3 mb-2 space-y-2">
            {context === 'empresa' && <OrganizationSwitcher />}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {context === 'plataforma'
                ? 'PLATAFORMA'
                : context === 'broker'
                  ? 'BROKER'
                  : context === 'buyer'
                    ? 'COMPRADOR'
                    : planIsAgency
                      ? 'INMOBILIARIA'
                      : 'EMPRESA'}
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
                      onNavigate?.();
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

        {!collapsed && <div className="relative mx-3 mb-3">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input aria-label="Buscar en el menú" placeholder="Buscar módulo…" value={menuQuery} onChange={(event) => setMenuQuery(event.target.value)} className="h-11 w-full rounded-lg border bg-background pl-9 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          {menuQuery && <button type="button" aria-label="Limpiar búsqueda del menú" onClick={() => setMenuQuery('')} className="absolute right-0 top-0 grid h-11 w-9 place-items-center"><X className="h-4 w-4" aria-hidden="true" /></button>}
        </div>}
        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1" aria-label="Navegación del panel">
          {(isAgent || isAdmin) && (
            <GroupedNav
              area={activeArea}
              title={activeArea === 'admin'
                ? 'Administración'
                : context === 'broker'
                  ? 'Broker'
                  : planIsAgency
                    ? 'Inmobiliaria'
                    : 'Empresa'}
              groups={activeGroups}
            />
          )}


          {search && activeGroups.length === 0 && <p role="status" className="px-3 py-4 text-sm text-muted-foreground">No hay módulos con ese nombre en este espacio.</p>}
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
