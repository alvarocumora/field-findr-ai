import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FinancialMetrics {
  totalRevenue: number;
  pendingRevenue: number;
  totalReservations: number;
  paidReservations: number;
  expiredReservations: number;
  conversionRate: number;
  totalCredits: number;
  activeCredits: number;
  overduePayments: number;
  overdueAmount: number;
  totalCollected: number;
  monthlyData: { month: string; revenue: number; reservations: number }[];
  projectBreakdown: { name: string; revenue: number; reservations: number; conversion: number }[];
}

export function useFinancialDashboard() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['financial-dashboard', user?.id],
    queryFn: async (): Promise<FinancialMetrics> => {
      if (!user) throw new Error('Not authenticated');

      // Fetch reservations with lot+project info
      const { data: reservations = [] } = await supabase
        .from('reservations')
        .select('id, status, reservation_amount, currency, created_at, paid_at, lot_id, lots(lot_number, price, project_id, projects(name))')
        .order('created_at', { ascending: false });

      // Fetch credits
      const { data: credits = [] } = await supabase
        .from('credits')
        .select('id, status, total_amount, financed_amount, monthly_payment')
        .order('created_at', { ascending: false });

      // Fetch credit payments
      const { data: creditPayments = [] } = await supabase
        .from('credit_payments')
        .select('id, amount, status, due_date, paid_date, credit_id')
        .order('due_date', { ascending: false });

      // Calculate metrics
      const paidRes = reservations.filter((r: any) => r.status === 'paid' || r.status === 'converted');
      const expiredRes = reservations.filter((r: any) => r.status === 'expired');
      const pendingRes = reservations.filter((r: any) => r.status === 'pending_payment');

      const totalRevenue = paidRes.reduce((sum: number, r: any) => sum + (r.reservation_amount || 0), 0);
      const pendingRevenue = pendingRes.reduce((sum: number, r: any) => sum + (r.reservation_amount || 0), 0);

      const overduePaymentsList = creditPayments.filter((p: any) => p.status === 'overdue');
      const overdueAmount = overduePaymentsList.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const paidPayments = creditPayments.filter((p: any) => p.status === 'paid');
      const totalCollected = paidPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

      // Monthly data (last 6 months)
      const monthlyMap = new Map<string, { revenue: number; reservations: number }>();
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(key, { revenue: 0, reservations: 0 });
      }

      for (const r of paidRes) {
        const d = new Date((r as any).paid_at || (r as any).created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const entry = monthlyMap.get(key);
        if (entry) {
          entry.revenue += (r as any).reservation_amount || 0;
          entry.reservations += 1;
        }
      }

      const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        ...data,
      }));

      // Project breakdown
      const projectMap = new Map<string, { name: string; revenue: number; total: number; paid: number }>();
      for (const r of reservations as any[]) {
        const projName = r.lots?.projects?.name || 'Sin proyecto';
        const existing = projectMap.get(projName) || { name: projName, revenue: 0, total: 0, paid: 0 };
        existing.total += 1;
        if (r.status === 'paid' || r.status === 'converted') {
          existing.revenue += r.reservation_amount || 0;
          existing.paid += 1;
        }
        projectMap.set(projName, existing);
      }

      const projectBreakdown = Array.from(projectMap.values()).map(p => ({
        name: p.name,
        revenue: p.revenue,
        reservations: p.total,
        conversion: p.total > 0 ? Math.round((p.paid / p.total) * 100) : 0,
      }));

      return {
        totalRevenue: totalRevenue + totalCollected,
        pendingRevenue,
        totalReservations: reservations.length,
        paidReservations: paidRes.length,
        expiredReservations: expiredRes.length,
        conversionRate: reservations.length > 0 ? Math.round((paidRes.length / reservations.length) * 100) : 0,
        totalCredits: credits.length,
        activeCredits: credits.filter((c: any) => c.status === 'active').length,
        overduePayments: overduePaymentsList.length,
        overdueAmount,
        totalCollected,
        monthlyData,
        projectBreakdown,
      };
    },
    enabled: !!user,
  });
}
