import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { useSmartRedirect } from "@/hooks/useSmartRedirect";
import BuyerLayout from "@/components/layouts/BuyerLayout";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { PageLoader } from "./routeUtils";
import type { RouteAccess, RouteLayout } from "./routeManifest";

interface RouteGuardProps {
  access: RouteAccess;
  layout: RouteLayout;
}

const Denied = ({ title, cta, to }: { title: string; cta: string; to: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center p-8 max-w-md">
      <h1 className="text-2xl font-bold text-foreground mb-4">Acceso denegado</h1>
      <p className="text-muted-foreground mb-6">{title}</p>
      <a href={to} className="text-primary hover:underline">
        {cta}
      </a>
    </div>
  </div>
);

/**
 * Guard único de la plataforma: resuelve sesión, rol y layout en un solo
 * lugar. Se aplica como ruta padre por área, nunca por página.
 */
const RouteGuard = ({ access, layout }: RouteGuardProps) => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isAgent, isLoading: rolesLoading } = useSmartRedirect();

  const needsRoles = access === "agent" || access === "admin";

  if (access !== "public") {
    if (authLoading || (needsRoles && rolesLoading)) return <PageLoader />;

    if (!user) {
      return (
        <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />
      );
    }

    if (access === "admin" && !isAdmin) {
      return (
        <Denied
          title="No tienes permisos de administrador para acceder a esta sección."
          cta="Volver al inicio"
          to="/"
        />
      );
    }

    if (access === "agent" && !isAgent && !isAdmin) {
      return (
        <Denied
          title="Necesitas un perfil de asesor o inmobiliaria para acceder a esta sección."
          cta="Ver planes disponibles"
          to="/pricing"
        />
      );
    }
  }

  if (layout === "dashboard") {
    return (
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    );
  }

  if (layout === "buyer") {
    return (
      <BuyerLayout>
        <Outlet />
      </BuyerLayout>
    );
  }

  return <Outlet />;
};

export default RouteGuard;
