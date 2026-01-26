import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Search, 
  Heart,
  LayoutDashboard,
  Building2,
  ChevronLeft,
  ChevronRight,
  Mountain,
  Sparkles,
  Users,
  BarChart3,
  UserCircle
} from 'lucide-react';

interface ModernSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const ModernSidebar = ({ collapsed = false, onToggle }: ModernSidebarProps) => {
  const location = useLocation();

  const mainNavigation = [
    { name: 'Explorar Mapa', href: '/', icon: MapPin },
    { name: 'Búsqueda IA', href: '/search', icon: Search },
    { name: 'Herramientas IA', href: '/tools', icon: Sparkles },
    { name: 'Mis Favoritos', href: '/favorites', icon: Heart },
  ];

  const managementNavigation = [
    { name: 'Mi Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Mis Propiedades', href: '/inventory', icon: Building2 },
    { name: 'CRM Leads', href: '/leads', icon: Users },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  const bottomNavigation = [
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

  return (
    <aside className={`
      fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-200 z-40
      ${collapsed ? 'w-16' : 'w-60'}
    `}>
      <div className="flex flex-col h-full p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 px-1">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Mountain className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-base font-semibold text-foreground">Ofertaterrenos</span>
            </Link>
          )}
          
          {collapsed && (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <Mountain className="h-4 w-4 text-primary-foreground" />
            </div>
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

        {/* Main Navigation */}
        <nav className="space-y-1">
          {mainNavigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        <Separator className="my-4" />

        {/* Management Navigation */}
        <nav className="space-y-1">
          {managementNavigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Navigation */}
        <Separator className="my-4" />
        <nav className="space-y-1">
          {bottomNavigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default ModernSidebar;
