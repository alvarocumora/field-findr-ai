import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/brand/Logo';
import LogoIcon from '@/components/brand/LogoIcon';
import { useSmartRedirect } from '@/hooks/useSmartRedirect';
import { useSidebarCounts } from '@/hooks/useSidebarCounts';
import { useCurrentPlan } from '@/hooks/useSubscription';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  MapPin,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  BarChart3,
  UserCircle,
  FolderKanban,
  Grid3X3,
  Handshake,
  ShieldCheck,
  TrendingUp,
  FileBarChart,
  CreditCard,
  Scale,
  ClipboardCheck,
  MessageSquare,
  Globe,
  PieChart,
  Target,
  Workflow,
  DollarSign,
  Bell,
  Flame,
  Gauge,
  Code,
  Building2,
  CalendarCheck,
  MoreHorizontal,
  Sparkles,
  Heart,
  Home,
  LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface ModernSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

// ---- Navegación del CORREDOR / agente individual ----
// Enfoque en venta directa; sin analítica de agencia ni multi-proyecto.
const corredorCore: NavItem[] = [
  { name: 'Dashboard', href: '/asesor/dashboard', icon: LayoutDashboard },
  { name: 'Oportunidades', href: '/asesor/opportunities', icon: Target },
  { name: 'Pipeline', href: '/asesor/pipeline', icon: Workflow },
  { name: 'Contactos CRM', href: '/asesor/contacts', icon: Users },
  { name: 'Propiedades', href: '/asesor/listings', icon: Building2 },
  { name: 'Proyectos', href: '/asesor/projects', icon: FolderKanban },
  { name: 'Lotes', href: '/asesor/lots', icon: Grid3X3 },
  { name: 'Reservas', href: '/asesor/reservations', icon: CalendarCheck },
];

const corredorMore: NavItem[] = [
  { name: 'Control Loteo', href: '/asesor/loteos', icon: Gauge },
  { name: 'Estudio de Loteo', href: '/asesor/subdivision', icon: Grid3X3 },
  { name: 'Pagos', href: '/asesor/payments', icon: DollarSign },
  { name: 'Créditos', href: '/asesor/credits', icon: CreditCard },
  { name: 'Cierres', href: '/asesor/closing', icon: Scale },
  { name: 'Ventas', href: '/asesor/sales', icon: Handshake },
  { name: 'Comisiones', href: '/asesor/comisiones', icon: DollarSign },
  { name: 'Financiero', href: '/asesor/financial', icon: TrendingUp },
  { name: 'Reportes', href: '/asesor/reports', icon: FileBarChart },
  { name: 'Mensajes', href: '/asesor/messages', icon: MessageSquare },
  { name: 'Notificaciones', href: '/asesor/notifications', icon: Bell },
];

interface NavGroup {
  label: string;
  items: NavItem[];
}

// Panel principal del admin, siempre visible en la parte superior.
const adminDashboard: NavItem = { name: 'Panel Admin', href: '/admin/dashboard', icon: LayoutDashboard };

