import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BrokerTreeNode {
  user_id: string;
  parent_user_id: string | null;
  depth: number;
  display_name: string;
  slug: string;
  level: string;
  is_active: boolean;
  joined_at: string;
  sales_count: number;
  sales_volume: number;
  commission_volume: number;
  override_generated: number;
}

export interface BrokerMetrics {
  broker_user_id: string;
  leads_total: number;
  leads_won: number;
  leads_active: number;
  sales_count: number;
  sales_volume: number;
  commission_paid: number;
  commission_pending: number;
  override_earned: number;
  override_pending: number;
  network_direct: number;
  network_total: number;
  projects_assigned: number;
}

export interface BrokerProjectAttribution {
  project_id: string;
  project_name: string;
  assignment_status: string | null;
  commission_rate: number;
  leads_count: number;
  leads_won: number;
  sales_count: number;
  sales_volume: number;
  commission_total: number;
  commission_paid: number;
  last_activity: string | null;
}

const rpc = supabase.rpc as CallableFunction;

/** Árbol de referidos (red) del broker indicado o del usuario actual. */
export const useBrokerReferralTree = (brokerUserId?: string, maxDepth = 5) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['broker-referral-tree', brokerUserId ?? user?.id, maxDepth],
    queryFn: async () => {
      const { data, error } = await rpc('get_broker_referral_tree', {
        p_root_user: brokerUserId ?? null,
        p_max_depth: maxDepth,
      });
      if (error) throw error;
      return (data ?? []) as BrokerTreeNode[];
    },
    enabled: !!user,
  });
};

/** Métricas agregadas del broker. */
export const useBrokerMetrics = (brokerUserId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['broker-metrics', brokerUserId ?? user?.id],
    queryFn: async () => {
      const { data, error } = await rpc('get_broker_metrics', {
        p_broker_user: brokerUserId ?? null,
      });
      if (error) throw error;
      return ((data ?? [])[0] ?? null) as BrokerMetrics | null;
    },
    enabled: !!user,
  });
};

/** Atribución de leads, ventas y comisiones por proyecto. */
export const useBrokerProjectAttribution = (brokerUserId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['broker-attribution', brokerUserId ?? user?.id],
    queryFn: async () => {
      const { data, error } = await rpc('get_broker_project_attribution', {
        p_broker_user: brokerUserId ?? null,
      });
      if (error) throw error;
      return (data ?? []) as BrokerProjectAttribution[];
    },
    enabled: !!user,
  });
};

/** Convierte la lista plana del árbol en nodos anidados por profundidad. */
export interface BrokerTreeBranch extends BrokerTreeNode {
  children: BrokerTreeBranch[];
}

export const buildBrokerTree = (rows: BrokerTreeNode[]): BrokerTreeBranch[] => {
  const map = new Map<string, BrokerTreeBranch>();
  rows.forEach((r) => map.set(r.user_id, { ...r, children: [] }));
  const roots: BrokerTreeBranch[] = [];
  map.forEach((node) => {
    const parent = node.parent_user_id ? map.get(node.parent_user_id) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  return roots;
};
