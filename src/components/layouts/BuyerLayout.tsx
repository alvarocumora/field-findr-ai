import { useState } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useIsAdmin, useIsAgent } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Home, Heart, MapPin, Bell, User, Settings, LogOut, Menu, Search, ChevronLeft,
} from 'lucide-react';

interface BuyerLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/comprador/inicio', label: 'Inicio', icon: Home },
  { href: '/explorar', label: 'Explorar', icon: Search },
  { href: '/favoritos', label: 'Favoritos', icon: Heart },
  { href: '/mi-terreno', label: 'Mi Terreno', icon: MapPin },
  { href: '/alertas', label: 'Alertas', icon: Bell },
  { href: '/perfil', label: 'Mi Perfil', icon: User },
];

const BuyerSidebar = ({ collapsed, onClose }: { collapsed?: boolean; onClose?: () => void }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const isAdmin = useIsAdmin();
  const isAgent = useIsAgent();
  // Esta pantalla de perfil es compartida por todos los roles (el menú
  // global siempre lleva a /perfil) — mostrar "Comprador" a un asesor o
  // admin era confuso sobre qué cuenta estaba editando (G12).
  const accountTypeLabel = isAdmin ? 'Administrador' : isAgent ? 'Corredor / Asesor' : 'Comprador';

  const initials = profile
    ? `${(profile.first_name || '')[0] || ''}${(profile.last_name || '')[0] || ''}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="h-full flex flex-col bg-card border-r border-border w-60">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          {!collapsed && (
            <span className="font-bold text-sm tracking-tight">
              OFERTA<span className="text-primary">TERRENOS</span>
            </span>
          )}
        </Link>
      </div>

      {/* User */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {profile?.first_name || 'Usuario'}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{accountTypeLabel}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border/50 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al sitio
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

const BuyerLayout = ({ children }: BuyerLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <BuyerSidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-60">
          <BuyerSidebar onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <main className="flex-1 md:ml-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center h-14 px-4 border-b border-border bg-background sticky top-0 z-30">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-3 font-bold text-sm">Mi Panel</span>
        </div>

        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default BuyerLayout;
