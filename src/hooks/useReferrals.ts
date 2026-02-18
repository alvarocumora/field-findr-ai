import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Referral {
  id: string;
  referrer_id: string;
  referral_code: string;
  referred_user_id: string | null;
  status: string;
  reward_type: string | null;
  reward_amount: number;
  reward_claimed: boolean;
  created_at: string;
  converted_at: string | null;
}

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'OT-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

export const useMyReferrals = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['referrals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Referral[];
    },
    enabled: !!user,
  });
};

export const useReferralStats = () => {
  const { data: referrals = [] } = useMyReferrals();
  const total = referrals.length;
  const registered = referrals.filter(r => r.status === 'registered' || r.status === 'converted').length;
  const converted = referrals.filter(r => r.status === 'converted').length;
  const pendingRewards = referrals.filter(r => !r.reward_claimed && r.reward_amount > 0).reduce((sum, r) => sum + r.reward_amount, 0);
  return { total, registered, converted, pendingRewards, referrals };
};

export const useCreateReferral = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Debes iniciar sesión');
      const code = generateCode();
      const { data, error } = await supabase
        .from('referrals')
        .insert({ referrer_id: user.id, referral_code: code })
        .select()
        .single();
      if (error) throw error;
      return data as Referral;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals', user?.id] });
      toast({ title: 'Código creado', description: 'Comparte tu código de referido con amigos.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
