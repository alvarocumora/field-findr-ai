import { useUserRoles } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';

export const useSmartRedirect = () => {
  const { user } = useAuth();
  const { data: roles = [], isLoading, isError, refetch: refetchRoles } = useUserRoles();

  const getRedirectPath = (fallback?: string): string => {
    if (!user) return '/auth';
    if (fallback) return fallback;

    // Context resolution belongs to /panel. Keeping the helper as a
    // compatibility facade avoids reintroducing a fixed admin > agent > buyer
    // priority in callers that still use getRedirectPath().
    return roles.length > 0 ? '/panel' : '/explorar';
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
    isError,
    roles,
    refetchRoles,
  };
};
