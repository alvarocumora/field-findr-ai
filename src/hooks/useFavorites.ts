import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export const useFavorites = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('favorites')
        .select('*, listings(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useFavoriteIds = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorite-ids', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map(f => f.listing_id);
    },
    enabled: !!user,
  });
};

export const useIsFavorite = (listingId: string) => {
  const { data: favoriteIds = [] } = useFavoriteIds();
  return favoriteIds.includes(listingId);
};

export const useAddFavorite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (listingId: string) => {
      if (!user) throw new Error('Debes iniciar sesión para guardar favoritos');

      const { data, error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, listing_id: listingId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-ids'] });
      toast({
        title: 'Guardado en favoritos',
        description: 'La propiedad ha sido agregada a tus favoritos.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo guardar el favorito.',
        variant: 'destructive',
      });
    },
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (listingId: string) => {
      if (!user) throw new Error('Debes iniciar sesión');

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-ids'] });
      toast({
        title: 'Eliminado de favoritos',
        description: 'La propiedad ha sido eliminada de tus favoritos.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el favorito.',
        variant: 'destructive',
      });
    },
  });
};

export const useToggleFavorite = () => {
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const { data: favoriteIds = [] } = useFavoriteIds();

  return {
    toggle: (listingId: string) => {
      if (favoriteIds.includes(listingId)) {
        removeFavorite.mutate(listingId);
      } else {
        addFavorite.mutate(listingId);
      }
    },
    isLoading: addFavorite.isPending || removeFavorite.isPending,
  };
};
