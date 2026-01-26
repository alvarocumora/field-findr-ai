import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate, Json } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type Lot = Tables<'lots'>;
export type LotInsert = TablesInsert<'lots'>;
export type LotUpdate = TablesUpdate<'lots'>;

export interface LotFeatures {
  hasWater?: boolean;
  hasElectricity?: boolean;
  hasRoad?: boolean;
  additionalFeatures?: string[];
}

export const parseLotFeatures = (features: Json | null): LotFeatures => {
  if (!features || typeof features !== 'object' || Array.isArray(features)) {
    return { hasWater: false, hasElectricity: false, hasRoad: false, additionalFeatures: [] };
  }
  
  const f = features as Record<string, unknown>;
  return {
    hasWater: Boolean(f.hasWater),
    hasElectricity: Boolean(f.hasElectricity),
    hasRoad: Boolean(f.hasRoad),
    additionalFeatures: Array.isArray(f.additionalFeatures) ? f.additionalFeatures.map(String) : [],
  };
};

export const useLots = (projectId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: lots = [], isLoading, error, refetch } = useQuery({
    queryKey: ['lots', user?.id, projectId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('lots')
        .select('*')
        .eq('user_id', user.id)
        .order('lot_number', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lot[];
    },
    enabled: !!user?.id,
  });

  const createLot = useMutation({
    mutationFn: async (lot: Omit<LotInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('No user authenticated');
      
      const { data, error } = await supabase
        .from('lots')
        .insert({ ...lot, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Lote creado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear lote: ' + error.message);
    },
  });

  const updateLot = useMutation({
    mutationFn: async ({ id, ...updates }: LotUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('lots')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Lote actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });

  const deleteLot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lots')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Lote eliminado');
    },
    onError: (error) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });

  // Stats by status
  const stats = {
    total: lots.length,
    available: lots.filter(l => l.status === 'available').length,
    reserved: lots.filter(l => l.status === 'reserved').length,
    sold: lots.filter(l => l.status === 'sold').length,
    totalArea: lots.reduce((acc, l) => acc + Number(l.area || 0), 0),
    totalValue: lots.reduce((acc, l) => acc + Number(l.price || 0), 0),
  };

  return {
    lots,
    isLoading,
    error,
    refetch,
    createLot,
    updateLot,
    deleteLot,
    stats,
  };
};
