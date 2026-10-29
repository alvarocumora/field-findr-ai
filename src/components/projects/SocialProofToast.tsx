import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus } from 'lucide-react';

interface SocialProofToastProps {
  projectId: string;
}

export const SocialProofToast = ({ projectId }: SocialProofToastProps) => {
  const [visible, setVisible] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setHasSession(!!data.session);
    });
    return () => {
      active = false;
    };
  }, []);

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['social-proof', projectId],
    // Reservations and leads are private relations: anonymous visitors get a 401.
    // Only the project team sees this activity signal.
    enabled: hasSession,
    queryFn: async () => {
      const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('reservations')
        .select('buyer_name, created_at, lots(lot_number)')
        .eq('lot_id', projectId) // will be joined via lots
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5);

      // Also check leads as interest signals
      const { data: leads } = await supabase
        .from('leads')
        .select('first_name, created_at')
        .eq('project_id', projectId)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5);


      const activities: { name: string; action: string; timeAgo: string }[] = [];

      (data || []).forEach((r) => {
        const hours = Math.round((Date.now() - new Date(r.created_at).getTime()) / 3600000);
        activities.push({
          name: r.buyer_name?.split(' ')[0] || 'Alguien',
          action: `reservó el Lote ${r.lots?.lot_number || ''}`,
          timeAgo: hours < 1 ? 'hace momentos' : `hace ${hours}h`,
        });
      });

      (leads || []).forEach((l) => {
        const hours = Math.round((Date.now() - new Date(l.created_at).getTime()) / 3600000);
        activities.push({
          name: l.first_name || 'Alguien',
          action: 'mostró interés en este proyecto',
          timeAgo: hours < 1 ? 'hace momentos' : `hace ${hours}h`,
        });
      });

      return activities;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (recentActivity.length === 0) return;

    // Show first toast after 15 seconds
    const initialTimer = setTimeout(() => {
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    }, 15000);

    // Cycle through activities every 45 seconds
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % recentActivity.length);
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    }, 45000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [recentActivity.length]);

  if (recentActivity.length === 0) return null;

  const current = recentActivity[currentIdx];
  if (!current) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 left-4 z-40 max-w-xs"
        >
          <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-xl shadow-2xl p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <UserPlus className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-semibold">{current.name}</span>{' '}
                {current.action}
              </p>
              <p className="text-[11px] text-muted-foreground">{current.timeAgo}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
