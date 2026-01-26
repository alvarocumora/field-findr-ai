import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AppRole = 'buyer' | 'agent' | 'admin';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export const useUserRoles = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!user,
  });
};

export const useHasRole = (role: AppRole) => {
  const { data: roles = [] } = useUserRoles();
  return roles.some(r => r.role === role);
};

export const useIsAgent = () => useHasRole('agent');
export const useIsAdmin = () => useHasRole('admin');
export const useIsBuyer = () => useHasRole('buyer');

export const useCanCreateListings = () => {
  const isAgent = useIsAgent();
  const isAdmin = useIsAdmin();
  return isAgent || isAdmin;
};
