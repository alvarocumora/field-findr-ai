import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/brand/Logo';
import LogoIcon from '@/components/brand/LogoIcon';
import { useSmartRedirect } from '@/hooks/useSmartRedirect';
import {
  MapPin,
  LayoutDashboard,
  Building2,
  ChevronLeft,
  ChevronRight,
  Users,
  BarChart3,
  UserCircle,
  FolderKanban,
  Grid3X3,
  Handshake,
  ShieldCheck,
  TrendingUp,
  FileText,
} from 'lucide-react';

interface ModernSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const ModernSidebar = ({ collapsed = false, onToggle }: ModernSidebarProps) => {
  const location = useLocation();
  const { isAdmin, isAgent } = useSmartRedirect();

  // Agent navigation
  const agentNavigation = [
    { name: 'Dashboard', href: '/asesor/dashboard', icon: LayoutDashboard },
    { name: 'Mis Propiedades', href: '/asesor/listings', icon: Building2 },
    { name: 'Proyectos', href: '/asesor/projects', icon: FolderKanban },
    { name: 'Lotes', href: '/asesor/lots', icon: Grid3X3 },
    { name: 'CRM Leads', href: '/asesor/leads', icon: Users },
    { name: 'Ventas', href: '/asesor/sales', icon: Handshake },
    { name: 'Reservas', href: '/asesor/reservations', icon: FileText },
    { name: 'Analytics', href: '/asesor/analytics', icon: BarChart3 },
  ];

  // Admin navigation
  const adminNavigation = [
    { name: 'Panel Admin', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Usuarios', href: '/admin/users', icon: Users },
    { name: 'Agentes', href: '/admin/agents', icon: ShieldCheck },
    { name: 'Reservas', href: '/admin/reservations', icon: FileText },
    { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
  ];

  const commonNavigation = [
    { name: 'Explorar Mapa', href: '/explorar', icon: MapPin },
    { name: 'Mi Perfil', href: '/profile', icon: UserCircle },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item }: { item: { name: string; href: string; icon: React.ComponentType<{ className?: string }> } }) => (
    <Link
      to={item.href}
      className={`
        flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150
        ${isActive(item.href)
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }
        ${collapsed ? 'justify-center' : 'justify-start'}
      `}
      title={collapsed ? item.name : undefined}
    >
      <item.icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
      {!collapsed && <span>{item.name}</span>}
    </Link>
  );

  const primaryNav = isAdmin ? adminNavigation : isAgent ? agentNavigation : [];

  return (
    <aside className={`
      fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-200 z-40
      ${collapsed ? 'w-16' : 'w-60'}
    `}>
      <div className="flex flex-col h-full p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 px-1">
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

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={`mb-4 ${collapsed ? 'mx-auto' : 'ml-auto'} h-8 w-8 p-0`}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        {/* Role Section Label */}
        {!collapsed && primaryNav.length > 0 && (
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {isAdmin ? 'Administración' : 'Gestión'}
            </span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {isAdmin ? 'ADMIN' : 'PRO'}
            </Badge>
          </div>
        )}

        {/* Primary Navigation */}
        <nav className="space-y-1">
          {primaryNav.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>

        {/* Agent extras: if admin, also show agent section */}
        {isAdmin && (
          <>
            <Separator className="my-4" />
            {!collapsed && (
              <div className="px-3 mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Gestión Asesor
                </span>
              </div>
            )}
            <nav className="space-y-1">
              {agentNavigation.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </nav>
          </>
        )}

        <Separator className="my-4" />

        {/* Common Navigation */}
        <nav className="space-y-1">
          {commonNavigation.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />
      </div>
    </aside>
  );
};

export default ModernSidebar;
