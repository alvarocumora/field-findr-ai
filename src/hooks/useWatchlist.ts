import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useWatchlist = (lotId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if this lot is watched
  const { data: isWatched } = useQuery({
    queryKey: ['watchlist', lotId, user?.id],
    queryFn: async () => {
      if (!user || !lotId) return false;
      const { data } = await supabase
        .from('user_events')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_type', 'watch_lot')
        .contains('metadata', { lot_id: lotId })
        .limit(1);
      return (data?.length || 0) > 0;
    },
    enabled: !!user && !!lotId,
  });

  const toggleWatch = useCallback(async () => {
    if (!user || !lotId) {
      toast.info('Inicia sesión para seguir lotes');
      return;
    }

    if (isWatched) {
      // Remove watch event
      await supabase
        .from('user_events')
        .delete()
        .eq('user_id', user.id)
        .eq('event_type', 'watch_lot')
        .contains('metadata', { lot_id: lotId });
      toast.success('Lote removido de seguimiento');
    } else {
      await supabase.from('user_events').insert({
        user_id: user.id,
        event_type: 'watch_lot',
        metadata: { lot_id: lotId },
      });
      toast.success('Siguiendo este lote. Te avisaremos de cambios.');
    }

    queryClient.invalidateQueries({ queryKey: ['watchlist', lotId] });
  }, [user, lotId, isWatched, queryClient]);

  // Get viewer count for a lot
  const { data: viewerCount } = useQuery({
    queryKey: ['lot-views', lotId],
    queryFn: async () => {
      if (!lotId) return 0;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count } = await supabase
        .from('user_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'view_lot')
        .contains('metadata', { lot_id: lotId })
        .gte('created_at', weekAgo.toISOString());
      return count || 0;
    },
    enabled: !!lotId,
  });

  return {
    isWatched: !!isWatched,
    toggleWatch,
    viewerCount: viewerCount || 0,
  };
};
