import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface MultiProjectMetrics {
  activeProjects: number;
  totalLots: number;
  availableLots: number;
  reservedLots: number;
  soldLots: number;
  reservationRevenue: number;
  creditRevenue: number;
  activeLeads: number;
  overduePayments: number;
  projectComparison: { name: string; sold: number; reserved: number; available: number }[];
  projectDetails: {
    id: string; name: string; city: string | null; location: string | null;
    totalLots: number; availableLots: number; reservedLots: number; soldLots: number;
  }[];
}

export function useMultiProjectMetrics(projectId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['multi-project-metrics', user?.id, projectId],
    queryFn: async (): Promise<MultiProjectMetrics> => {
      if (!user) throw new Error('Not authenticated');

      // Fetch projects
      let projQuery = supabase.from('projects').select('*').eq('user_id', user.id);
      if (projectId) projQuery = projQuery.eq('id', projectId);
      const { data: projects = [] } = await projQuery;

      const projectIds = projects.map(p => p.id);

      // Fetch lots for these projects
      const { data: lots = [] } = projectIds.length > 0
        ? await supabase.from('lots').select('id, status, project_id').in('project_id', projectIds)
        : { data: [] };

      // Reservations
      const { data: reservations = [] } = await supabase
        .from('reservations')
        .select('id, status, reservation_amount, lot_id')
        .order('created_at', { ascending: false });

      // Filter reservations to our lots
      const lotIds = new Set(lots.map(l => l.id));
      const ourReservations = reservations.filter((r: any) => lotIds.has(r.lot_id));

      // Credits
      const { data: credits = [] } = await supabase
        .from('credits').select('id, status, financed_amount').eq('user_id', user.id);

      // Overdue payments
      const { data: overdueP = [] } = await supabase
        .from('credit_payments').select('id, credit_id, status').eq('status', 'overdue');
      const creditIds = new Set(credits.map(c => c.id));
      const ourOverdue = overdueP.filter((p: any) => creditIds.has(p.credit_id));

      // Leads
      const { data: leads = [] } = await supabase
        .from('leads').select('id, status').eq('user_id', user.id)
        .in('status', ['new', 'contacted', 'interested', 'negotiating']);

      // Compute
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const totalLots = projects.reduce((s, p) => s + (p.total_lots || 0), 0);
      const availableLots = projects.reduce((s, p) => s + (p.available_lots || 0), 0);
      const reservedLots = projects.reduce((s, p) => s + (p.reserved_lots || 0), 0);
      const soldLots = projects.reduce((s, p) => s + (p.sold_lots || 0), 0);

      const paidRes = ourReservations.filter((r: any) => r.status === 'paid' || r.status === 'converted');
      const reservationRevenue = paidRes.reduce((s: number, r: any) => s + (r.reservation_amount || 0), 0);
      const creditRevenue = credits
        .filter((c: any) => c.status === 'active' || c.status === 'completed')
        .reduce((s: number, c: any) => s + Number(c.financed_amount || 0), 0);

      const projectComparison = projects.map(p => ({
        name: p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
        sold: p.sold_lots || 0,
        reserved: p.reserved_lots || 0,
        available: p.available_lots || 0,
      }));

      const projectDetails = projects.map(p => ({
        id: p.id,
        name: p.name,
        city: p.city,
        location: p.location,
        totalLots: p.total_lots || 0,
        availableLots: p.available_lots || 0,
        reservedLots: p.reserved_lots || 0,
        soldLots: p.sold_lots || 0,
      }));

      return {
        activeProjects,
        totalLots,
        availableLots,
        reservedLots,
        soldLots,
        reservationRevenue,
        creditRevenue,
        activeLeads: leads.length,
        overduePayments: ourOverdue.length,
        projectComparison,
        projectDetails,
      };
    },
    enabled: !!user,
  });
}
