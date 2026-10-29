import type { Json } from '@/integrations/supabase/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  preferred_currency: string | null;
  preferred_language: string | null;
  email_notifications: boolean | null;
  new_listing_alerts: boolean | null;
  price_drop_alerts: boolean | null;
  marketing_emails: boolean | null;
  onboarding_completed: boolean | null;
  onboarding_data: Record<string, Json> | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  preferred_currency?: string | null;
  preferred_language?: string | null;
  email_notifications?: boolean | null;
  new_listing_alerts?: boolean | null;
  price_drop_alerts?: boolean | null;
  marketing_emails?: boolean | null;
  onboarding_completed?: boolean | null;
  onboarding_data?: Record<string, Json> | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      if (!user?.id) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({
        title: "Perfil actualizado",
        description: "Tu información ha sido guardada correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil. Intenta de nuevo.",
        variant: "destructive",
      });
      console.error('Error updating profile:', error);
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfile.mutate,
    // Awaitable variant for flows that must sequence on the save (onboarding).
    updateProfileAsync: updateProfile.mutateAsync,
    isUpdating: updateProfile.isPending,
  };
};
