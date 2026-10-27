import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMyOrganization } from '@/hooks/useMyOrganization';
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
      const salesGoal = 5_000_000; // Meta inicial ilustrativa: cinco millones CLP
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
  const { data: team, isLoading: teamLoading } = useMyOrganization();
  const teamIds = team?.teamUserIds ?? [];

  const query = useQuery({
    queryKey: ['agency-stats', user?.id, teamIds],
    enabled: teamIds.length > 0,
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [agentRolesRes, propertiesRes, soldRes, viewsRes] = await Promise.all([
        // Miembros del equipo que efectivamente son agentes
        supabase
          .from('user_roles')
          .select('user_id')
          .in('user_id', teamIds)
          .eq('role', 'agent'),
        // Propiedades activas del equipo
        supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .in('user_id', teamIds)
          .eq('status', 'active'),
        // Ventas del mes del equipo
        supabase
          .from('lots')
          .select('price')
          .in('user_id', teamIds)
          .eq('status', 'sold')
          .gte('sale_date', startOfMonth.toISOString()),
        // Visitas de las propiedades del equipo
        supabase
          .from('listings')
          .select('views_count')
          .in('user_id', teamIds),
      ]);
      if (agentRolesRes.error) throw agentRolesRes.error;
      if (propertiesRes.error) throw propertiesRes.error;
      if (soldRes.error) throw soldRes.error;
      if (viewsRes.error) throw viewsRes.error;

      const monthlySales = soldRes.data?.reduce((sum, lot) => sum + (lot.price || 0), 0) || 0;
      const totalViews = viewsRes.data?.reduce((sum, l) => sum + (l.views_count || 0), 0) || 0;

      return {
        agentCount: new Set(agentRolesRes.data?.map((r) => r.user_id)).size,
        totalProperties: propertiesRes.count || 0,
        monthlySales,
        totalViews,
      };
    },
  });

  // Mientras se resuelve la organización la query está deshabilitada y su
  // isLoading es false (react-query v5): sin esto el dashboard muestra un
  // flash de ceros/estados vacíos en vez de skeletons.
  return { ...query, isLoading: teamLoading || query.isLoading };
};

export const useAgencyAgents = () => {
  const { user } = useAuth();
  const { data: team, isLoading: teamLoading } = useMyOrganization();
  const teamIds = team?.teamUserIds ?? [];

  const query = useQuery({
    queryKey: ['agency-agents', user?.id, teamIds],
    enabled: teamIds.length > 0,
    queryFn: async () => {
      // El ranking contiene solo miembros del equipo CON rol agente
      // (el dueño/staff sin rol agente no aparece como vendedor fantasma).
      const rolesRes = await supabase
        .from('user_roles')
        .select('user_id')
        .in('user_id', teamIds)
        .eq('role', 'agent');
      if (rolesRes.error) throw rolesRes.error;

      const agentIds = [...new Set((rolesRes.data ?? []).map((r) => r.user_id))];
      if (agentIds.length === 0) return [];

      const profilesRes = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', agentIds);
      if (profilesRes.error) throw profilesRes.error;

      const profilesMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);

      // Conteos exactos en servidor (head+count no tiene el tope de filas de
      // PostgREST). N está acotado por los asientos del plan y va en paralelo.
      const agentStats = await Promise.all(
        agentIds.map(async (userId) => {
          const [leadsRes, salesRes] = await Promise.all([
            supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId),
            supabase
              .from('lots')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('status', 'sold'),
          ]);
          if (leadsRes.error) throw leadsRes.error;
          if (salesRes.error) throw salesRes.error;

          const profile = profilesMap.get(userId);
          const leadsCount = leadsRes.count ?? 0;
          const salesCount = salesRes.count ?? 0;
          const conversion = leadsCount > 0 ? Math.round((salesCount / leadsCount) * 100) : 0;

          return {
            id: userId,
            name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Sin nombre',
            avatar: profile?.avatar_url || null,
            sales: salesCount,
            leads: leadsCount,
            conversion,
          };
        })
      );

      return agentStats.sort((a, b) => b.sales - a.sales);
    },
  });

  return { ...query, isLoading: teamLoading || query.isLoading };
};

export const useAgencyProperties = () => {
  const { user } = useAuth();
  const { data: team, isLoading: teamLoading } = useMyOrganization();
  const teamIds = team?.teamUserIds ?? [];

  const query = useQuery({
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

  return { ...query, isLoading: teamLoading || query.isLoading };
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
