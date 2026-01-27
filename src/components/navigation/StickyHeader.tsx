import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Logo from '@/components/brand/Logo';
import LogoIcon from '@/components/brand/LogoIcon';
import { 
  Menu, 
  Search,
  Heart,
  User,
  LogIn,
  Plus
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
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'Explorar', href: '/explorar' },
    { name: 'Comparar', href: '/comparar' },
    { name: 'Proyectos', href: '/projects' },
    { name: 'Agentes', href: '/agentes' },
    { name: 'Empresas', href: '/empresas' },
    { name: 'Blog', href: '/blog' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header 
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${isScrolled 
          ? 'glass border-b border-white/10 shadow-lg shadow-black/10' 
          : 'bg-transparent'
        }
      `}
    >
      <div className="container px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="group">
            <Logo size="md" className="hidden sm:flex" />
            <LogoIcon size="md" className="sm:hidden" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isActive(item.href)
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }
                `}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
              <Link to="/explorar">
                <Search className="h-5 w-5" />
              </Link>
            </Button>
            
            {user && (
              <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
                <Link to="/favoritos">
                  <Heart className="h-5 w-5" />
                </Link>
              </Button>
            )}

            <Button asChild className="btn-glow">
              <Link to="/publish">
                <Plus className="h-4 w-4 mr-2" />
                Publicar
              </Link>
            </Button>

            {user ? (
              <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
                <Link to="/profile">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild className="glass border-white/10">
                <Link to="/auth">
                  <LogIn className="h-4 w-4 mr-2" />
                  Ingresar
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex lg:hidden items-center gap-2">
            <Button asChild size="sm" className="btn-glow">
              <Link to="/publish">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 glass border-white/10">
                <div className="flex flex-col gap-6 mt-8">
                  {/* Mobile Navigation */}
                  <nav className="flex flex-col gap-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`
                          px-4 py-3 text-base font-medium rounded-lg transition-colors
                          ${isActive(item.href)
                            ? 'text-primary bg-primary/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                          }
                        `}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile Actions */}
                  <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                    {user ? (
                      <>
                        <Button variant="ghost" asChild className="justify-start">
                          <Link to="/favoritos" onClick={() => setIsMobileMenuOpen(false)}>
                            <Heart className="h-4 w-4 mr-3" />
                            Mis Favoritos
                          </Link>
                        </Button>
                        <Button variant="ghost" asChild className="justify-start">
                          <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                            <User className="h-4 w-4 mr-3" />
                            Mi Dashboard
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="justify-start text-destructive"
                          onClick={() => {
                            signOut();
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Cerrar Sesión
                        </Button>
                      </>
                    ) : (
                      <Button asChild className="w-full">
                        <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                          <LogIn className="h-4 w-4 mr-2" />
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
