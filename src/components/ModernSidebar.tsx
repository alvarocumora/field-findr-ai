import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/brand/Logo';
import LogoIcon from '@/components/brand/LogoIcon';
import { useSmartRedirect } from '@/hooks/useSmartRedirect';
import { useSidebarCounts } from '@/hooks/useSidebarCounts';
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

// Core items always visible
const coreItems: NavItem[] = [
  { name: 'Dashboard', href: '/asesor/dashboard', icon: LayoutDashboard },
  { name: 'Oportunidades', href: '/asesor/opportunities', icon: Target },
  { name: 'Pipeline', href: '/asesor/pipeline', icon: Workflow },
  { name: 'Contactos CRM', href: '/asesor/contacts', icon: Users },
  { name: 'Proyectos', href: '/asesor/projects', icon: FolderKanban },
  { name: 'Lotes', href: '/asesor/lots', icon: Grid3X3 },
  { name: 'Control Loteo', href: '/asesor/loteos', icon: Gauge },
  { name: 'Estudio de Loteo', href: '/asesor/subdivision', icon: Grid3X3 },
  { name: 'Reservas', href: '/asesor/reservations', icon: CalendarCheck },
  { name: 'Reportes', href: '/asesor/reports', icon: FileBarChart },
];

// Advanced items collapsed by default
const advancedItems: NavItem[] = [
  { name: 'Pagos', href: '/asesor/payments', icon: DollarSign },
  { name: 'Créditos', href: '/asesor/credits', icon: CreditCard },
  { name: 'Cierres', href: '/asesor/closing', icon: Scale },
  { name: 'Ventas', href: '/asesor/sales', icon: Handshake },
  { name: 'Comisiones', href: '/asesor/comisiones', icon: DollarSign },
  { name: 'Financiero', href: '/asesor/financial', icon: TrendingUp },
  { name: 'Multi-Proyecto', href: '/asesor/multi-project', icon: BarChart3 },
  { name: 'Rendimiento', href: '/asesor/performance', icon: Target },
  { name: 'Ejecutivo', href: '/asesor/executive', icon: PieChart },
  { name: 'Demanda', href: '/asesor/demand', icon: Flame },
  { name: 'Propiedades', href: '/asesor/listings', icon: Building2 },
  { name: 'Mensajes', href: '/asesor/messages', icon: MessageSquare },
  { name: 'Documentos', href: '/asesor/documents', icon: FileBarChart },
  { name: 'Notificaciones', href: '/asesor/notifications', icon: Bell },
];

const adminItems: NavItem[] = [
  { name: 'Panel Admin', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Financiero', href: '/admin/financial', icon: TrendingUp },
  { name: 'Usuarios', href: '/admin/users', icon: Users },
  { name: 'Agentes', href: '/admin/agents', icon: ShieldCheck },
  { name: 'Proyectos', href: '/admin/projects', icon: FolderKanban },
  { name: 'Destacados', href: '/admin/featured', icon: Sparkles },
  { name: 'Documentos', href: '/admin/documents', icon: ClipboardCheck },
  { name: 'Reservas', href: '/admin/reservations', icon: CalendarCheck },
  { name: 'Aprobaciones', href: '/admin/approvals', icon: ClipboardCheck },
  { name: 'Aprobación Loteos', href: '/admin/project-approvals', icon: ClipboardCheck },
  { name: 'Créditos', href: '/admin/credits', icon: CreditCard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Auditoría', href: '/admin/audit', icon: ShieldCheck },
];

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
  const counts = useSidebarCounts();

  const isActive = (path: string) => location.pathname === path;
  const advancedHasActive = advancedItems.some(i => isActive(i.href));
  const [advancedOpen, setAdvancedOpen] = useState(advancedHasActive);

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
              {isAdmin ? 'ADMIN' : 'PRO'}
            </Badge>
          </div>
        )}

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {/* Admin section */}
          {isAdmin && (
            <>
              {!collapsed && (
                <span className="block px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Admin
                </span>
              )}
              <div className="space-y-0.5">
                {adminItems.map((item) => (
                  <NavItemRow key={item.href} item={item} />
                ))}
              </div>
              <Separator className="my-2" />
            </>
          )}

          {/* Agent Core */}
          {(isAgent || isAdmin) && (
            <>
              {!collapsed && (
                <span className="block px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Principal
                </span>
              )}
              <div className="space-y-0.5">
                {coreItems.map((item) => (
                  <NavItemRow key={item.href} item={item} />
                ))}
              </div>

              {/* Advanced - collapsed by default */}
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
                    {advancedItems.map((item) => (
                      <NavItemRow key={item.href} item={item} />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <div className="space-y-0.5">
                  {advancedItems.map((item) => (
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
