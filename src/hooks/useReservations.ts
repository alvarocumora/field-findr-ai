import type { Json } from '@/integrations/supabase/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { readReferralAttribution } from '@/lib/referrals/referralAttribution';

export type Reservation = Tables<'reservations'>;
export type ReservationWithLot = Reservation & {
  lots: (Pick<Tables<'lots'>, 'lot_number' | 'name' | 'area' | 'price' | 'project_id'> & {
    id?: string;
    polygon?: Json;
    projects: Pick<Tables<'projects'>, 'name'> & Partial<Pick<Tables<'projects'>, 'id' | 'location' | 'city' | 'rol_number'>> | null;
  }) | null;
};

export interface CreateReservationData {
  lot_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  buyer_rut?: string;
  reservation_amount?: number;
  notes?: string;
  source_quote_id?: string;
  referral_code?: string;
  referral_landing_path?: string;
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
      return data as ReservationWithLot[];
    },
    enabled: true,
  });
};

export const useReservation = (
  reservationId: string,
  opts?: { refetchWhilePending?: boolean },
) => {
  return useQuery({
    queryKey: ['reservation', reservationId],
    // While the MP webhook confirms the payment the row is still
    // pending_payment; the return pages poll until it settles.
    refetchInterval: opts?.refetchWhilePending
      ? (query) => ((query.state.data as { status?: string } | undefined)?.status === 'pending_payment' ? 4000 : false)
      : undefined,
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

      const attribution = readReferralAttribution();

      const response = await supabase.functions.invoke('create-reservation-payment', {
        body: {
          ...data,
          referral_code: data.referral_code ?? attribution?.code ?? undefined,
          referral_landing_path: data.referral_landing_path ?? attribution?.landingPath ?? undefined,
        },
      });

      if (response.error) {
        // FunctionsHttpError hides the response body behind `context`; surface
        // the server's message (e.g. "No pudimos generar el link de pago").
        let message = 'Error al crear la reserva';
        const ctx = (response.error as { context?: Response }).context;
        if (ctx && typeof ctx.json === 'function') {
          try {
            message = (await ctx.json())?.error || message;
          } catch {
            // keep the generic message
          }
        }
        throw new Error(message);
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
      const { data, error } = await supabase.rpc('expire_stale_reservations');
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
      const { data, error } = await supabase.rpc('extend_reservation', {
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
  /** null = comisión según la regla del proyecto; 0 = sin comisión. */
  commissionRate?: number | null;
  notes?: string | null;
  /** Optional: link the sale to a specific lead so referral splits are inherited. */
  leadId?: string | null;
  /**
   * Quién cerró una venta que llegó con el link de un broker. true/null = el
   * broker (recibe la comisión de venta); false = el equipo del proyecto (el
   * broker recibe solo la captación).
   */
  brokerCloses?: boolean | null;
  /** Optional: referring broker who brought the client, if not resolved via leadId. */
  referringAgentId?: string | null;
  /** Referral split (% of the total commission) paid to the referring broker. */
  referralRate?: number | null;
}

/**
 * Atomic reservation → sale conversion: marks the reservation converted (the
 * DB trigger sets the lot sold + sale_date), records the final negotiated
 * price on the lot, and creates the agent commission from the project rule
 * (fixed CLP amounts) unless commissionRate is 0.
 * If a leadId with a referring_agent is provided, a referral split is added.
 */
export const useRegisterSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reservationId, saleAmount, commissionRate, notes,
      leadId, referringAgentId, referralRate, brokerCloses,
    }: RegisterSaleData) => {
      const { data, error } = await supabase.rpc('register_sale', {
        p_reservation_id: reservationId,
        p_sale_amount: saleAmount,
        p_commission_rate: commissionRate ?? null,
        p_notes: notes ?? null,
        p_referring_agent_id: referringAgentId ?? null,
        p_referral_rate: referralRate ?? null,
        p_lead_id: leadId ?? null,
        p_broker_closes: brokerCloses ?? null,
      });
      if (error) throw error;
      return data as string | null; // commission id (null when no commission)
    },

    onSuccess: (commissionId) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['agent-commissions'] });
      toast.success('Venta registrada', {
        description: commissionId
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
