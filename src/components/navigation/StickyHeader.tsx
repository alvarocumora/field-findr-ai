import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Logo from '@/components/brand/Logo';
import LogoIcon from '@/components/brand/LogoIcon';
import { ThemeToggle, ThemeToggleCompact } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';
import {
  Menu,
  Search,
  Heart,
  LogIn,
  Plus,
  X,
  Settings,
  LayoutDashboard,
  Building2,
  LogOut,
  ShieldCheck,
  Home,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSmartRedirect } from '@/hooks/useSmartRedirect';
import NotificationBell from '@/components/notifications/NotificationBell';

const StickyHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin, isAgent, getRedirectPath } = useSmartRedirect();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const publicNavigation = [
    { name: 'Buscar Terrenos', href: '/explorar' },
    { name: 'Oportunidades', href: '/oportunidades' },
    { name: 'Publicar', href: '/auth?role=agent' },
    { name: 'Corredores', href: '/pricing' },
    { name: 'Planes Loteos', href: '/planes-loteos', badge: 'B2B' },
    { name: 'Blog', href: '/blog' },
  ];

  // Contextual nav items based on role
  const roleNavigation = isAdmin
    ? [{ name: 'Panel Admin', href: '/admin/dashboard' }]
    : isAgent
      ? [{ name: 'Mi Dashboard', href: '/asesor/dashboard' }]
      : user
        ? [{ name: 'Mi Terreno', href: '/mi-terreno' }]
        : [];

  const navigation = [...publicNavigation, ...roleNavigation];
  const isActive = (path: string) => location.pathname === path;

  // Dropdown items based on role
  const getDropdownItems = () => {
    const items = [];

    if (isAdmin) {
      items.push({ label: 'Panel Admin', href: '/admin/dashboard', icon: ShieldCheck });
      items.push({ label: 'Usuarios', href: '/admin/users', icon: LayoutDashboard });
    }

    if (isAgent || isAdmin) {
      items.push({ label: 'Mi Dashboard', href: '/asesor/dashboard', icon: LayoutDashboard });
      items.push({ label: 'Mis Propiedades', href: '/asesor/listings', icon: Building2 });
    }

    if (!isAgent && !isAdmin) {
      items.push({ label: 'Mi Terreno', href: '/mi-terreno', icon: Home });
      items.push({ label: 'Mis Favoritos', href: '/favoritos', icon: Heart });
    }

    items.push({ label: 'Configuración', href: '/profile', icon: Settings });
    return items;
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-header transition-all duration-300",
        isScrolled
          ? "glass border-b border-border/50 shadow-lg shadow-black/5"
          : "bg-transparent"
      )}
    >
      <div className="container px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="group flex-shrink-0 focus-ring rounded-lg">
            <Logo size="md" className="hidden sm:flex" />
            <LogoIcon size="md" className="sm:hidden" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus-ring relative",
                  isActive(item.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {item.name}
                {'badge' in item && (item as any).badge && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-primary text-primary-foreground">
                    {(item as any).badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground focus-ring">
              <Link to="/explorar"><Search className="h-5 w-5" /></Link>
            </Button>

            {user && !isAgent && !isAdmin && (
              <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground focus-ring">
                <Link to="/favoritos"><Heart className="h-5 w-5" /></Link>
              </Button>
            )}

            <ThemeToggle />

            {user && <NotificationBell />}

            {(isAgent || isAdmin) && (
              <Button asChild className="btn-glow">
                <Link to="/publish">
                  <Plus className="h-4 w-4 mr-2" />
                  Publicar
                </Link>
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground focus-ring rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg z-modal">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.user_metadata?.first_name || 'Usuario'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {getDropdownItems().map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link to={item.href} className="flex items-center cursor-pointer">
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" asChild className="border-border focus-ring">
                <Link to="/auth">
                  <LogIn className="h-4 w-4 mr-2" />
                  Ingresar
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggleCompact />

            {(isAgent || isAdmin) && (
              <Button asChild size="sm" className="btn-glow">
                <Link to="/publish"><Plus className="h-4 w-4" /></Link>
              </Button>
            )}

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="touch-target">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-[320px] bg-background border-border p-0">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <LogoIcon size="sm" />
                  <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} className="touch-target">
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex flex-col p-4">
                  <nav className="flex flex-col gap-1 mb-6">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "px-4 py-3.5 text-base font-medium rounded-xl transition-colors touch-target relative",
                          isActive(item.href)
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {item.name}
                        {'badge' in item && (item as any).badge && (
                          <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                            {(item as any).badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </nav>

                  <div className="flex flex-col gap-2 pt-4 border-t border-border">
                    {user ? (
                      <>
                        {getDropdownItems().map((item) => (
                          <Button key={item.href} variant="ghost" asChild className="justify-start h-12 touch-target">
                            <Link to={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                              <item.icon className="h-5 w-5 mr-3" />
                              {item.label}
                            </Link>
                          </Button>
                        ))}
                        <Button
                          variant="ghost"
                          className="justify-start h-12 text-destructive touch-target"
                          onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                        >
                          Cerrar Sesión
                        </Button>
                      </>
                    ) : (
                      <Button asChild className="w-full h-12 touch-target">
                        <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                          <LogIn className="h-5 w-5 mr-2" />
                          Ingresar
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StickyHeader;
