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
      let query = supabase
        .from('reservations')
        .select(`
          *,
          lots (
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
