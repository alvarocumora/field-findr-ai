import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, Search, MoreVertical, Shield, UserCheck, Crown, Download, UserPlus, AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AppRole } from '@/hooks/useUserRole';

interface UserWithDetails {
  id: string;
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
  roles: AppRole[];
  plan_type: string | null;
}

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailUser, setDetailUser] = useState<UserWithDetails | null>(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users-full'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      const { data: allRoles } = await supabase.from('user_roles').select('*');
      const { data: subscriptions } = await supabase
        .from('subscriptions').select('user_id, plan_type, status');

      return profiles.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        email: p.email,
        first_name: p.first_name,
        last_name: p.last_name,
        created_at: p.created_at,
        updated_at: p.updated_at,
        roles: (allRoles || []).filter(r => r.user_id === p.user_id).map(r => r.role as AppRole),
        plan_type: (subscriptions || []).find(s => s.user_id === p.user_id && s.status === 'active')?.plan_type || null,
      })) as UserWithDetails[];
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-full'] });
      toast({ title: 'Rol asignado correctamente' });
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-full'] });
      toast({ title: 'Rol removido correctamente' });
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const bulkAssignRole = async (role: AppRole) => {
    for (const userId of selected) {
      const user = users?.find(u => u.user_id === userId);
      if (user && !user.roles.includes(role)) {
        await addRoleMutation.mutateAsync({ userId, role });
      }
    }
    setSelected(new Set());
  };

  const filteredUsers = useMemo(() => {
    return users?.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || 
        user.email?.toLowerCase().includes(searchLower) ||
        user.first_name?.toLowerCase().includes(searchLower) ||
        user.last_name?.toLowerCase().includes(searchLower);
      const matchRole = roleFilter === 'all' || 
        (roleFilter === 'none' ? user.roles.length === 0 : user.roles.includes(roleFilter as AppRole));
      const matchPlan = planFilter === 'all' || 
        (planFilter === 'free' ? !user.plan_type || user.plan_type === 'free' : user.plan_type === planFilter);
      return matchSearch && matchRole && matchPlan;
    });
  }, [users, searchTerm, roleFilter, planFilter]);

  const exportCSV = () => {
    if (!filteredUsers) return;
    const rows = [['Nombre', 'Email', 'Roles', 'Plan', 'Registro']];
    filteredUsers.forEach(u => {
      rows.push([
        `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        u.email || '',
        u.roles.join(', ') || 'Sin rol',
        u.plan_type || 'free',
        format(new Date(u.created_at), 'yyyy-MM-dd'),
      ]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'usuarios.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (userId: string) => {
    const next = new Set(selected);
    next.has(userId) ? next.delete(userId) : next.add(userId);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === (filteredUsers?.length || 0)) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredUsers?.map(u => u.user_id)));
    }
  };

  const getRoleBadge = (role: AppRole) => {
    const config: Record<AppRole, { variant: 'destructive' | 'default' | 'secondary'; icon: typeof Shield }> = {
      admin: { variant: 'destructive', icon: Shield },
      agent: { variant: 'default', icon: UserCheck },
      buyer: { variant: 'secondary', icon: Users },
    };
    const { variant, icon: Icon } = config[role];
    return <Badge key={role} variant={variant} className="gap-1"><Icon className="h-3 w-3" />{role}</Badge>;
  };

  const getPlanBadge = (planType: string | null) => {
    if (!planType || planType === 'free') return <Badge variant="outline">Gratis</Badge>;
    return <Badge variant="default" className="gap-1"><Crown className="h-3 w-3" />{planType === 'professional' ? 'Pro' : 'Enterprise'}</Badge>;
  };

  const userName = (u: UserWithDetails) => 
    (u.first_name || u.last_name) ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'Sin nombre';

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">Administra usuarios, roles y suscripciones</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={exportCSV}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg font-medium">{users?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por email, nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Rol" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="none">Sin rol</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Plan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los planes</SelectItem>
                <SelectItem value="free">Gratis</SelectItem>
                <SelectItem value="professional">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3 flex items-center justify-between">
            <span className="text-sm font-medium">{selected.size} usuarios seleccionados</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => bulkAssignRole('agent')}>
                <UserPlus className="h-4 w-4 mr-1" /> Asignar Agent
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkAssignRole('buyer')}>
                <UserPlus className="h-4 w-4 mr-1" /> Asignar Buyer
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader><CardTitle>Usuarios Registrados ({filteredUsers?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={selected.size > 0 && selected.size === filteredUsers?.length} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Últ. actividad</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id} className="cursor-pointer" onClick={() => setDetailUser(user)}>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox checked={selected.has(user.user_id)} onCheckedChange={() => toggleSelect(user.user_id)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.roles.length === 0 && <AlertCircle className="h-4 w-4 text-amber-500" />}
                        <div>
                          <p className="font-medium text-foreground">{userName(user)}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0 ? user.roles.map(getRoleBadge) : <span className="text-sm text-muted-foreground">Sin roles</span>}
                      </div>
                    </TableCell>
                    <TableCell>{getPlanBadge(user.plan_type)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(user.updated_at), { addSuffix: true, locale: es })}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(user.created_at), 'd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!user.roles.includes('agent') && (
                            <DropdownMenuItem onClick={() => addRoleMutation.mutate({ userId: user.user_id, role: 'agent' })}>
                              <UserCheck className="h-4 w-4 mr-2" />Asignar Agent
                            </DropdownMenuItem>
                          )}
                          {user.roles.includes('agent') && (
                            <DropdownMenuItem onClick={() => removeRoleMutation.mutate({ userId: user.user_id, role: 'agent' })}>
                              <UserCheck className="h-4 w-4 mr-2" />Remover Agent
                            </DropdownMenuItem>
                          )}
                          {!user.roles.includes('admin') && (
                            <DropdownMenuItem onClick={() => addRoleMutation.mutate({ userId: user.user_id, role: 'admin' })}>
                              <Shield className="h-4 w-4 mr-2" />Asignar Admin
                            </DropdownMenuItem>
                          )}
                          {user.roles.includes('admin') && (
                            <DropdownMenuItem onClick={() => removeRoleMutation.mutate({ userId: user.user_id, role: 'admin' })} className="text-destructive">
                              <Shield className="h-4 w-4 mr-2" />Remover Admin
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {filteredUsers?.length === 0 && !isLoading && (
            <p className="text-center text-muted-foreground py-8">No se encontraron usuarios</p>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={!!detailUser} onOpenChange={() => setDetailUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{detailUser && userName(detailUser)}</DialogTitle>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{detailUser.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Registro</p>
                  <p className="font-medium">{format(new Date(detailUser.created_at), 'd MMM yyyy', { locale: es })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Última actividad</p>
                  <p className="font-medium">{formatDistanceToNow(new Date(detailUser.updated_at), { addSuffix: true, locale: es })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Plan</p>
                  <div>{getPlanBadge(detailUser.plan_type)}</div>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-2">Roles</p>
                <div className="flex flex-wrap gap-2">
                  {detailUser.roles.length > 0 ? detailUser.roles.map(getRoleBadge) : (
                    <span className="text-sm text-amber-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" /> Sin roles asignados
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
