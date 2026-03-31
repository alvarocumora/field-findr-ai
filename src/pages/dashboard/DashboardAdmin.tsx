import { useState } from 'react';
import { 
  Users, Building2, TrendingUp, Shield, Settings, BarChart3, Bell, Search, Filter,
  MoreVertical, AlertTriangle, CheckCircle2, Loader2, Calendar, FileText, FolderKanban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminStats, useAdminUsers, useAdminListings, useAdminAuditLogs, useAdminDocumentStats } from '@/hooks/useDashboardStats';
import { formatDistanceToNow, format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ReservationsManager from '@/components/reservations/ReservationsManager';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Analytics Tab
const AnalyticsTab = () => {
  const { data: roleData } = useQuery({
    queryKey: ['admin-role-distribution'],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('role');
      const counts: Record<string, number> = {};
      data?.forEach(r => { counts[r.role] = (counts[r.role] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  const { data: registrationData } = useQuery({
    queryKey: ['admin-registration-trend'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('created_at').order('created_at');
      const weeks: Record<string, number> = {};
      data?.forEach(p => {
        const d = new Date(p.created_at);
        const weekStart = format(startOfWeek(d, { weekStartsOn: 1 }), 'dd/MM');
        weeks[weekStart] = (weeks[weekStart] || 0) + 1;
      });
      return Object.entries(weeks).slice(-8).map(([week, count]) => ({ week, count }));
    },
  });

  const { data: listingsByStatus } = useQuery({
    queryKey: ['admin-listings-by-status'],
    queryFn: async () => {
      const { data } = await supabase.from('listings').select('status');
      const counts: Record<string, number> = {};
      data?.forEach(l => {
        const s = l.status || 'unknown';
        counts[s] = (counts[s] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-border/40">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Registros por Semana</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={registrationData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Distribución de Roles</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={roleData || []} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {(roleData || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/40 lg:col-span-2">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Propiedades por Estado</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={listingsByStatus || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={80} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

// Security Tab
const SecurityTab = () => {
  const [actionFilter, setActionFilter] = useState('all');
  const { data: logs, isLoading } = useAdminAuditLogs(actionFilter);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por acción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="role_change">Cambio de rol</SelectItem>
            <SelectItem value="reservation">Reservas</SelectItem>
            <SelectItem value="document">Documentos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/40">
        <ScrollArea className="h-[500px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="divide-y divide-border/40">
              {logs.map((log: any) => (
                <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center mt-0.5">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{log.action}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {log.entity_type && `${log.entity_type}`}
                          {log.ip_address && ` • IP: ${log.ip_address}`}
                        </p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/30 px-2 py-1 rounded">
                            {JSON.stringify(log.details).slice(0, 120)}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Shield className="h-8 w-8 mb-2" />
              <p>No hay registros de auditoría</p>
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
};

// Documents Tab
const DocumentsTab = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: docStats } = useAdminDocumentStats();

  const { data: docs, isLoading } = useQuery({
    queryKey: ['admin-all-docs', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('transaction_documents')
        .select('*, reservations(buyer_name, lot_id, lots(lot_number, project_id, projects(name)))')
        .order('created_at', { ascending: false })
        .limit(50);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-500',
    uploaded: 'bg-blue-500/10 text-blue-500',
    under_review: 'bg-purple-500/10 text-purple-500',
    approved: 'bg-emerald-500/10 text-emerald-500',
    rejected: 'bg-destructive/10 text-destructive',
    expired: 'bg-muted text-muted-foreground',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente', uploaded: 'Subido', under_review: 'En Revisión',
    approved: 'Aprobado', rejected: 'Rechazado', expired: 'Vencido',
  };

  return (
    <div className="space-y-4">
      {/* Doc Stats */}
      {docStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-border/40"><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{docStats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent></Card>
          <Card className="border-border/40"><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{docStats.pending}</p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent></Card>
          <Card className="border-border/40"><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-500">{docStats.approved}</p>
            <p className="text-xs text-muted-foreground">Aprobados</p>
          </CardContent></Card>
          <Card className="border-border/40"><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{docStats.expiringSoon}</p>
            <p className="text-xs text-muted-foreground">Por Vencer</p>
          </CardContent></Card>
        </div>
      )}

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="uploaded">Subido</SelectItem>
            <SelectItem value="under_review">En Revisión</SelectItem>
            <SelectItem value="approved">Aprobado</SelectItem>
            <SelectItem value="rejected">Rechazado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/40">
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : docs && docs.length > 0 ? (
            <div className="divide-y divide-border/40">
              {docs.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{doc.doc_type?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {(doc.reservations as any)?.buyer_name} • {(doc.reservations as any)?.lots?.projects?.name || 'Sin proyecto'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {doc.deadline && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(doc.deadline), 'dd/MM/yy')}
                      </span>
                    )}
                    <Badge variant="secondary" className={statusColors[doc.status] || ''}>
                      {statusLabels[doc.status] || doc.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <FileText className="h-8 w-8 mb-2" />
              <p>No hay documentos</p>
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
};

const DashboardAdmin = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: users, isLoading: usersLoading } = useAdminUsers(searchQuery);
  const { data: listings, isLoading: listingsLoading } = useAdminListings();
  const { data: docStats } = useAdminDocumentStats();

  // GMV - total reservation amounts
  const { data: gmvData } = useQuery({
    queryKey: ['admin-gmv'],
    queryFn: async () => {
      const { data } = await supabase
        .from('reservations')
        .select('reservation_amount, status')
        .in('status', ['paid', 'converted']);
      const total = data?.reduce((sum, r) => sum + (r.reservation_amount || 0), 0) || 0;
      return { total, count: data?.length || 0 };
    },
  });

  const formatGMV = (v: number) => {
    if (v >= 1000000000) return `$${(v / 1000000000).toFixed(1)}B`;
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    return `$${v.toLocaleString('es-CL')}`;
  };

  const statsConfig = [
    { label: 'Usuarios Totales', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500' },
    { label: 'Reservas Pagadas', value: gmvData?.count || 0, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'GMV Total', value: formatGMV(gmvData?.total || 0), icon: Building2, color: 'text-purple-500' },
    { label: 'Docs Pendientes', value: docStats?.pending || 0, icon: FileText, color: 'text-amber-500' },
  ];

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      agent: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      buyer: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    };
    return styles[role] || styles.buyer;
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000000) return `$${(price / 1000000000).toFixed(1)}B`;
    if (price >= 1000000) return `$${(price / 1000000).toFixed(0)}M`;
    return `$${price.toLocaleString('es-CL')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Panel de Administración</h1>
            <p className="text-muted-foreground mt-1">Gestiona usuarios, propiedades, documentos y seguridad</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="rounded-xl"><Bell className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" className="rounded-xl"><Settings className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsConfig.map((stat, index) => (
            <Card key={index} className="border-border/40 bg-card/50 backdrop-blur">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                      <p className="text-2xl font-bold text-foreground">{typeof stat.value === 'number' ? stat.value.toLocaleString('es-CL') : stat.value}</p>
                    )}
                  </div>
                  <div className={`h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl flex-wrap h-auto">
            <TabsTrigger value="users" className="rounded-lg gap-2"><Users className="h-4 w-4" />Usuarios</TabsTrigger>
            <TabsTrigger value="properties" className="rounded-lg gap-2"><Building2 className="h-4 w-4" />Propiedades</TabsTrigger>
            <TabsTrigger value="reservations" className="rounded-lg gap-2"><Calendar className="h-4 w-4" />Reservas</TabsTrigger>
            <TabsTrigger value="documents" className="rounded-lg gap-2"><FileText className="h-4 w-4" />Documentos</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg gap-2"><BarChart3 className="h-4 w-4" />Analíticas</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg gap-2"><Shield className="h-4 w-4" />Seguridad</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar usuarios..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl" />
              </div>
            </div>
            <Card className="border-border/40">
              <ScrollArea className="h-[400px]">
                {usersLoading ? (
                  <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : users && users.length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className={getRoleBadge(user.role)}>{user.role}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(user.joined), { addSuffix: true, locale: es })}
                          </span>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Users className="h-8 w-8 mb-2" /><p>No se encontraron usuarios</p>
                  </div>
                )}
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            <Card className="border-border/40">
              <ScrollArea className="h-[400px]">
                {listingsLoading ? (
                  <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : listings && listings.length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {listings.map((listing) => (
                      <div key={listing.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{listing.title}</p>
                            <p className="text-sm text-muted-foreground">{listing.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-semibold text-primary">{formatPrice(listing.price)}</p>
                          <Badge variant="secondary" className={
                            listing.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                            listing.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : ''
                          }>{listing.status === 'active' ? 'Activa' : listing.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Building2 className="h-8 w-8 mb-2" /><p>No hay propiedades registradas</p>
                  </div>
                )}
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="reservations"><ReservationsManager /></TabsContent>
          <TabsContent value="documents"><DocumentsTab /></TabsContent>
          <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
          <TabsContent value="security"><SecurityTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardAdmin;
