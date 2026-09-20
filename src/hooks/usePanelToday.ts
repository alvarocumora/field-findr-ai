import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMyOrganization } from '@/hooks/useMyOrganization';

/**
 * Pendientes del día, con un único origen de cálculo para todos los paneles.
 *
 * `scope`:
 *  - `self`      → solo mi actividad (corredor / consultor)
 *  - `team`      → dueño + miembros de mi organización (inmobiliaria)
 *  - `platform`  → cola de la plataforma (admin)
 */
export type PanelScope = 'self' | 'team' | 'platform';

export interface TodayItem {
  key: string;
  label: string;
  value: number;
  href: string;
  tone: 'default' | 'warning' | 'danger' | 'success';
  hint?: string;
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export const usePanelToday = (scope: PanelScope) => {
  const { user } = useAuth();
  const { data: org } = useMyOrganization();

  const teamIds = scope === 'team' ? (org?.teamUserIds ?? (user ? [user.id] : [])) : user ? [user.id] : [];

  return useQuery<TodayItem[]>({
    queryKey: ['panel-today', scope, user?.id, teamIds.join(',')],
    enabled: !!user,
    refetchInterval: 120_000,
    queryFn: async () => {
      if (!user) return [];

      if (scope === 'platform') {
        const [props, projects, reservations, tickets] = await Promise.all([
          supabase.from('property_approvals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('project_approvals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('status', 'pending_payment'),
          supabase.from('support_tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
        ]);

        return [
          { key: 'props', label: 'Propiedades por aprobar', value: props.count ?? 0, href: '/admin/approvals', tone: 'warning' },
          { key: 'projects', label: 'Loteos por aprobar', value: projects.count ?? 0, href: '/admin/project-approvals', tone: 'warning' },
          { key: 'reservations', label: 'Reservas por pagar', value: reservations.count ?? 0, href: '/admin/reservations', tone: 'default' },
          { key: 'tickets', label: 'Tickets de soporte abiertos', value: tickets.count ?? 0, href: '/admin/soporte', tone: 'danger' },
        ];
      }

      const ids = teamIds.length > 0 ? teamIds : [user.id];
      const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      const [leads, visits, reservations, commissions] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }).in('user_id', ids).eq('status', 'new'),
        supabase
          .from('visits')
          .select('id', { count: 'exact', head: true })
          .in('user_id', ids)
          .gte('scheduled_at', startOfToday().toISOString())
          .lte('scheduled_at', endOfToday().toISOString()),
        supabase
          .from('reservations')
          .select('id', { count: 'exact', head: true })
          .in('user_id', ids)
          .eq('status', 'pending_payment')
          .lte('expires_at', in48h),
        supabase
          .from('agent_commissions')
          .select('commission_amount, status')
          .in('agent_id', ids)
          // 'pending' es el estado legado previo al ledger de comisiones y
          // sigue existiendo en filas históricas.
          .in('status', ['pending', 'potential', 'reserved', 'earned', 'approved']),
      ]);

      const pendingCommission = (commissions.data ?? []).reduce(
        (sum, c: { commission_amount: number | string }) => sum + Number(c.commission_amount || 0),
        0,
      );

      return [
        {
          key: 'leads',
          label: 'Leads sin contactar',
          value: leads.count ?? 0,
          href: '/asesor/leads',
          tone: (leads.count ?? 0) > 0 ? 'warning' : 'default',
        },
        {
          key: 'visits',
          label: 'Visitas de hoy',
          value: visits.count ?? 0,
          href: '/asesor/visitas',
          tone: 'default',
        },
        {
          key: 'reservations',
          label: 'Reservas por vencer (48h)',
          value: reservations.count ?? 0,
          href: '/asesor/reservations',
          tone: (reservations.count ?? 0) > 0 ? 'danger' : 'default',
        },
        {
          key: 'commissions',
          label: 'Comisiones por cobrar',
          value: Math.round(pendingCommission),
          href: '/asesor/comisiones',
          tone: 'success',
          hint: 'monto',
        },
      ];
    },
  });
};
