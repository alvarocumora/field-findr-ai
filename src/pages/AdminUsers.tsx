import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  Users, Search, Shield, UserCheck, Crown, Download, UserPlus,
  AlertCircle, Ban, KeyRound, Trash2, Sparkles, TrendingUp, Activity,
  Mail, RefreshCw, ChevronRight,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, subDays, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AppRole } from '@/hooks/useUserRole';

interface UserWithDetails {
  id: string;
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  roles: AppRole[];
  plan_type: string | null;
  plan_status: string | null;
}

interface UserActivity {
  id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const ROLE_META: Record<AppRole, { label: string; className: string; icon: typeof Shield }> = {
  admin: { label: 'Admin', className: 'bg-rose-500/15 text-rose-400 border-rose-500/30', icon: Shield },
  agent: { label: 'Agente', className: 'bg-sky-500/15 text-sky-400 border-sky-500/30', icon: UserCheck },
  buyer: { label: 'Comprador', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: Users },
};

const AdminUsers = () => {
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailUser, setDetailUser] = useState<UserWithDetails | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<UserWithDetails | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState<UserWithDetails | null>(null);

  const { data: users, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-users-full'],
    queryFn: async () => {
      const [profilesRes, rolesRes, subsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*'),
        supabase.from('subscriptions').select('user_id, plan_type, status'),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      const roles = rolesRes.data || [];
      const subs = subsRes.data || [];
      return (profilesRes.data ?? []).map((p) => {
        const activeSub = subs.find((s) => s.user_id === p.user_id && s.status === 'active');
        return {
          id: p.id,
          user_id: p.user_id,
          email: p.email,
          first_name: p.first_name,
          last_name: p.last_name,
          phone: p.phone,
          created_at: p.created_at,
          updated_at: p.updated_at,
          roles: roles.filter((r) => r.user_id === p.user_id).map((r) => r.role as AppRole),
          plan_type: activeSub?.plan_type ?? null,
          plan_status: activeSub?.status ?? null,
        } as UserWithDetails;
      });
    },
  });

