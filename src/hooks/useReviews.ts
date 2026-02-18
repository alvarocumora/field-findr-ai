import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Review {
  id: string;
  project_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  verified_buyer: boolean;
  created_at: string;
  updated_at: string;
}

export const useProjectReviews = (projectId: string) => {
  return useQuery({
    queryKey: ['reviews', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Review[];
    },
    enabled: !!projectId,
  });
};

export const useReviewStats = (projectId: string) => {
  const { data: reviews = [] } = useProjectReviews(projectId);
  const count = reviews.length;
  const average = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
  const distribution = [1, 2, 3, 4, 5].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: count > 0 ? (reviews.filter(r => r.rating === star).length / count) * 100 : 0,
  }));
  return { average, count, distribution, reviews };
};

export const useCreateReview = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, rating, comment }: { projectId: string; rating: number; comment?: string }) => {
      if (!user) throw new Error('Debes iniciar sesión');
      const { error } = await supabase
        .from('reviews')
        .insert({
          project_id: projectId,
          user_id: user.id,
          rating,
          comment: comment || null,
        });
      if (error) {
        if (error.code === '23505') throw new Error('Ya has dejado una reseña en este proyecto');
        throw error;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', vars.projectId] });
      toast({ title: '¡Gracias!', description: 'Tu reseña ha sido publicada.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
