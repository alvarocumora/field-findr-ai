import { useUserRoles } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';

export const useSmartRedirect = () => {
  const { user } = useAuth();
  const { data: roles = [], isLoading } = useUserRoles();

  const getRedirectPath = (fallback?: string): string => {
    if (!user) return '/auth';
    if (fallback) return fallback;

    const roleNames = roles.map(r => r.role);

    if (roleNames.includes('admin')) return '/admin/dashboard';
    if (roleNames.includes('agent')) return '/asesor/dashboard';
    if (roleNames.includes('buyer')) return '/buyer/home';
    return '/explorar';
  };

  const isAdmin = roles.some(r => r.role === 'admin');
  const isAgent = roles.some(r => r.role === 'agent');
  const isBuyer = roles.some(r => r.role === 'buyer');

  return {
    getRedirectPath,
    isAdmin,
    isAgent,
    isBuyer,
    isLoading,
    roles,
  };
};
