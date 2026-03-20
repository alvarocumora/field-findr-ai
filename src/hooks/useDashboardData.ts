import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useDashboardKPIs = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-kpis', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Get sold lots this month with prices
      const { data: soldLots } = await supabase
        .from('lots')
        .select('price, sale_date')
        .eq('user_id', user.id)
        .eq('status', 'sold')
        .gte('sale_date', startOfMonth.toISOString());

      const monthlyRevenue = soldLots?.reduce((sum, l) => sum + (l.price || 0), 0) || 0;
      const soldCount = soldLots?.length || 0;

      // Get active leads count
      const { count: activeLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('status', 'eq', 'converted');

      // Get paid reservations count
      const { count: activeReservations } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'paid');

      // Get lots summary
      const { data: allLots } = await supabase
        .from('lots')
        .select('status, price')
        .eq('user_id', user.id);

      const totalLots = allLots?.length || 0;
      const availableLots = allLots?.filter(l => l.status === 'available').length || 0;
      const reservedLots = allLots?.filter(l => l.status === 'reserved').length || 0;
      const allSold = allLots?.filter(l => l.status === 'sold').length || 0;
      const conversionRate = totalLots > 0 
        ? Math.round(((allSold + reservedLots) / totalLots) * 100) 
        : 0;

      return {
        monthlyRevenue,
        soldCount,
        activeLeads: activeLeads || 0,
        activeReservations: activeReservations || 0,
        totalLots,
        availableLots,
        reservedLots,
        conversionRate,
      };
    },
    enabled: !!user,
  });
};

export const useDashboardActivity = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-activity', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get recent reservations
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id, buyer_name, status, created_at, reservation_amount, lot_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent leads
      const { data: leads } = await supabase
        .from('leads')
        .select('id, first_name, last_name, status, created_at, project_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recently sold lots
      const { data: soldLots } = await supabase
        .from('lots')
        .select('id, lot_number, name, price, sale_date, project_id')
        .eq('user_id', user.id)
        .eq('status', 'sold')
        .order('sale_date', { ascending: false })
        .limit(3);

      type Activity = {
        id: string;
        type: 'sale' | 'lead' | 'payment' | 'alert';
        title: string;
        description?: string;
        timestamp: Date;
        status: 'success' | 'warning' | 'error' | 'info';
      };

      const activities: Activity[] = [];

      // Map reservations to activities
      reservations?.forEach(r => {
        const statusMap: Record<string, { type: Activity['type']; status: Activity['status']; label: string }> = {
          paid: { type: 'payment', status: 'success', label: 'Reserva pagada' },
          pending_payment: { type: 'alert', status: 'warning', label: 'Reserva pendiente de pago' },
          expired: { type: 'alert', status: 'error', label: 'Reserva expirada' },
          cancelled: { type: 'alert', status: 'error', label: 'Reserva cancelada' },
          converted: { type: 'sale', status: 'success', label: 'Reserva convertida a venta' },
        };
        const mapped = statusMap[r.status] || statusMap.pending_payment;
        activities.push({
          id: `res-${r.id}`,
          type: mapped.type,
          title: `${mapped.label} - ${r.buyer_name}`,
          description: `Monto: $${r.reservation_amount.toLocaleString('es-CL')}`,
          timestamp: new Date(r.created_at),
          status: mapped.status,
        });
      });

      // Map leads
      leads?.forEach(l => {
        activities.push({
          id: `lead-${l.id}`,
          type: 'lead',
          title: `Nuevo lead: ${l.first_name} ${l.last_name || ''}`.trim(),
          description: l.status === 'new' ? 'Pendiente de contactar' : `Estado: ${l.status}`,
          timestamp: new Date(l.created_at),
          status: l.status === 'new' ? 'info' : 'success',
        });
      });

      // Map sold lots
      soldLots?.forEach(l => {
        activities.push({
          id: `sale-${l.id}`,
          type: 'sale',
          title: `Venta confirmada - ${l.name || `Lote ${l.lot_number}`}`,
          description: l.price ? `$${l.price.toLocaleString('es-CL')}` : undefined,
          timestamp: new Date(l.sale_date || Date.now()),
          status: 'success',
        });
      });

      // Sort by timestamp descending
      return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8);
    },
    enabled: !!user,
  });
};

export const useDashboardProperties = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-properties', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: lots } = await supabase
        .from('lots')
        .select('id, lot_number, name, area, price, status, project_id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(6);

      return (lots || []).map(lot => ({
        id: lot.id,
        title: lot.name || `Lote ${lot.lot_number}`,
        area: `${lot.area} m²`,
        price: lot.price ? formatPrice(lot.price) : 'Sin precio',
        status: (lot.status || 'available') as 'available' | 'reserved' | 'sold',
        views: 0,
        inquiries: 0,
        score: lot.status === 'sold' ? 100 : lot.status === 'reserved' ? 75 : 50,
      }));
    },
    enabled: !!user,
  });
};

export const useSalesChartData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-sales-chart', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const { data: soldLots } = await supabase
        .from('lots')
        .select('price, sale_date')
        .eq('user_id', user.id)
        .eq('status', 'sold')
        .gte('sale_date', sixMonthsAgo.toISOString());

      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const now = new Date();
      const chartData = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthLots = soldLots?.filter(l => {
          if (!l.sale_date) return false;
          const sd = new Date(l.sale_date);
          return `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, '0')}` === monthKey;
        }) || [];

        chartData.push({
          month: months[d.getMonth()],
          ventas: monthLots.length,
          ingresos: Math.round(monthLots.reduce((s, l) => s + (l.price || 0), 0) / 1000000),
        });
      }

      return chartData;
    },
    enabled: !!user,
  });
};

export const useProjectSalesDistribution = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-project-distribution', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: lots } = await supabase
        .from('lots')
        .select('project_id, status')
        .eq('user_id', user.id)
        .eq('status', 'sold');

      if (!lots || lots.length === 0) return [];

      // Group by project
      const grouped: Record<string, number> = {};
      lots.forEach(l => {
        grouped[l.project_id] = (grouped[l.project_id] || 0) + 1;
      });

      // Get project names
      const projectIds = Object.keys(grouped);
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', projectIds);

      const colors = [
        'hsl(var(--primary))',
        'hsl(var(--accent))',
        'hsl(38, 92%, 50%)',
        'hsl(var(--muted-foreground))',
      ];

      return projectIds.map((pid, i) => ({
        name: projects?.find(p => p.id === pid)?.name || 'Proyecto',
        value: grouped[pid],
        color: colors[i % colors.length],
      }));
    },
    enabled: !!user,
  });
};

function formatPrice(price: number): string {
  if (price >= 1000000000) return `$${(price / 1000000000).toFixed(1)}B`;
  if (price >= 1000000) return `$${(price / 1000000).toFixed(0)}M`;
  return `$${price.toLocaleString('es-CL')}`;
}
