import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentPlan } from '@/hooks/useSubscription';
import { useUserRoles, AppRole } from '@/hooks/useUserRole';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requirePremium?: boolean;
  requireRole?: AppRole;
  redirectTo?: string;
}

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="space-y-4 w-full max-w-md p-8">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-1/2 mx-auto" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

const ProtectedRoute = ({
  children,
  requireAuth = true,
  requirePremium = false,
  requireRole,
  redirectTo,
}: ProtectedRouteProps) => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isPremium, isLoading: planLoading } = useCurrentPlan();
  const { data: roles = [], isLoading: rolesLoading } = useUserRoles();

  // Wait for auth + roles to load
  if (authLoading || (requireRole && rolesLoading) || (requirePremium && planLoading)) {
    return <LoadingFallback />;
  }

  if (requireAuth && !user) {
    const redirectPath = redirectTo || `/auth?redirect=${encodeURIComponent(location.pathname)}`;
    return <Navigate to={redirectPath} replace />;
  }

  if (requirePremium && !isPremium) {
    return <UpgradePrompt currentPath={location.pathname} />;
  }

  if (requireRole) {
    const hasRole = roles.some(r => r.role === requireRole);
    const isAdmin = roles.some(r => r.role === 'admin');
    if (!hasRole && !isAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8 max-w-md">
            <h1 className="text-2xl font-bold text-foreground mb-4">Acceso Denegado</h1>
            <p className="text-muted-foreground mb-6">
              No tienes los permisos necesarios para acceder a esta sección.
            </p>
            <a href="/" className="text-primary hover:underline">Volver al inicio</a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
