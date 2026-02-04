import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/brand/Logo';
import LogoIcon from '@/components/brand/LogoIcon';
import { useCurrentPlan, PLAN_DETAILS } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { 
  MapPin, 
  Search, 
  Heart,
  LayoutDashboard,
  Building2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  BarChart3,
  UserCircle,
  Lock,
  Crown
} from 'lucide-react';

interface ModernSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const ModernSidebar = ({ collapsed = false, onToggle }: ModernSidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const { plan, isPremium, isLoading } = useCurrentPlan();

  const planDetails = PLAN_DETAILS[plan];

  const mainNavigation = [
    { name: 'Explorar Mapa', href: '/', icon: MapPin, premium: false },
    { name: 'Búsqueda IA', href: '/search', icon: Search, premium: false },
    { name: 'Herramientas IA', href: '/tools', icon: Sparkles, premium: false },
    { name: 'Mis Favoritos', href: '/favorites', icon: Heart, premium: false, requireAuth: true },
  ];

  const managementNavigation = [
    { name: 'Mi Dashboard', href: '/dashboard', icon: LayoutDashboard, premium: true },
    { name: 'Mis Propiedades', href: '/inventory', icon: Building2, premium: true },
    { name: 'CRM Leads', href: '/leads', icon: Users, premium: true },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, premium: true },
  ];

  const bottomNavigation = [
    { name: 'Mi Perfil', href: '/profile', icon: UserCircle, premium: false, requireAuth: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item }: { item: { name: string; href: string; icon: React.ComponentType<{ className?: string }>; premium: boolean; requireAuth?: boolean } }) => {
    const isLocked = item.premium && !isPremium && user;
    const needsAuth = item.requireAuth && !user;
    
    // If premium locked, show as disabled
    if (isLocked) {
      return (
        <div
          className={`
            flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150
            text-muted-foreground/50 cursor-not-allowed
            ${collapsed ? 'justify-center' : 'justify-between'}
          `}
          title={collapsed ? `${item.name} (Premium)` : undefined}
        >
          <div className={`flex items-center ${collapsed ? '' : ''}`}>
            <item.icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
            {!collapsed && <span>{item.name}</span>}
          </div>
          {!collapsed && <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />}
        </div>
      );
    }

    return (
      <Link
        to={needsAuth ? `/auth?redirect=${encodeURIComponent(item.href)}` : item.href}
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
  };

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

        {/* Main Navigation */}
        <nav className="space-y-1">
          {mainNavigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        <Separator className="my-4" />

        {/* Management Navigation - Premium Section */}
        {!collapsed && (
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Gestión
            </span>
            {!isPremium && user && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                <Lock className="h-2.5 w-2.5 mr-0.5" />
                PRO
              </Badge>
            )}
          </div>
        )}
        <nav className="space-y-1">
          {managementNavigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Plan Badge */}
        {user && !collapsed && (
          <div className="mb-3">
            <Link
              to={isPremium ? '/subscription' : '/pricing'}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Crown className={`h-4 w-4 ${isPremium ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {isLoading ? 'Cargando...' : planDetails.name}
                </p>
                {!isPremium && (
                  <p className="text-[10px] text-muted-foreground">
                    Ver planes premium
                  </p>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* Upgrade CTA for free users */}
        {user && !isPremium && !collapsed && (
          <Link
            to="/pricing"
            className="mb-3 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Sparkles className="h-4 w-4" />
            Obtener Premium
          </Link>
        )}

        {/* Bottom Navigation */}
        <Separator className="my-2" />
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