  // KPIs
  const kpis = useMemo(() => {
    const list = users ?? [];
    const now = new Date();
    const d30 = subDays(now, 30);
    const d7 = subDays(now, 7);
    return {
      total: list.length,
      new30: list.filter((u) => isAfter(new Date(u.created_at), d30)).length,
      active7: list.filter((u) => isAfter(new Date(u.updated_at), d7)).length,
      paying: list.filter((u) => u.plan_type && u.plan_type !== 'free').length,
      noRole: list.filter((u) => u.roles.length === 0).length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const now = new Date();
    return users.filter((u) => {
      const s = searchTerm.trim().toLowerCase();
      const matchSearch =
        !s ||
        u.email?.toLowerCase().includes(s) ||
        u.first_name?.toLowerCase().includes(s) ||
        u.last_name?.toLowerCase().includes(s);
      const matchRole =
        roleFilter === 'all' ||
        (roleFilter === 'none' ? u.roles.length === 0 : u.roles.includes(roleFilter as AppRole));
      const matchPlan =
        planFilter === 'all' ||
        (planFilter === 'free' ? !u.plan_type || u.plan_type === 'free' : u.plan_type === planFilter);
      const matchDate =
        dateFilter === 'all' ||
        (dateFilter === '7' && isAfter(new Date(u.created_at), subDays(now, 7))) ||
        (dateFilter === '30' && isAfter(new Date(u.created_at), subDays(now, 30))) ||
        (dateFilter === '90' && isAfter(new Date(u.created_at), subDays(now, 90)));
      return matchSearch && matchRole && matchPlan && matchDate;
    });
  }, [users, searchTerm, roleFilter, planFilter, dateFilter]);

  // Role mutations
  const roleMutation = useMutation({
    mutationFn: async ({ userId, role, op }: { userId: string; role: AppRole; op: 'add' | 'remove' }) => {
      if (op === 'add') {
        const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles').delete().eq('user_id', userId).eq('role', role);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['admin-users-full'] });
      toast({ title: v.op === 'add' ? 'Rol asignado' : 'Rol removido' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const adminAction = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke('admin-users', { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(typeof data.error === 'string' ? data.error : 'Error');
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users-full'] }),
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const bulkAssignRole = async (role: AppRole) => {
    const targets = Array.from(selected);
    for (const userId of targets) {
      const u = users?.find((x) => x.user_id === userId);
      if (u && !u.roles.includes(role)) {
        await roleMutation.mutateAsync({ userId, role, op: 'add' });
      }
    }
    setSelected(new Set());
  };

  const exportCSV = () => {
    if (!filteredUsers.length) return;
    const rows = [['Nombre', 'Email', 'Telefono', 'Roles', 'Plan', 'Registro', 'Ult. actividad']];
    filteredUsers.forEach((u) => {
      rows.push([
        `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(),
        u.email ?? '',
        u.phone ?? '',
        u.roles.join('|') || 'sin_rol',
        u.plan_type ?? 'free',
        format(new Date(u.created_at), 'yyyy-MM-dd'),
        format(new Date(u.updated_at), 'yyyy-MM-dd'),
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const toggleAll = () => {
    setSelected(
      selected.size === filteredUsers.length && filteredUsers.length > 0
        ? new Set()
        : new Set(filteredUsers.map((u) => u.user_id)),
    );
  };

  const userName = (u: UserWithDetails) =>
    (u.first_name || u.last_name) ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() : 'Sin nombre';

  const initials = (u: UserWithDetails) => {
    const n = userName(u);
    if (n === 'Sin nombre') return u.email?.[0]?.toUpperCase() ?? '?';
    return n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  };

  const RoleBadge = ({ role }: { role: AppRole }) => {
    const meta = ROLE_META[role];
    const Icon = meta.icon;
    return (
      <Badge variant="outline" className={`gap-1 ${meta.className}`}>
        <Icon className="h-3 w-3" />
        {meta.label}
      </Badge>
    );
  };

  const PlanBadge = ({ plan }: { plan: string | null }) =>
    !plan || plan === 'free' ? (
      <Badge variant="outline" className="text-muted-foreground border-border/60">Gratis</Badge>
    ) : (
      <Badge className="gap-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/30">
        <Crown className="h-3 w-3" />
        {plan}
      </Badge>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Usuarios</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Administra cuentas, roles, planes y acciones sensibles con auditoría completa.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refrescar
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" /> CSV
            </Button>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" /> Invitar usuario
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard label="Total" value={kpis.total} icon={Users} tone="default" />
          <KpiCard label="Nuevos (30d)" value={kpis.new30} icon={Sparkles} tone="emerald" />
          <KpiCard label="Activos (7d)" value={kpis.active7} icon={Activity} tone="sky" />
          <KpiCard label="Con plan" value={kpis.paying} icon={TrendingUp} tone="amber" />
          <KpiCard label="Sin rol" value={kpis.noRole} icon={AlertCircle} tone="rose" />
        </div>

        {/* Filters */}
        <Card className="border-border/60 bg-card/50 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="buyer">Comprador</SelectItem>
                  <SelectItem value="none">Sin rol</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los planes</SelectItem>
                  <SelectItem value="free">Gratis</SelectItem>
                  <SelectItem value="corredor">Corredor</SelectItem>
                  <SelectItem value="corredora">Corredora</SelectItem>
                  <SelectItem value="inmobiliaria">Inmobiliaria</SelectItem>
                  <SelectItem value="grupo">Grupo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquier fecha</SelectItem>
                  <SelectItem value="7">Últimos 7 días</SelectItem>
                  <SelectItem value="30">Últimos 30 días</SelectItem>
                  <SelectItem value="90">Últimos 90 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="py-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-medium">{selected.size} seleccionados</span>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => bulkAssignRole('agent')}>Asignar Agente</Button>
                <Button size="sm" variant="outline" onClick={() => bulkAssignRole('buyer')}>Asignar Comprador</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User list — card style */}
        <Card className="border-border/60 bg-card/50 backdrop-blur">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground">
              <Checkbox
                checked={selected.size > 0 && selected.size === filteredUsers.length}
                onCheckedChange={toggleAll}
                aria-label="Seleccionar todos"
              />
              <span className="flex-1">Usuario</span>
              <span className="hidden md:block w-40">Roles</span>
              <span className="hidden md:block w-24">Plan</span>
              <span className="hidden md:block w-32">Últ. actividad</span>
              <span className="w-10" />
            </div>
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                No se encontraron usuarios con estos filtros.
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {filteredUsers.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer group"
                    onClick={() => setDetailUser(u)}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.has(u.user_id)}
                        onCheckedChange={() => toggleSelect(u.user_id)}
                        aria-label={`Seleccionar ${userName(u)}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary/30 to-sky-500/30 border border-border/60 grid place-items-center font-medium text-sm text-foreground">
                        {initials(u)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate flex items-center gap-2">
                          {userName(u)}
                          {u.roles.length === 0 && <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{u.email ?? '—'}</p>
                      </div>
                    </div>
                    <div className="hidden md:flex w-40 flex-wrap gap-1">
                      {u.roles.length > 0
                        ? u.roles.map((r) => <RoleBadge key={r} role={r} />)
                        : <span className="text-xs text-muted-foreground">Sin roles</span>}
                    </div>
                    <div className="hidden md:block w-24"><PlanBadge plan={u.plan_type} /></div>
                    <div className="hidden md:block w-32 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(u.updated_at), { addSuffix: true, locale: es })}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!detailUser} onOpenChange={(o) => !o && setDetailUser(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
          {detailUser && (
            <UserDetailPanel
              user={detailUser}
              onRoleToggle={(role, op) => roleMutation.mutate({ userId: detailUser.user_id, role, op })}
              onSuspend={() => setConfirmSuspend(detailUser)}
              onUnsuspend={() =>
                adminAction.mutate(
                  { action: 'unsuspend', user_id: detailUser.user_id },
                  { onSuccess: () => toast({ title: 'Usuario reactivado' }) },
                )
              }
              onReset={() =>
                detailUser.email &&
                adminAction.mutate(
                  { action: 'reset_password', user_id: detailUser.user_id, email: detailUser.email },
                  { onSuccess: () => toast({ title: 'Email de restablecimiento enviado' }) },
                )
              }
              onDelete={() => setConfirmDelete(detailUser)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Invite dialog */}
      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSubmit={(payload) =>
          adminAction.mutate(
            { action: 'invite', ...payload },
            {
              onSuccess: () => {
                toast({ title: 'Invitación enviada', description: `A ${payload.email}` });
                setInviteOpen(false);
              },
            },
          )
        }
        pending={adminAction.isPending}
      />

      {/* Confirm suspend */}
      <AlertDialog open={!!confirmSuspend} onOpenChange={(o) => !o && setConfirmSuspend(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspender acceso</AlertDialogTitle>
            <AlertDialogDescription>
              El usuario no podrá iniciar sesión durante 30 días. Podrás reactivarlo en cualquier momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmSuspend) return;
                adminAction.mutate(
                  { action: 'suspend', user_id: confirmSuspend.user_id, hours: 24 * 30 },
                  {
                    onSuccess: () => {
                      toast({ title: 'Usuario suspendido' });
                      setConfirmSuspend(null);
                    },
                  },
                );
              }}
            >
              Suspender
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cuenta permanentemente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán los datos asociados en cascada
              (perfil, favoritos, mensajes, etc.). Los registros que apuntan a la cuenta se mantendrán en auditoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (!confirmDelete) return;
                adminAction.mutate(
                  { action: 'delete', user_id: confirmDelete.user_id },
                  {
                    onSuccess: () => {
                      toast({ title: 'Cuenta eliminada' });
                      setConfirmDelete(null);
                      setDetailUser(null);
                    },
                  },
                );
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ------ Subcomponents ------

const KpiCard = ({
  label, value, icon: Icon, tone,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  tone: 'default' | 'emerald' | 'sky' | 'amber' | 'rose';
}) => {
  const toneCls: Record<typeof tone, string> = {
    default: 'text-foreground',
    emerald: 'text-emerald-400',
    sky: 'text-sky-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
  } as const;
  return (
    <Card className="border-border/60 bg-card/50 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${toneCls[tone]}`} />
        </div>
        <div className={`text-2xl font-bold mt-1 ${toneCls[tone]}`}>{value.toLocaleString('es-CL')}</div>
      </CardContent>
    </Card>
  );
};

const UserDetailPanel = ({
  user, onRoleToggle, onSuspend, onUnsuspend, onReset, onDelete,
}: {
  user: UserWithDetails;
  onRoleToggle: (role: AppRole, op: 'add' | 'remove') => void;
  onSuspend: () => void;
  onUnsuspend: () => void;
  onReset: () => void;
  onDelete: () => void;
}) => {
  const { data: activity } = useQuery({
    queryKey: ['user-activity', user.user_id],
    queryFn: async () => {
      const [events, audit] = await Promise.all([
        supabase
          .from('user_events')
          .select('id, event_type, metadata, created_at')
          .eq('user_id', user.user_id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('audit_logs')
          .select('id, action, entity_type, entity_id, details, created_at')
          .eq('entity_id', user.user_id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);
      return {
        events: (events.data ?? []) as UserActivity[],
        audit: audit.data ?? [],
      };
    },
  });

  const name = (user.first_name || user.last_name)
    ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
    : 'Sin nombre';

  return (
    <>
      <div className="p-6 border-b border-border/60 bg-gradient-to-br from-primary/10 via-transparent to-sky-500/10">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/40 to-sky-500/40 border border-border/60 grid place-items-center text-lg font-semibold">
            {(name === 'Sin nombre' ? user.email?.[0] : name.split(' ').map((p) => p[0]).slice(0, 2).join('')) ?? '?'}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold truncate">{name}</h2>
            <p className="text-sm text-muted-foreground truncate">{user.email ?? '—'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {user.roles.length > 0
            ? user.roles.map((r) => {
              const meta = ROLE_META[r];
              const Icon = meta.icon;
              return (
                <Badge key={r} variant="outline" className={`gap-1 ${meta.className}`}>
                  <Icon className="h-3 w-3" />{meta.label}
                </Badge>
              );
            })
            : <Badge variant="outline" className="text-amber-400 border-amber-500/30">Sin rol asignado</Badge>}
          {user.plan_type && user.plan_type !== 'free' && (
            <Badge className="gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Crown className="h-3 w-3" />{user.plan_type}
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="info" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-6 mt-4 grid grid-cols-4 w-auto">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
          <TabsTrigger value="danger" className="text-rose-400 data-[state=active]:text-rose-400">
            Peligro
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="info" className="p-6 space-y-4 mt-0">
            <EditProfileForm user={user} />
            <InfoRow label="Email" value={user.email ?? '—'} />
            <InfoRow label="Teléfono" value={user.phone ?? '—'} />
            <InfoRow label="Plan" value={user.plan_type ?? 'Gratis'} />
            <InfoRow
              label="Registrado"
              value={format(new Date(user.created_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
            />
            <InfoRow
              label="Última actividad"
              value={formatDistanceToNow(new Date(user.updated_at), { addSuffix: true, locale: es })}
            />
            <InfoRow label="User ID" value={user.user_id} mono />
          </TabsContent>

          <TabsContent value="roles" className="p-6 space-y-3 mt-0">
            <p className="text-sm text-muted-foreground">Activa o desactiva roles individualmente.</p>
            {(['admin', 'agent', 'buyer'] as AppRole[]).map((role) => {
              const has = user.roles.includes(role);
              const meta = ROLE_META[role];
              const Icon = meta.icon;
              return (
                <div
                  key={role}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-card/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-md grid place-items-center ${meta.className}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {role === 'admin' && 'Acceso total a administración'}
                        {role === 'agent' && 'Puede crear listings y proyectos'}
                        {role === 'buyer' && 'Puede reservar y guardar favoritos'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={has ? 'destructive' : 'default'}
                    onClick={() => onRoleToggle(role, has ? 'remove' : 'add')}
                  >
                    {has ? 'Remover' : 'Asignar'}
                  </Button>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="activity" className="p-6 space-y-3 mt-0">
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4" /> Eventos recientes
              </h3>
              {activity?.events.length ? (
                <ul className="space-y-2">
                  {activity.events.map((e) => (
                    <li
                      key={e.id}
                      className="text-xs p-2 rounded border border-border/40 bg-card/50 flex items-center justify-between"
                    >
                      <span className="font-mono text-foreground">{e.event_type}</span>
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(e.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Sin eventos registrados.</p>
              )}
            </section>
            <section className="pt-3 border-t border-border/40">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" /> Auditoría administrativa
              </h3>
              {activity?.audit.length ? (
                <ul className="space-y-2">
                  {activity.audit.map((a) => (
                    <li key={a.id} className="text-xs p-2 rounded border border-border/40 bg-card/50">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-foreground">{a.action}</span>
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Sin acciones administrativas registradas.</p>
              )}
            </section>
          </TabsContent>

          <TabsContent value="danger" className="p-6 space-y-3 mt-0">
            <p className="text-xs text-muted-foreground">
              Estas acciones son sensibles y quedan registradas en la auditoría del sistema.
            </p>
            <DangerAction
              icon={KeyRound}
              title="Enviar restablecimiento de contraseña"
              description="Envía un email al usuario para que cree una nueva contraseña."
              onClick={onReset}
            />
            <DangerAction
              icon={Ban}
              title="Suspender acceso 30 días"
              description="Bloquea el inicio de sesión temporalmente."
              onClick={onSuspend}
            />
            <DangerAction
              icon={RefreshCw}
              title="Reactivar cuenta"
              description="Levanta cualquier suspensión activa."
              onClick={onUnsuspend}
            />
            <DangerAction
              icon={Trash2}
              title="Eliminar cuenta permanentemente"
              description="Borrado en cascada. No se puede deshacer."
              destructive
              onClick={onDelete}
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </>
  );
};

const EditProfileForm = ({ user }: { user: UserWithDetails }) => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [first, setFirst] = useState(user.first_name ?? '');
  const [last, setLast] = useState(user.last_name ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ first_name: first.trim() || null, last_name: last.trim() || null, phone: phone.trim() || null })
        .eq('user_id', user.user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users-full'] });
      toast({ title: 'Datos actualizados' });
      setEditing(false);
    },
    onError: (e: Error) => toast({ title: 'No se pudo guardar', description: e.message, variant: 'destructive' }),
  });
  if (!editing) {
    return (
      <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Editar datos</Button>
    );
  }
  return (
    <div className="space-y-3 p-3 rounded-lg border border-border/60 bg-card/50">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label htmlFor="ef-first">Nombre</Label><Input id="ef-first" value={first} onChange={(e) => setFirst(e.target.value)} /></div>
        <div className="space-y-1"><Label htmlFor="ef-last">Apellido</Label><Input id="ef-last" value={last} onChange={(e) => setLast(e.target.value)} /></div>
      </div>
      <div className="space-y-1"><Label htmlFor="ef-phone">Teléfono</Label><Input id="ef-phone" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>Guardar</Button>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-border/30 last:border-0">
    <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
    <span className={`text-sm text-foreground text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
  </div>
);

const DangerAction = ({
  icon: Icon, title, description, onClick, destructive,
}: {
  icon: typeof Ban;
  title: string;
  description: string;
  onClick: () => void;
  destructive?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-3 rounded-lg border transition-colors flex items-start gap-3 ${
      destructive
        ? 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10'
        : 'border-border/60 bg-card/50 hover:bg-muted/40'
    }`}
  >
    <Icon className={`h-4 w-4 mt-0.5 ${destructive ? 'text-rose-400' : 'text-muted-foreground'}`} />
    <div className="min-w-0">
      <p className={`text-sm font-medium ${destructive ? 'text-rose-400' : 'text-foreground'}`}>{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  </button>
);

const InviteDialog = ({
  open, onOpenChange, onSubmit, pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (p: { email: string; first_name?: string; last_name?: string; role: AppRole }) => void;
  pending: boolean;
}) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<AppRole>('buyer');

  const reset = () => { setEmail(''); setFirstName(''); setLastName(''); setRole('buyer'); };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Invitar usuario
          </DialogTitle>
          <DialogDescription>
            Enviaremos un email con el enlace para crear la cuenta.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="inv-email">Email *</Label>
            <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@ejemplo.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="inv-fn">Nombre</Label>
              <Input id="inv-fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="inv-ln">Apellido</Label>
              <Input id="inv-ln" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Rol inicial</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Comprador</SelectItem>
                <SelectItem value="agent">Agente</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!email || pending}
            onClick={() => onSubmit({ email, first_name: firstName || undefined, last_name: lastName || undefined, role })}
          >
            {pending ? 'Enviando…' : 'Enviar invitación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminUsers;
