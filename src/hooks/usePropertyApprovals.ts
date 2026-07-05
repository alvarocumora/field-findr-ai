import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface PropertyApproval {
  id: string;
  listing_id: string;
  reviewer_id: string | null;
  status: ApprovalStatus;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface PendingApprovalRow extends PropertyApproval {
  listing: {
    id: string;
    title: string;
    location: string;
    region: string | null;
    country: string | null;
    price: number;
    currency: string;
    area_ha: number | null;
    type: string;
    user_id: string;
    images: string[] | null;
    created_at: string;
  };
}

/** Latest approval row for a given listing (used to show status banner to owner). */
export const useListingApproval = (listingId?: string) => {
  return useQuery({
    queryKey: ['listing-approval', listingId],
    enabled: !!listingId,
    queryFn: async (): Promise<PropertyApproval | null> => {
      const { data, error } = await supabase
        .from('property_approvals')
        .select('*')
        .eq('listing_id', listingId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as PropertyApproval | null;
    },
  });
};

/** Admin queue: all pending approvals with the underlying listing joined. */
export const usePendingApprovals = () => {
  return useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async (): Promise<PendingApprovalRow[]> => {
      const { data, error } = await supabase
        .from('property_approvals')
        .select(`
          *,
          listing:listings!inner (
            id, title, location, region, country, price, currency,
            area_ha, type, user_id, images, created_at
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as PendingApprovalRow[];
    },
  });
};

/** Admin action: approve or reject an approval row. Triggers sync of listings.status. */
export const useReviewApproval = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      rejection_reason,
    }: {
      id: string;
      status: 'approved' | 'rejected';
      rejection_reason?: string;
    }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('property_approvals')
        .update({
          status,
          rejection_reason: status === 'rejected' ? rejection_reason ?? null : null,
          reviewed_at: new Date().toISOString(),
          reviewer_id: userRes.user?.id ?? null,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pending-approvals'] });
      qc.invalidateQueries({ queryKey: ['listing-approval'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
      toast({
        title: vars.status === 'approved' ? 'Propiedad aprobada' : 'Propiedad rechazada',
        description:
          vars.status === 'approved'
            ? 'El dueño fue notificado y la propiedad ya es visible.'
            : 'El dueño fue notificado con el motivo del rechazo.',
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'No se pudo procesar la revisión';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });
};
