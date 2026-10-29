import { useQuery } from '@tanstack/react-query';
import { Heart, Calendar, CreditCard, Crown, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ProfileStatsCardsProps {
  userId: string;
}

const ProfileStatsCards = ({ userId }: ProfileStatsCardsProps) => {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['profile-stats', userId],
    queryFn: async () => {
      const [favRes, resRes, credRes, subRes, roleRes] = await Promise.all([
        supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['pending_payment', 'paid']),
        supabase.from('credits').select('id', { count: 'exact', head: true }).eq('buyer_user_id', userId).eq('status', 'active'),
        supabase.from('subscriptions').select('plan_type, status').eq('user_id', userId).eq('status', 'active').maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
      ]);

      return {
        favorites: favRes.count || 0,
        reservations: resRes.count || 0,
        credits: credRes.count || 0,
        plan: subRes.data?.plan_type || 'free',
        roles: (roleRes.data || []).map((r) => r.role as string),
      };
    },
    enabled: !!userId,
  });

  const planColors: Record<string, string> = {
    free: 'bg-muted text-muted-foreground',
    starter: 'bg-blue-500/10 text-blue-600',
    growth: 'bg-green-500/10 text-green-600',
    pro: 'bg-purple-500/10 text-purple-600',
  };

  const roleLabels: Record<string, string> = {
    buyer: 'Comprador',
    agent: 'Asesor',
    admin: 'Administrador',
  };

  const statItems = [
    { icon: Heart, label: 'Favoritos', value: stats?.favorites || 0, color: 'text-red-500', onClick: () => navigate('/favoritos') },
    { icon: Calendar, label: 'Reservas', value: stats?.reservations || 0, color: 'text-blue-500', onClick: () => navigate('/mi-terreno') },
    { icon: CreditCard, label: 'Créditos', value: stats?.credits || 0, color: 'text-green-500', onClick: () => navigate('/mi-terreno') },
  ];

  return (
    <div className="space-y-4">
      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {stats?.roles.map((role) => (
          <Badge key={role} variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            {roleLabels[role] || role}
          </Badge>
        ))}
        <Badge className={planColors[stats?.plan || 'free']}>
          <Crown className="h-3 w-3 mr-1" />
          Plan {(stats?.plan || 'free').charAt(0).toUpperCase() + (stats?.plan || 'free').slice(1)}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {statItems.map((item) => (
          <Card
            key={item.label}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={item.onClick}
          >
            <CardContent className="p-4 text-center">
              <item.icon className={`h-5 w-5 mx-auto mb-1 ${item.color}`} />
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProfileStatsCards;
