import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Admin Dashboard Stats
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Get total users count
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active listings count
      const { count: activeListings } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total listings count
      const { count: totalListings } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });

      // Get pending documents (alerts)
      const { count: pendingAlerts } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      return {
        totalUsers: totalUsers || 0,
        activeListings: activeListings || 0,
        totalListings: totalListings || 0,
        pendingAlerts: pendingAlerts || 0,
      };
    },
  });
};

export const useAdminUsers = (searchQuery: string = '') => {
  return useQuery({
    queryKey: ['admin-users', searchQuery],
    queryFn: async () => {
      // Get profiles
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data: profiles, error } = await query;
      if (error) throw error;

      // Get roles for these users
      const userIds = profiles?.map(p => p.user_id) || [];
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      return profiles?.map(user => ({
        id: user.id,
        user_id: user.user_id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Sin nombre',
        email: user.email || 'Sin email',
        role: rolesMap.get(user.user_id) || 'buyer',
        status: 'active',
        joined: user.created_at,
      })) || [];
    },
  });
};

export const useAdminListings = () => {
  return useQuery({
    queryKey: ['admin-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });
};

// Agent Dashboard Stats
export const useAgentStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agent-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get leads count
      const { count: activeLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get listings count
      const { count: properties } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get lots sold this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: soldLots } = await supabase
        .from('lots')
        .select('price')
        .eq('user_id', user.id)
        .eq('status', 'sold')
        .gte('sale_date', startOfMonth.toISOString());

      const monthlySales = soldLots?.reduce((sum, lot) => sum + (lot.price || 0), 0) || 0;
      const soldCount = soldLots?.length || 0;

      return {
        activeLeads: activeLeads || 0,
        properties: properties || 0,
        monthlySales,
        soldCount,
      };
    },
    enabled: !!user,
  });
};

export const useAgentLeads = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agent-leads', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          projects (name)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data?.map(lead => ({
        id: lead.id,
        name: `${lead.first_name} ${lead.last_name || ''}`.trim(),
        interest: lead.projects?.name || 'Sin proyecto asignado',
        status: getLeadStatus(lead.status),
        lastContact: getRelativeTime(lead.updated_at),
        budget: formatBudget(lead.budget_min, lead.budget_max),
        email: lead.email,
        phone: lead.phone,
        nextFollowUp: lead.next_follow_up,
      })) || [];
    },
    enabled: !!user,
  });
};

export const useAgentGoals = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agent-goals', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Get sales this month
      const { data: soldLots } = await supabase
        .from('lots')
        .select('price')
        .eq('user_id', user.id)
        .eq('status', 'sold')
        .gte('sale_date', startOfMonth.toISOString());

      // Get converted leads this month
      const { count: convertedLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'converted')
        .gte('updated_at', startOfMonth.toISOString());

      const monthlySales = soldLots?.reduce((sum, lot) => sum + (lot.price || 0), 0) || 0;
      
      // Default goals (could be configurable)
      const salesGoal = 5000000000; // 5M CLP
      const leadsGoal = 15;

      return {
        currentSales: monthlySales,
        salesGoal,
        salesProgress: Math.min((monthlySales / salesGoal) * 100, 100),
        convertedLeads: convertedLeads || 0,
        leadsGoal,
        leadsProgress: Math.min(((convertedLeads || 0) / leadsGoal) * 100, 100),
      };
    },
    enabled: !!user,
  });
};

// Agency Dashboard Stats
export const useAgencyStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agency-stats', user?.id],
    queryFn: async () => {
      // Get agents count (users with agent role)
      const { count: agentCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'agent');

      // Get total properties
      const { count: totalProperties } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get monthly sales
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: soldLots } = await supabase
        .from('lots')
        .select('price')
        .eq('status', 'sold')
        .gte('sale_date', startOfMonth.toISOString());

      const monthlySales = soldLots?.reduce((sum, lot) => sum + (lot.price || 0), 0) || 0;

      // Get total views
      const { data: listings } = await supabase
        .from('listings')
        .select('views_count');

      const totalViews = listings?.reduce((sum, l) => sum + (l.views_count || 0), 0) || 0;

      return {
        agentCount: agentCount || 0,
        totalProperties: totalProperties || 0,
        monthlySales,
        totalViews,
      };
    },
  });
};

export const useAgencyAgents = () => {
  return useQuery({
    queryKey: ['agency-agents'],
    queryFn: async () => {
      // Get all agents
      const { data: agentRoles, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'agent');

      if (error) throw error;

      const agentUserIds = agentRoles?.map(a => a.user_id) || [];

      // Get profiles for agents
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', agentUserIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // For each agent, get their stats
      const agentStats = await Promise.all(
        agentUserIds.map(async (userId) => {
          const profile = profilesMap.get(userId);

          // Get leads count
          const { count: leadsCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

          // Get sold lots count
          const { count: salesCount } = await supabase
            .from('lots')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'sold');

          // Calculate conversion rate
          const conversion = leadsCount && leadsCount > 0 
            ? Math.round(((salesCount || 0) / leadsCount) * 100) 
            : 0;

          return {
            id: userId,
            name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Sin nombre',
            avatar: profile?.avatar_url || null,
            sales: salesCount || 0,
            leads: leadsCount || 0,
            conversion,
          };
        })
      );

      return agentStats.sort((a, b) => b.sales - a.sales);
    },
  });
};

export const useAgencyProperties = () => {
  return useQuery({
    queryKey: ['agency-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      return data?.map(property => ({
        id: property.id,
        title: property.title,
        price: formatPrice(property.price),
        views: property.views_count || 0,
        leads: 0, // Would need a leads-listings relation
        status: property.status || 'active',
        image: property.images?.[0] || null,
      })) || [];
    },
  });
};

// Helper functions
function getLeadStatus(status: string | null): 'hot' | 'warm' | 'cold' {
  switch (status) {
    case 'qualified':
    case 'negotiating':
      return 'hot';
    case 'contacted':
    case 'meeting_scheduled':
      return 'warm';
    default:
      return 'cold';
  }
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Hace minutos';
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-CL');
}

function formatBudget(min: number | null, max: number | null): string {
  const format = (n: number) => {
    if (n >= 1000000000) return `$${(n / 1000000000).toFixed(0)}B`;
    if (n >= 1000000) return `$${(n / 1000000).toFixed(0)}M`;
    return `$${n.toLocaleString('es-CL')}`;
  };

  if (min && max) return `${format(min)} - ${format(max)}`;
  if (max) return `Hasta ${format(max)}`;
  if (min) return `Desde ${format(min)}`;
  return 'Sin presupuesto';
}

function formatPrice(price: number): string {
  if (price >= 1000000000) return `$${(price / 1000000000).toFixed(1)}B`;
  if (price >= 1000000) return `$${(price / 1000000).toFixed(0)}M`;
  return `$${price.toLocaleString('es-CL')}`;
}
