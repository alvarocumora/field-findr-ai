import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Reservation {
  id: string;
  lot_id: string;
  lead_id: string | null;
  user_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  buyer_rut: string | null;
  reservation_amount: number;
  currency: string;
  status: 'pending_payment' | 'paid' | 'expired' | 'cancelled' | 'converted';
  mercadopago_preference_id: string | null;
  mercadopago_payment_id: string | null;
  paid_at: string | null;
  expires_at: string;
  contract_id: string | null;
  converted_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReservationData {
  lot_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  buyer_rut?: string;
  reservation_amount?: number;
  notes?: string;
}

export interface CreateReservationResponse {
  reservation: Reservation;
  payment_url?: string;
  sandbox_url?: string;
  expires_at: string;
  message?: string;
}

export const useReservations = (projectId?: string) => {
  return useQuery({
    queryKey: ['reservations', projectId],
    queryFn: async () => {
      // When filtering by project we must use an inner join (`lots!inner`),
      // otherwise PostgREST only nulls out non-matching embeds and still
      // returns reservations from every project.
      const lotsEmbed = projectId ? 'lots!inner' : 'lots';
      let query = supabase
        .from('reservations')
        .select(`
          *,
          ${lotsEmbed} (
            id,
            lot_number,
            name,
            area,
            price,
            project_id,
            projects (
              id,
              name,
              location,
              city,
              rol_number
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('lots.project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: true,
  });
};

export const useReservation = (reservationId: string) => {
  return useQuery({
    queryKey: ['reservation', reservationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          lots (
            id,
            lot_number,
            area,
            price,
            project_id,
            projects (
              id,
              name,
              location
            )
          )
        `)
        .eq('id', reservationId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!reservationId,
  });
};

export const useLotReservations = (lotId: string) => {
  return useQuery({
    queryKey: ['lot-reservations', lotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('lot_id', lotId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!lotId,
  });
};

export const useCreateReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReservationData): Promise<CreateReservationResponse> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Debes iniciar sesión para realizar una reserva');
      }

      const response = await supabase.functions.invoke('create-reservation-payment', {
        body: data,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Error al crear la reserva');
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      
      if (data.payment_url) {
        toast.success('Reserva creada', {
          description: 'Serás redirigido al pago...',
        });
      } else {
        toast.success('Reserva creada', {
          description: data.message || 'Tu reserva ha sido registrada.',
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Error al crear reserva', {
        description: error.message,
      });
    },
  });
};

export const useCancelReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      toast.success('Reserva cancelada');
    },
    onError: (error: Error) => {
      toast.error('Error al cancelar', {
        description: error.message,
      });
    },
  });
};

/**
 * Flip stale pending_payment reservations past their expires_at to 'expired'
 * (a DB trigger releases the lots). Runs server-side via RPC; also scheduled
 * with pg_cron — calling it on manager load is the client-side fallback.
 */
export const useExpireStaleReservations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // RPC added by migration 20260705210000 — not yet in generated types.
      const { data, error } = await (supabase.rpc as CallableFunction)('expire_stale_reservations');
      if (error) throw error;
      return data as number;
    },
    onSuccess: (expiredCount) => {
      if (expiredCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['reservations'] });
        queryClient.invalidateQueries({ queryKey: ['lots'] });
        toast.info(`${expiredCount} reserva${expiredCount === 1 ? '' : 's'} vencida${expiredCount === 1 ? '' : 's'} liberada${expiredCount === 1 ? '' : 's'}`);
      }
    },
  });
};

/** Extend a pending reservation's expiry by N hours (project owner only). */
export const useExtendReservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reservationId, hours = 48 }: { reservationId: string; hours?: number }) => {
      const { data, error } = await (supabase.rpc as CallableFunction)('extend_reservation', {
        p_reservation_id: reservationId,
        p_hours: hours,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (newExpiry) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Reserva extendida', {
        description: `Nuevo vencimiento: ${new Date(newExpiry).toLocaleString('es-CL')}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Error al extender', { description: error.message });
    },
  });
};

export interface RegisterSaleData {
  reservationId: string;
  saleAmount: number;
  commissionRate?: number | null;
  notes?: string | null;
}

/**
 * Atomic reservation → sale conversion: marks the reservation converted (the
 * DB trigger sets the lot sold + sale_date), records the final negotiated
 * price on the lot, and creates the agent commission when a rate is given.
 */
export const useRegisterSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reservationId, saleAmount, commissionRate, notes }: RegisterSaleData) => {
      const { data, error } = await (supabase.rpc as CallableFunction)('register_sale', {
        p_reservation_id: reservationId,
        p_sale_amount: saleAmount,
        p_commission_rate: commissionRate ?? null,
        p_notes: notes ?? null,
      });
      if (error) throw error;
      return data as string | null; // commission id (null when no commission)
    },
    onSuccess: (_commissionId, { commissionRate }) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['agent-commissions'] });
      toast.success('Venta registrada', {
        description: commissionRate
          ? 'Lote vendido y comisión generada'
          : 'Lote marcado como vendido',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al registrar la venta', { description: error.message });
    },
  });
};

export const useReservationStats = (projectId?: string) => {
  return useQuery({
    queryKey: ['reservation-stats', projectId],
    queryFn: async () => {
      let query = supabase
        .from('reservations')
        .select(`
          id,
          status,
          reservation_amount,
          lots!inner (
            project_id
          )
        `);

      if (projectId) {
        query = query.eq('lots.project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter(r => r.status === 'pending_payment').length,
        paid: data.filter(r => r.status === 'paid').length,
        expired: data.filter(r => r.status === 'expired').length,
        cancelled: data.filter(r => r.status === 'cancelled').length,
        converted: data.filter(r => r.status === 'converted').length,
        totalAmount: data
          .filter(r => r.status === 'paid')
          .reduce((sum, r) => sum + (r.reservation_amount || 0), 0),
      };

      return stats;
    },
  });
};
