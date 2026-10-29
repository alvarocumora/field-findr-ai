import WorkspaceBreadcrumbs from '@/components/dashboard/WorkspaceBreadcrumbs';
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSmartRedirect } from '@/hooks/useSmartRedirect';
import ModernSidebar from '@/components/ModernSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'agent' | 'admin';
}

const DashboardLayout = ({ children, requiredRole }: DashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isAgent, isLoading: rolesLoading } = useSmartRedirect();

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-6">
            No tienes permisos de administrador para acceder a esta sección.
          </p>
          <a href="/" className="text-primary hover:underline">Volver al inicio</a>
        </div>
      </div>
    );
  }

  if (requiredRole === 'agent' && !isAgent && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-6">
            Necesitas un perfil de asesor para acceder a esta sección.
          </p>
          <a href="/pricing" className="text-primary hover:underline">Ver planes disponibles</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Keep the legacy sidebar's styling isolated while dashboard content adopts Rural Institutional. */}
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <ModernSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar via Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="theme-rural w-[min(88vw,19rem)] max-w-[19rem] overflow-hidden border-border bg-background p-0 text-foreground">
          <SheetTitle className="sr-only">Navegación del panel</SheetTitle>
          <ModernSidebar mobile onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className={`theme-rural min-w-0 flex-1 bg-background text-foreground transition-all duration-200 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        {/* Mobile Header */}
        <div className="sticky top-0 z-sticky flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú del panel"
            className="min-h-11 min-w-11"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
          <Link to="/panel" className="font-editorial text-lg font-medium text-foreground focus-ring" aria-label="Ir a mi espacio de trabajo">OfertaTerrenos</Link>
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Panel de gestión</span>
        </div>

        <div className="mx-auto w-full max-w-[1680px] p-4 md:p-6 lg:p-8">
          <WorkspaceBreadcrumbs />
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