// Resto de herramientas admin agrupadas por función para no ser una lista plana.
const adminGroups: NavGroup[] = [
  {
    label: 'Gestión',
    items: [
      { name: 'Usuarios', href: '/admin/users', icon: Users },
      { name: 'Agentes', href: '/admin/agents', icon: ShieldCheck },
      { name: 'Proyectos', href: '/admin/projects', icon: FolderKanban },
      { name: 'Destacados', href: '/admin/featured', icon: Sparkles },
      { name: 'Leads Comerciales', href: '/admin/commercial-leads', icon: Handshake },
      { name: 'Reservas', href: '/admin/reservations', icon: CalendarCheck },
      { name: 'Documentos', href: '/admin/documents', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Aprobaciones',
    items: [
      { name: 'Propiedades', href: '/admin/approvals', icon: ClipboardCheck },
      { name: 'Loteos', href: '/admin/project-approvals', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { name: 'Financiero', href: '/admin/financial', icon: TrendingUp },
      { name: 'Créditos', href: '/admin/credits', icon: CreditCard },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { name: 'Auditoría', href: '/admin/audit', icon: ShieldCheck },
    ],
  },
];

// Lista plana (usada cuando la barra está colapsada a solo iconos).
const allAdminItems: NavItem[] = [adminDashboard, ...adminGroups.flatMap((g) => g.items)];

// ---- Panel interno de la INMOBILIARIA (planes inmobiliaria/grupo/enterprise) ----
// Dashboard de agencia + herramientas agrupadas por área de la operación.
const inmobiliariaDashboard: NavItem = { name: 'Dashboard', href: '/asesor/dashboard', icon: LayoutDashboard };

const inmobiliariaGroups: NavGroup[] = [
  {
    label: 'Proyectos',
    items: [
      { name: 'Proyectos', href: '/asesor/projects', icon: FolderKanban },
      { name: 'Multi-Proyecto', href: '/asesor/multi-project', icon: BarChart3 },
      { name: 'Lotes', href: '/asesor/lots', icon: Grid3X3 },
      { name: 'Control Loteo', href: '/asesor/loteos', icon: Gauge },
      { name: 'Estudio de Loteo', href: '/asesor/subdivision', icon: Grid3X3 },
    ],
  },
  {
    label: 'Ventas & Reservas',
    items: [
      { name: 'Oportunidades', href: '/asesor/opportunities', icon: Target },
      { name: 'Pipeline', href: '/asesor/pipeline', icon: Workflow },
      { name: 'Reservas', href: '/asesor/reservations', icon: CalendarCheck },
      { name: 'Ventas', href: '/asesor/sales', icon: Handshake },
      { name: 'Cierres & Legal', href: '/asesor/closing', icon: Scale },
      { name: 'Comisiones', href: '/asesor/comisiones', icon: DollarSign },
    ],
  },
  {
    label: 'Clientes',
    items: [
      { name: 'Contactos CRM', href: '/asesor/contacts', icon: Users },
      { name: 'Propiedades', href: '/asesor/listings', icon: Building2 },
      { name: 'Mensajes', href: '/asesor/messages', icon: MessageSquare },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { name: 'Financiero', href: '/asesor/financial', icon: TrendingUp },
      { name: 'Pagos', href: '/asesor/payments', icon: DollarSign },
      { name: 'Créditos', href: '/asesor/credits', icon: CreditCard },
      { name: 'Ejecutivo', href: '/asesor/executive', icon: PieChart },
      { name: 'Demanda', href: '/asesor/demand', icon: Flame },
    ],
  },
  {
    label: 'Equipo & Reportes',
    items: [
      { name: 'Rendimiento', href: '/asesor/performance', icon: Target },
      { name: 'Reportes', href: '/asesor/reports', icon: FileBarChart },
      { name: 'Notificaciones', href: '/asesor/notifications', icon: Bell },
    ],
  },
];

const allInmobiliariaItems: NavItem[] = [inmobiliariaDashboard, ...inmobiliariaGroups.flatMap((g) => g.items)];

const commonNavigation: NavItem[] = [
  { name: 'Explorar Mapa', href: '/explorar', icon: MapPin },
  { name: 'Herramientas IA', href: '/tools', icon: Sparkles },
  { name: 'Favoritos', href: '/favoritos', icon: Heart },
  { name: 'Mi Terreno', href: '/mi-terreno', icon: Home },
  { name: 'Mi Perfil', href: '/profile', icon: UserCircle },
];

const ModernSidebar = ({ collapsed = false, onToggle }: ModernSidebarProps) => {
  const location = useLocation();
  const { isAdmin, isAgent } = useSmartRedirect();
  const { plan } = useCurrentPlan();
  const counts = useSidebarCounts();

  // Planes de inmobiliaria/desarrolladora → panel interno completo.
  // El resto de asesores (corredor/corredora/gratis) → vista de corredor.
  const planIsAgency = plan === 'inmobiliaria' || plan === 'grupo' || plan === 'enterprise';

  const isActive = (path: string) => location.pathname === path;
  const advancedHasActive = corredorMore.some(i => isActive(i.href));
  const [advancedOpen, setAdvancedOpen] = useState(advancedHasActive);

  // Grupos colapsables (admin + inmobiliaria): abren el grupo de la ruta activa.
  // Clave con prefijo para que "Finanzas" de admin no colisione con la de inmobiliaria.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const open = new Set<string>();
    adminGroups.forEach((g) => {
      if (g.items.some((i) => location.pathname === i.href)) open.add(`admin:${g.label}`);
    });
    inmobiliariaGroups.forEach((g) => {
      if (g.items.some((i) => location.pathname === i.href)) open.add(`inmo:${g.label}`);
    });
    return open;
  });
  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const badgeMap: Record<string, number> = {
    '/asesor/reservations': counts.pendingReservations,
    '/asesor/leads': counts.newLeads,
    '/asesor/credits': counts.overduePayments,
    '/admin/reservations': counts.pendingReservations,
  };

  const NavItemRow = ({ item }: { item: NavItem }) => {
    const badgeCount = badgeMap[item.href] || 0;
    return (
      <Link
        to={item.href}
        className={cn(
          'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150',
          isActive(item.href)
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          collapsed ? 'justify-center' : 'justify-start'
        )}
        title={collapsed ? item.name : undefined}
      >
        <item.icon className={cn('h-4.5 w-4.5 flex-shrink-0', !collapsed && 'mr-3')} />
        {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
        {!collapsed && badgeCount > 0 && (
          <Badge variant="destructive" className="ml-auto text-[10px] h-5 min-w-[20px] px-1.5 flex items-center justify-center">
            {badgeCount}
          </Badge>
        )}
        {collapsed && badgeCount > 0 && (
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive" />
        )}
      </Link>
    );
  };

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-200 z-40',
      collapsed ? 'w-16' : 'w-60'
    )}>
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
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Role Badge */}
        {!collapsed && (isAdmin || isAgent) && (
          <div className="flex items-center justify-between px-4 mb-2">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {isAdmin ? 'ADMIN' : planIsAgency ? 'INMOBILIARIA' : 'CORREDOR'}
            </Badge>
          </div>
        )}

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {/* Admin section */}
          {isAdmin && (
            <>
              {!collapsed ? (
                <>
                  <span className="block px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Admin
                  </span>
                  {/* Panel principal siempre visible */}
                  <div className="space-y-0.5">
                    <NavItemRow item={adminDashboard} />
                  </div>
                  {/* Grupos colapsables */}
                  {adminGroups.map((group) => {
                    const key = `admin:${group.label}`;
                    const open = openGroups.has(key);
                    return (
                      <Collapsible
                        key={key}
                        open={open}
                        onOpenChange={() => toggleGroup(key)}
                      >
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-1.5 mt-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                          <span className="truncate">{group.label}</span>
                          <ChevronDown className={cn('h-3 w-3 flex-shrink-0 transition-transform', open && 'rotate-180')} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-0.5 mt-0.5">
                          {group.items.map((item) => (
                            <NavItemRow key={item.href} item={item} />
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </>
              ) : (
                // Colapsada: lista plana de iconos
                <div className="space-y-0.5">
                  {allAdminItems.map((item) => (
                    <NavItemRow key={item.href} item={item} />
                  ))}
                </div>
              )}
              <Separator className="my-2" />
            </>
          )}

          {/* Panel INMOBILIARIA (planes inmobiliaria/grupo/enterprise) */}
          {(isAgent || isAdmin) && planIsAgency && (
            <>
              {!collapsed ? (
                <>
                  <span className="block px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Inmobiliaria
                  </span>
                  <div className="space-y-0.5">
                    <NavItemRow item={inmobiliariaDashboard} />
                  </div>
                  {inmobiliariaGroups.map((group) => {
                    const key = `inmo:${group.label}`;
                    const open = openGroups.has(key);
                    return (
                      <Collapsible key={key} open={open} onOpenChange={() => toggleGroup(key)}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-1.5 mt-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                          <span className="truncate">{group.label}</span>
                          <ChevronDown className={cn('h-3 w-3 flex-shrink-0 transition-transform', open && 'rotate-180')} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-0.5 mt-0.5">
                          {group.items.map((item) => (
                            <NavItemRow key={item.href} item={item} />
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </>
              ) : (
                <div className="space-y-0.5">
                  {allInmobiliariaItems.map((item) => (
                    <NavItemRow key={item.href} item={item} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Vista CORREDOR / agente individual (planes corredor/corredora/gratis) */}
          {(isAgent || isAdmin) && !planIsAgency && (
            <>
              {!collapsed && (
                <span className="block px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Principal
                </span>
              )}
              <div className="space-y-0.5">
                {corredorCore.map((item) => (
                  <NavItemRow key={item.href} item={item} />
                ))}
              </div>

              {/* Más herramientas - colapsado por defecto */}
              {!collapsed ? (
                <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-1.5 mt-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                    <span className="flex items-center gap-1.5">
                      <MoreHorizontal className="h-3 w-3" />
                      Más herramientas
                    </span>
                    <ChevronDown className={cn('h-3 w-3 transition-transform', advancedOpen && 'rotate-180')} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-0.5 mt-0.5">
                    {corredorMore.map((item) => (
                      <NavItemRow key={item.href} item={item} />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <div className="space-y-0.5">
                  {corredorMore.map((item) => (
                    <div key={item.href} className="relative">
                      <NavItemRow item={item} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <Separator className="my-2" />

          {/* Common */}
          <div className="space-y-0.5">
            {commonNavigation.map((item) => (
              <NavItemRow key={item.href} item={item} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ModernSidebar;
