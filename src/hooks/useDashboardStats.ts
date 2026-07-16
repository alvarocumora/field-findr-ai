import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMyOrganization } from '@/hooks/useMyOrganization';
import { countByUser } from '@/lib/team/teamScope';
import { differenceInDays } from 'date-fns';

// Admin Dashboard Stats
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { count: totalUsers } = await supabase
        .from('profiles').select('*', { count: 'exact', head: true });
      const { count: activeListings } = await supabase
        .from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { count: totalListings } = await supabase
        .from('listings').select('*', { count: 'exact', head: true });
      const { count: activeProjects } = await supabase
        .from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { count: pendingAlerts } = await supabase
        .from('documents').select('*', { count: 'exact', head: true }).eq('status', 'pending');

      return {
        totalUsers: totalUsers || 0,
        activeListings: activeListings || 0,
        totalListings: totalListings || 0,
        activeProjects: activeProjects || 0,
        pendingAlerts: pendingAlerts || 0,
      };
    },
  });
};

// Audit Logs for admin
export const useAdminAuditLogs = (actionFilter: string = 'all') => {
  return useQuery({
    queryKey: ['admin-audit-logs', actionFilter],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (actionFilter !== 'all') {
        query = query.ilike('action', `%${actionFilter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
};

// Document stats for admin
export const useAdminDocumentStats = () => {
  return useQuery({
    queryKey: ['admin-document-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_documents')
        .select('status, deadline');
      if (error) throw error;

      const now = new Date();
      return {
        total: data?.length || 0,
        pending: data?.filter(d => d.status === 'pending' || d.status === 'uploaded').length || 0,
        approved: data?.filter(d => d.status === 'approved').length || 0,
        rejected: data?.filter(d => d.status === 'rejected').length || 0,
        expiringSoon: data?.filter(d => d.deadline && differenceInDays(new Date(d.deadline), now) <= 3 && differenceInDays(new Date(d.deadline), now) >= 0).length || 0,
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

// Agency Dashboard Stats — SIEMPRE scoped al equipo de la organización propia
// (dueño + miembros), nunca a toda la plataforma.
export const useAgencyStats = () => {
  const { user } = useAuth();
  const { data: team } = useMyOrganization();
  const teamIds = team?.teamUserIds ?? [];

  return useQuery({
    queryKey: ['agency-stats', user?.id, teamIds],
    enabled: teamIds.length > 0,
    queryFn: async () => {
      // Propiedades activas del equipo
      const { count: totalProperties } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .in('user_id', teamIds)
        .eq('status', 'active');

      // Ventas del mes del equipo
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: soldLots } = await supabase
        .from('lots')
        .select('price')
        .in('user_id', teamIds)
        .eq('status', 'sold')
        .gte('sale_date', startOfMonth.toISOString());

      const monthlySales = soldLots?.reduce((sum, lot) => sum + (lot.price || 0), 0) || 0;

      // Visitas totales de las propiedades del equipo
      const { data: listings } = await supabase
        .from('listings')
        .select('views_count')
        .in('user_id', teamIds);

      const totalViews = listings?.reduce((sum, l) => sum + (l.views_count || 0), 0) || 0;

      return {
        agentCount: teamIds.length,
        totalProperties: totalProperties || 0,
        monthlySales,
        totalViews,
      };
    },
  });
};

export const useAgencyAgents = () => {
  const { user } = useAuth();
  const { data: team } = useMyOrganization();
  const teamIds = team?.teamUserIds ?? [];

  return useQuery({
    queryKey: ['agency-agents', user?.id, teamIds],
    enabled: teamIds.length > 0,
    queryFn: async () => {
      // Solo los miembros del equipo propio (3 queries planas, sin N+1)
      const [profilesRes, leadsRes, soldRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, first_name, last_name, avatar_url')
          .in('user_id', teamIds),
        supabase.from('leads').select('user_id').in('user_id', teamIds),
        supabase.from('lots').select('user_id').in('user_id', teamIds).eq('status', 'sold'),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const profilesMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);
      const leadCounts = countByUser(leadsRes.data ?? []);
      const saleCounts = countByUser(soldRes.data ?? []);

      const agentStats = teamIds.map((userId) => {
        const profile = profilesMap.get(userId);
        const leadsCount = leadCounts.get(userId) ?? 0;
        const salesCount = saleCounts.get(userId) ?? 0;
        const conversion = leadsCount > 0 ? Math.round((salesCount / leadsCount) * 100) : 0;

        return {
          id: userId,
          name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Sin nombre',
          avatar: profile?.avatar_url || null,
          sales: salesCount,
          leads: leadsCount,
          conversion,
        };
      });

      return agentStats.sort((a, b) => b.sales - a.sales);
    },
  });
};

export const useAgencyProperties = () => {
  const { user } = useAuth();
  const { data: team } = useMyOrganization();
  const teamIds = team?.teamUserIds ?? [];

  return useQuery({
    queryKey: ['agency-properties', user?.id, teamIds],
    enabled: teamIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .in('user_id', teamIds)
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
