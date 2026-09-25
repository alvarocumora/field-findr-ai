import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PLANS = ['free', 'corredor', 'corredora', 'inmobiliaria', 'grupo', 'enterprise'];
const STATUSES = ['active', 'trialing', 'past_due', 'cancelled', 'suspended'];
const ROLES = ['buyer', 'agent', 'admin'] as const;

/** Super admin: subscriptions, plan changes and role permissions in one place. */
export default function SubscriptionsAdmin() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const [subs, profiles, roles] = await Promise.all([
        supabase.from('subscriptions').select('id, user_id, plan_type, status, current_period_end, updated_at').order('updated_at', { ascending: false }),
        supabase.from('profiles').select('user_id, email, first_name, last_name, company_name'),
        supabase.from('user_roles').select('user_id, role'),
      ]);
      for (const r of [subs, profiles, roles]) if (r.error) throw r.error;
      const subByUser = new Map((subs.data ?? []).map((s) => [s.user_id, s]));
      const rolesByUser = new Map<string, string[]>();
      (roles.data ?? []).forEach((r) => rolesByUser.set(r.user_id, [...(rolesByUser.get(r.user_id) ?? []), r.role]));
      return (profiles.data ?? []).map((p) => ({ ...p, sub: subByUser.get(p.user_id) ?? null, roles: rolesByUser.get(p.user_id) ?? [] }));
    },
  });

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data ?? []).filter((r) => !t || `${r.email} ${r.first_name} ${r.last_name} ${r.company_name}`.toLowerCase().includes(t));
  }, [data, q]);

  const audit = (action: string, entity_id: string, details: Record<string, unknown>) =>
    supabase.from('audit_logs').insert({ user_id: user?.id, action, entity_type: 'subscription', entity_id, details: details as never });

  const setPlan = async (userId: string, subId: string | null, patch: { plan_type?: string; status?: string }) => {
    const res = subId
      ? await supabase.from('subscriptions').update(patch).eq('id', subId)
      : await supabase.from('subscriptions').insert({ user_id: userId, plan_type: patch.plan_type ?? 'free', status: patch.status ?? 'active' });
    if (res.error) return toast.error(`No se pudo guardar: ${res.error.message}`);
    await audit('admin_subscription_update', userId, patch);
    toast.success('Suscripción actualizada');
    qc.invalidateQueries({ queryKey: ['admin-subscriptions'] });
  };

  const toggleRole = async (userId: string, role: (typeof ROLES)[number], has: boolean) => {
    if (userId === user?.id && role === 'admin' && has) return toast.error('No puedes quitarte tu propio rol de administrador.');
    const res = has
      ? await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role)
      : await supabase.from('user_roles').insert({ user_id: userId, role });
    if (res.error) return toast.error(`No se pudo cambiar el permiso: ${res.error.message}`);
    await audit(has ? 'admin_role_removed' : 'admin_role_added', userId, { role });
    toast.success('Permisos actualizados');
    qc.invalidateQueries({ queryKey: ['admin-subscriptions'] });
  };

  const active = (data ?? []).filter((r) => r.sub?.status === 'active' && r.sub.plan_type !== 'free').length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suscripciones y permisos</h1>
        <p className="text-sm text-muted-foreground">Plan, estado y roles de cada cuenta. Todo cambio queda en la auditoría.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Cuentas</p><p className="text-2xl font-bold">{data?.length ?? '—'}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Planes de pago activos</p><p className="text-2xl font-bold">{data ? active : '—'}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Administradores</p><p className="text-2xl font-bold">{data ? data.filter((r) => r.roles.includes('admin')).length : '—'}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Cuentas</CardTitle>
          <Input placeholder="Buscar por nombre, correo o empresa" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? <p className="text-sm text-muted-foreground">Cargando…</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Cuenta</TableHead><TableHead>Plan</TableHead><TableHead>Estado</TableHead><TableHead>Permisos</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.user_id}>
                    <TableCell>
                      <p className="font-medium">{[r.first_name, r.last_name].filter(Boolean).join(' ') || r.email}</p>
                      <p className="text-xs text-muted-foreground">{r.email}{r.company_name ? ` · ${r.company_name}` : ''}</p>
                    </TableCell>
                    <TableCell>
                      <Select value={r.sub?.plan_type ?? 'free'} onValueChange={(v) => setPlan(r.user_id, r.sub?.id ?? null, { plan_type: v })}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>{PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={r.sub?.status ?? 'active'} onValueChange={(v) => setPlan(r.user_id, r.sub?.id ?? null, { status: v })}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="space-x-1">
                      {ROLES.map((role) => {
                        const has = r.roles.includes(role);
                        return (
                          <Badge key={role} variant={has ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleRole(r.user_id, role, has)}>
                            {role}
                          </Badge>
                        );
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
