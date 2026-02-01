import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Logo from '@/components/brand/Logo';
import LogoIcon from '@/components/brand/LogoIcon';
import { ThemeToggle, ThemeToggleCompact } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';
import { 
  Menu, 
  Search,
  Heart,
  User,
  LogIn,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const StickyHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const publicNavigation = [
    { name: 'Explorar', href: '/explorar' },
    { name: 'Comparar', href: '/comparar' },
    { name: 'Proyectos', href: '/projects' },
  ];

  const authenticatedNavigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Mis Propiedades', href: '/inventory' },
  ];

  const navigation = user 
    ? [...publicNavigation, ...authenticatedNavigation]
    : [...publicNavigation, { name: 'Agentes', href: '/agentes' }, { name: 'Blog', href: '/blog' }];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled 
          ? "glass border-b border-border/50 shadow-lg shadow-black/5" 
          : "bg-transparent"
      )}
    >
      <div className="container px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
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
                  "px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus-ring",
                  isActive(item.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              asChild 
              className="text-muted-foreground hover:text-foreground focus-ring"
            >
              <Link to="/explorar">
                <Search className="h-5 w-5" />
              </Link>
            </Button>
            
            {user && (
              <Button 
                variant="ghost" 
                size="icon" 
                asChild 
                className="text-muted-foreground hover:text-foreground focus-ring"
              >
                <Link to="/favoritos">
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>
            )}

            <ThemeToggle />

            <Button asChild className="btn-glow">
              <Link to="/publish">
                <Plus className="h-4 w-4 mr-2" />
                Publicar
              </Link>
            </Button>

            {user ? (
              <Button 
                variant="ghost" 
                size="icon" 
                asChild 
                className="text-muted-foreground hover:text-foreground focus-ring"
              >
                <Link to="/profile">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
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
            
            <Button asChild size="sm" className="btn-glow">
              <Link to="/publish">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="touch-target">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[85vw] max-w-[320px] bg-background border-border p-0"
              >
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <LogoIcon size="sm" />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="touch-target"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex flex-col p-4">
                  {/* Mobile Navigation */}
                  <nav className="flex flex-col gap-1 mb-6">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "px-4 py-3.5 text-base font-medium rounded-xl transition-colors touch-target",
                          isActive(item.href)
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile Actions */}
                  <div className="flex flex-col gap-2 pt-4 border-t border-border">
                    {user ? (
                      <>
                        <Button 
                          variant="ghost" 
                          asChild 
                          className="justify-start h-12 touch-target"
                        >
                          <Link to="/favoritos" onClick={() => setIsMobileMenuOpen(false)}>
                            <Heart className="h-5 w-5 mr-3" />
                            Mis Favoritos
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          asChild 
                          className="justify-start h-12 touch-target"
                        >
                          <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                            <User className="h-5 w-5 mr-3" />
                            Mi Dashboard
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="justify-start h-12 text-destructive touch-target"
                          onClick={() => {
                            signOut();
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Cerrar Sesión
                        </Button>
                      </>
                    ) : (
                      <Button 
                        asChild 
                        className="w-full h-12 touch-target"
                      >
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
