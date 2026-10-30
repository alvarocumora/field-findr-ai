import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { buildAuthRedirect } from "@/lib/access/authReturn";

import { useAuth } from "@/hooks/useAuth";
import { useSmartRedirect } from "@/hooks/useSmartRedirect";
import BuyerLayout from "@/components/layouts/BuyerLayout";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ExecutiveTodayPanel from "@/components/executive/ExecutiveTodayPanel";
import ExecutiveCommercialDesk from "@/components/executive/ExecutiveCommercialDesk";
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
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to={to} className="min-h-11 inline-flex items-center rounded-xl border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-ring">
          {cta}
        </Link>
        <Link to="/panel" className="min-h-11 inline-flex items-center rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground focus-ring">
          Ir a mi espacio de trabajo
        </Link>
      </div>
    </div>
  </div>
);

// Un fallo al verificar roles no es lo mismo que no tener el rol: no debe
// mostrarse como denegación permanente ni dejar pasar a la sección protegida.
const VerificationError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-background" role="alert">
    <div className="text-center p-8 max-w-md">
      <h1 className="text-2xl font-bold text-foreground mb-4">No pudimos verificar tus permisos</h1>
      <p className="text-muted-foreground mb-6">
        Es un problema de conexión, no una denegación de acceso. Vuelve a intentarlo.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-11 inline-flex items-center rounded-xl border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-ring"
      >
        Reintentar
      </button>
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
  const { isAdmin, isAgent, isLoading: rolesLoading, isError: rolesError, refetchRoles } = useSmartRedirect();

  const needsRoles = access === "agent" || access === "admin";

  if (access !== "public") {
    if (authLoading || (needsRoles && rolesLoading)) return <PageLoader />;

    if (!user) {
      return (
        <Navigate to={buildAuthRedirect(location.pathname, location.search, location.hash)} replace />
      );
    }

    if (needsRoles && rolesError) {
      return <VerificationError onRetry={() => void refetchRoles()} />;
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
        {location.pathname === "/asesor/executive" && (
          <div className="space-y-4 px-4 pt-4 sm:px-6 sm:pt-6">
            <ExecutiveTodayPanel />
            <ExecutiveCommercialDesk />
          </div>
        )}
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
