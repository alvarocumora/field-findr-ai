import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import ModernSidebar from './ModernSidebar';
import AIFloatingButton from './AIFloatingButton';
import MobileBottomNav from './navigation/MobileBottomNav';
import Logo from '@/components/brand/Logo';
import { 
  Menu, 
  LogIn
} from 'lucide-react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Modern Sidebar - Desktop */}
      <div className="hidden md:block">
        <ModernSidebar 
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Link to="/">
              <Logo size="sm" />
            </Link>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Ingresar
              </Button>

              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-60 p-0">
                  <ModernSidebar collapsed={false} />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Minimal Footer */}
        <footer className="border-t bg-muted/30 py-4 pb-20 md:pb-4">
          <div className="container">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
              <p>© 2024 Ofertaterrenos.com</p>
              <div className="flex items-center gap-4">
                <Link to="/contacto" className="hover:text-foreground transition-colors">Contacto</Link>
                <Link to="/tools" className="hover:text-foreground transition-colors">Herramientas</Link>
                <span>Chile 🇨🇱</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* AI Floating Button - hidden on mobile (bottom nav takes precedence) */}
      <div className="hidden md:block">
        <AIFloatingButton />
      </div>
    </div>
  );
};

export default Layout;
