import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Search, 
  MoreVertical,
  Shield,
  UserCheck,
  Crown
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AppRole } from '@/hooks/useUserRole';

interface UserWithDetails {
  id: string;
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  roles: AppRole[];
  plan_type: string | null;
}

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch all profiles with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Get all subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('user_id, plan_type, status');

      if (subsError) throw subsError;

      // Combine data
      return profiles.map((profile) => ({
        id: profile.id,
        user_id: profile.user_id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        created_at: profile.created_at,
        roles: allRoles
          .filter((r) => r.user_id === profile.user_id)
          .map((r) => r.role as AppRole),
        plan_type: subscriptions.find((s) => s.user_id === profile.user_id && s.status === 'active')?.plan_type || null,
      })) as UserWithDetails[];
    },
  });

  // Add role mutation
  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Rol asignado correctamente' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Rol removido correctamente' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const filteredUsers = users?.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const getRoleBadge = (role: AppRole) => {
    const config = {
      admin: { variant: 'destructive' as const, icon: Shield },
      agent: { variant: 'default' as const, icon: UserCheck },
      buyer: { variant: 'secondary' as const, icon: Users },
    };
    const { variant, icon: Icon } = config[role];
    return (
      <Badge key={role} variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {role}
      </Badge>
    );
  };

  const getPlanBadge = (planType: string | null) => {
    if (!planType || planType === 'free') {
      return <Badge variant="outline">Gratis</Badge>;
    }
    return (
      <Badge variant="default" className="gap-1">
        <Crown className="h-3 w-3" />
        {planType === 'professional' ? 'Pro' : 'Enterprise'}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-muted-foreground mt-1">
              Administra usuarios, roles y suscripciones
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg font-medium">{users?.length || 0} usuarios</span>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios Registrados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.first_name || user.last_name
                              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                              : 'Sin nombre'}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map(getRoleBadge)
                          ) : (
                            <span className="text-sm text-muted-foreground">Sin roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(user.plan_type)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), 'd MMM yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!user.roles.includes('agent') && (
                              <DropdownMenuItem
                                onClick={() => addRoleMutation.mutate({ userId: user.user_id, role: 'agent' })}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Asignar rol Agent
                              </DropdownMenuItem>
                            )}
                            {user.roles.includes('agent') && (
                              <DropdownMenuItem
                                onClick={() => removeRoleMutation.mutate({ userId: user.user_id, role: 'agent' })}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Remover rol Agent
                              </DropdownMenuItem>
                            )}
                            {!user.roles.includes('admin') && (
                              <DropdownMenuItem
                                onClick={() => addRoleMutation.mutate({ userId: user.user_id, role: 'admin' })}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Asignar rol Admin
                              </DropdownMenuItem>
                            )}
                            {user.roles.includes('admin') && (
                              <DropdownMenuItem
                                onClick={() => removeRoleMutation.mutate({ userId: user.user_id, role: 'admin' })}
                                className="text-destructive"
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Remover rol Admin
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
              <p className="text-center text-muted-foreground py-8">
                No se encontraron usuarios
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminUsers;
