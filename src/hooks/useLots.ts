import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate, Json } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type Lot = Tables<'lots'>;
export type LotInsert = TablesInsert<'lots'>;
export type LotUpdate = TablesUpdate<'lots'>;

/**
 * Non-PII lot columns readable by anon/authenticated. The buyer_* columns are
 * granted only to service_role (migration 20260603153301), so a `select('*')`
 * is rejected wholesale with "permission denied for column buyer_name" — which
 * silently emptied the list and dropped the map to simulated polygons. Always
 * select this explicit list instead of `*`.
 */
const LOT_COLUMNS =
  'id, project_id, user_id, lot_number, name, description, area, price, price_per_sqm, ' +
  'status, latitude, longitude, polygon, features, reservation_date, sale_date, ' +
  'created_at, updated_at, elevation_avg, slope_category, images';

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
    queryKey: ['lots', user?.id ?? 'anon', projectId ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('lots')
        .select(LOT_COLUMNS)
        .order('lot_number', { ascending: true });

      if (projectId) {
        // Public/project view: RLS allows anyone to read lots of active projects.
        query = query.eq('project_id', projectId);
      } else {
        // Personal view (no project scope): require auth and scope to current user.
        if (!user?.id) return [];
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lot[];
    },
    enabled: !!projectId || !!user?.id,
  });

  const createLot = useMutation({
    mutationFn: async (lot: Omit<LotInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('No user authenticated');
      
      const { data, error } = await supabase
        .from('lots')
        .insert({ ...lot, user_id: user.id })
        .select(LOT_COLUMNS)
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
        .select(LOT_COLUMNS)
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

export interface AdjustLotPricesData {
  projectId: string;
  mode: 'percent' | 'per_sqm' | 'delta';
  value: number;
  /** Restrict to a status ('available' by default); null = all lots. */
  onlyStatus?: string | null;
}

/**
 * Bulk price adjustment for a project's lots via the adjust_lot_prices RPC
 * (percent increase/decrease, price per m², or fixed delta). Returns the
 * number of lots updated.
 */
export const useAdjustLotPrices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, mode, value, onlyStatus = 'available' }: AdjustLotPricesData) => {
      // RPC added by migration 20260705210000 — not yet in generated types.
      const { data, error } = await (supabase.rpc as CallableFunction)('adjust_lot_prices', {
        p_project_id: projectId,
        p_mode: mode,
        p_value: value,
        p_only_status: onlyStatus,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Precios actualizados en ${count} lote${count === 1 ? '' : 's'}`);
    },
    onError: (error: Error) => {
      toast.error('Error al ajustar precios', { description: error.message });
    },
  });
};
