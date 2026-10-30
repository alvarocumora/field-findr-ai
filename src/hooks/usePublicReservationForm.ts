import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toFormDetails, type ReservationFormValues } from '@/lib/reservations/reservationForm';
import { RESERVATION_TERMS_VERSION } from '@/lib/reservations/reservationTerms';

export interface ReservableProject {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  region: string | null;
}

export interface ReservableLot {
  id: string;
  project_id: string;
  lot_number: string;
  name: string | null;
  area: number;
  price: number;
  reservation_amount: number;
}

/** Proyectos activos (mismo criterio público que el explorador). */
export const useReservableProjects = () =>
  useQuery({
    queryKey: ['reservation-form-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id,name,slug,city,region')
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ReservableProject[];
    },
    staleTime: 5 * 60_000,
  });

export const reservableLotsKey = (projectId: string | null | undefined) =>
  ['reservation-form-lots', projectId ?? 'none'] as const;

/**
 * Stock real: lotes disponibles, con precio y sin reserva activa. Se refresca
 * cada minuto mientras el formulario está abierto para no ofrecer parcelas
 * que otro comprador acaba de tomar.
 */
export const useReservableLots = (projectId: string | null | undefined) =>
  useQuery({
    queryKey: reservableLotsKey(projectId),
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_reservable_lots', { p_project_id: projectId! });
      if (error) throw error;
      return ((data ?? []) as ReservableLot[])
        .slice()
        .sort((a, b) => String(a.lot_number).localeCompare(String(b.lot_number), undefined, { numeric: true }));
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

export interface SubmittedReservation {
  reservationId: string;
  reservationAmount: number;
  expiresAt: string;
  createdAt: string;
  termsVersion: string;
}

export const useSubmitReservationForm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: ReservationFormValues): Promise<SubmittedReservation> => {
      const buyer = values.primary.buyer;
      const { data, error } = await supabase.rpc('create_public_reservation_form', {
        p_lot_id: values.lotId,
        p_buyer_name: buyer.fullName,
        p_buyer_email: buyer.email,
        p_buyer_phone: buyer.phone,
        p_buyer_rut: buyer.rut,
        p_buyer_details: toFormDetails(values) as unknown as Json,
        p_terms_version: RESERVATION_TERMS_VERSION,
        p_notes: 'Formulario de reserva web',
      });
      if (error) throw new Error(error.message || 'No pudimos registrar la reserva.');
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.reservation_id) throw new Error('No pudimos registrar la reserva.');
      return {
        reservationId: row.reservation_id,
        reservationAmount: Number(row.reservation_amount) || 0,
        expiresAt: row.expires_at,
        createdAt: new Date().toISOString(),
        termsVersion: RESERVATION_TERMS_VERSION,
      };
    },
    onSettled: (_data, _error, values) => {
      void queryClient.invalidateQueries({ queryKey: reservableLotsKey(values.projectId) });
      void queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
};
